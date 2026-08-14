import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

async function crearProducto(token: string, fixtures: FixturesBase, overrides: Partial<Record<string, unknown>> = {}) {
  const categoria = await request(app)
    .post("/api/categorias")
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: `Categoria-${Date.now()}-${Math.random()}` });

  const producto = await request(app)
    .post("/api/productos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nombre: "Producto de prueba",
      categoriaId: categoria.body.data.id,
      marcaId: fixtures.marcaId,
      unidadMedidaId: fixtures.unidadMedidaId,
      precioCompra: 6,
      precioVenta: 10,
      ...overrides,
    });

  return producto.body.data as { id: string; sku: string; activo: boolean };
}

function stockDe(productoId: string, almacenId: string) {
  return prisma.stock.findUnique({ where: { productoId_almacenId: { productoId, almacenId } } });
}

describe("Modulo Movimientos", () => {
  let tokenAdmin: string;
  let adminId: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    const admin = await crearUsuarioYObtenerToken(app, "ADMIN");
    tokenAdmin = admin.token;
    adminId = admin.usuarioId;
  });

  it("registra una ENTRADA y actualiza el stock", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);

    const res = await request(app).post("/api/movimientos").set("Authorization", `Bearer ${tokenAdmin}`).send({
      productoId: producto.id,
      almacenId: fixtures.almacenId,
      tipo: "ENTRADA",
      cantidad: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.saldoResultante).toBe(10);

    const stock = await stockDe(producto.id, fixtures.almacenId);
    expect(stock?.cantidad).toBe(10);
  });

  it("registra una SALIDA y descuenta el stock", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });

    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "SALIDA", cantidad: 4 });

    expect(res.status).toBe(201);
    expect(res.body.data.saldoResultante).toBe(6);

    const stock = await stockDe(producto.id, fixtures.almacenId);
    expect(stock?.cantidad).toBe(6);
  });

  it("rechaza una SALIDA que dejaria el stock negativo (409)", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 5 });

    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "SALIDA", cantidad: 100 });

    expect(res.status).toBe(409);

    const stock = await stockDe(producto.id, fixtures.almacenId);
    expect(stock?.cantidad).toBe(5);
  });

  it("el CHECK de base de datos rechaza saldo_resultante negativo aunque se bypasee el Service", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);

    await expect(
      prisma.movimientoInventario.create({
        data: {
          tipo: "SALIDA",
          cantidad: 5,
          saldoResultante: -1,
          productoId: producto.id,
          almacenId: fixtures.almacenId,
          usuarioId: adminId,
        },
      })
    ).rejects.toThrow();
  });

  it("el CHECK de base de datos rechaza cantidad <= 0 aunque se bypasee el Service", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);

    await expect(
      prisma.movimientoInventario.create({
        data: {
          tipo: "ENTRADA",
          cantidad: 0,
          saldoResultante: 10,
          productoId: producto.id,
          almacenId: fixtures.almacenId,
          usuarioId: adminId,
        },
      })
    ).rejects.toThrow();
  });

  it("un AJUSTE crea una fila nueva que referencia al movimiento original y fija el saldo", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    const entrada = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });

    const ajuste = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        productoId: producto.id,
        almacenId: fixtures.almacenId,
        tipo: "AJUSTE",
        cantidad: 8,
        motivo: "Conteo fisico encontro 8 unidades",
        movimientoOrigenId: entrada.body.data.id,
      });

    expect(ajuste.status).toBe(201);
    expect(ajuste.body.data.saldoResultante).toBe(8);
    expect(ajuste.body.data.movimientoOrigenId).toBe(entrada.body.data.id);

    const stock = await stockDe(producto.id, fixtures.almacenId);
    expect(stock?.cantidad).toBe(8);

    // El movimiento original sigue intacto (append-only, nunca se edita).
    const original = await prisma.movimientoInventario.findUnique({ where: { id: entrada.body.data.id } });
    expect(original?.saldoResultante).toBe(10);
  });

  it("rechaza un AJUSTE sin movimientoOrigenId (400)", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);

    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "AJUSTE", cantidad: 8 });

    expect(res.status).toBe(400);
  });

  it("rechaza registrar movimientos sobre un producto inactivo (409)", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    await request(app)
      .put(`/api/productos/${producto.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ activo: false });

    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 5 });

    expect(res.status).toBe(409);
  });

  it("registra el movimiento en audit_log (escrito explicitamente dentro de la transaccion)", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "MovimientoInventario", registroId: res.body.data.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].accion).toBe("CREATE");
    expect(logs[0].usuarioId).toBe(adminId);
  });

  it("bloquea update/delete directos sobre movimientos_inventario (libro inmutable)", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    const res = await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });
    const id = res.body.data.id;

    await expect(
      prisma.movimientoInventario.update({ where: { id }, data: { motivo: "intento de editar" } })
    ).rejects.toThrow("inmutables");

    await expect(prisma.movimientoInventario.delete({ where: { id } })).rejects.toThrow("no pueden eliminarse");
  });

  it("lista movimientos filtrados por producto", async () => {
    const productoA = await crearProducto(tokenAdmin, fixtures);
    const productoB = await crearProducto(tokenAdmin, fixtures);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: productoA.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 3 });
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: productoB.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 7 });

    const res = await request(app)
      .get(`/api/movimientos?productoId=${productoA.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].productoId).toBe(productoA.id);
  });

  it("GET /api/movimientos?page=1 pagina 10 por pagina con metadatos", async () => {
    const producto = await crearProducto(tokenAdmin, fixtures);
    for (let i = 0; i < 12; i++) {
      await request(app)
        .post("/api/movimientos")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 1 });
    }

    const sinPaginar = await request(app).get("/api/movimientos").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(sinPaginar.body.meta).toBeUndefined();

    const pagina1 = await request(app).get("/api/movimientos?page=1").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(pagina1.body.data).toHaveLength(10);
    expect(pagina1.body.meta).toMatchObject({ total: 12, page: 1, totalPaginas: 2 });

    const pagina2 = await request(app).get("/api/movimientos?page=2").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(pagina2.body.data).toHaveLength(2);
  });
});
