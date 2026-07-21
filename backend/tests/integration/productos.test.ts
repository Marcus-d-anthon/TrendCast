import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

async function crearCategoria(token: string, nombre = "Suplementos") {
  const res = await request(app).post("/api/categorias").set("Authorization", `Bearer ${token}`).send({ nombre });
  return res.body.data.id as string;
}

function payloadProducto(fixtures: FixturesBase, categoriaId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nombre: "Producto de prueba",
    categoriaId,
    marcaId: fixtures.marcaId,
    unidadMedidaId: fixtures.unidadMedidaId,
    precioCompra: 6,
    precioVenta: 10,
    ...overrides,
  };
}

describe("Modulo Productos", () => {
  let tokenAdmin: string;
  let tokenOperador: string;
  let categoriaId: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
    categoriaId = await crearCategoria(tokenAdmin);
  });

  it("crea un producto y su stock (cantidad 0) en cada almacen activo, en la misma transaccion", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-001" }));

    expect(res.status).toBe(201);
    expect(res.body.data.stocks).toHaveLength(1);
    expect(res.body.data.stocks[0]).toMatchObject({ cantidad: 0, almacenId: fixtures.almacenId });

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId: res.body.data.id, almacenId: fixtures.almacenId } },
    });
    expect(stock).not.toBeNull();
    expect(stock?.cantidad).toBe(0);
  });

  it("registra la creacion del producto en audit_log (incluso dentro de la transaccion)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-002" }));

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "Producto", registroId: res.body.data.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].accion).toBe("CREATE");
  });

  it("rechaza SKU duplicado (409)", async () => {
    await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-DUP" }));

    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-DUP" }));

    expect(res.status).toBe(409);
  });

  it("rechaza categoria inexistente (404)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, "00000000-0000-0000-0000-000000000000", { sku: "SKU-003" }));

    expect(res.status).toBe(404);
  });

  it("rechaza marca inexistente (404)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-003B", marcaId: "00000000-0000-0000-0000-000000000000" }));

    expect(res.status).toBe(404);
  });

  it("rechaza precio de venta negativo (400, validacion Zod)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-004", precioVenta: -5 }));

    expect(res.status).toBe(400);
  });

  it("rechaza crear producto con rol BODEGA (403)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenOperador}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-005" }));

    expect(res.status).toBe(403);
  });

  it("el soft delete oculta el producto de listados pero conserva la fila y su stock", async () => {
    const crear = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-006" }));
    const id = crear.body.data.id;

    const del = await request(app).delete(`/api/productos/${id}`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(del.status).toBe(204);

    const listado = await request(app).get("/api/productos").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(listado.body.data).toHaveLength(0);

    const filaCruda = await prisma.producto.findUnique({ where: { id } });
    expect(filaCruda).not.toBeNull();
    expect(filaCruda?.deletedAt).not.toBeNull();

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId: id, almacenId: fixtures.almacenId } },
    });
    expect(stock).not.toBeNull();
  });

  it("lista productos con su categoria y stock incluidos (lectura permitida a BODEGA)", async () => {
    await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(payloadProducto(fixtures, categoriaId, { sku: "SKU-007" }));

    const res = await request(app).get("/api/productos").set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].categoria.id).toBe(categoriaId);
    expect(res.body.data[0].stocks[0].cantidad).toBe(0);
  });
});
