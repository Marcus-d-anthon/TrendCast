import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Ventas", () => {
  let tokenAdmin: string;
  let tokenBodega: string;
  let fixtures: FixturesBase;
  let clienteId: string;
  let productoId: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenBodega = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;

    const cliente = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    clienteId = cliente.body.data.id;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria ventas" });
    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-VEN-001",
        nombre: "Producto para vender",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
        stockMinimo: 5,
      });
    productoId = producto.body.data.id;

    // ENTRADA previa para tener stock disponible que vender.
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 20 });
  });

  function payloadVenta(cantidad = 5, precioUnitario = 9) {
    return {
      clienteId,
      almacenId: fixtures.almacenId,
      detalle: [{ productoId, cantidad, precioUnitario }],
    };
  }

  it("crea una venta en BORRADOR con totales calculados (subtotal + IVA 15%)", async () => {
    const res = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta(5, 9));

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe("BORRADOR");
    expect(Number(res.body.data.subtotal)).toBe(45);
    expect(Number(res.body.data.impuesto)).toBe(6.75);
    expect(Number(res.body.data.total)).toBe(51.75);
    expect(res.body.data.numero).toMatch(/^VEN-\d{4}-\d{4}$/);
  });

  it("rechaza crear venta con rol BODEGA (403, sin permiso ventas.crear)", async () => {
    const res = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenBodega}`).send(payloadVenta());
    expect(res.status).toBe(403);
  });

  it("confirmar una venta genera un movimiento SALIDA real y descuenta el stock", async () => {
    const crear = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta(5, 9));
    const ventaId = crear.body.data.id;

    const confirmar = await request(app).post(`/api/ventas/${ventaId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(confirmar.status).toBe(200);
    expect(confirmar.body.data.estado).toBe("CONFIRMADA");

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stock?.cantidad).toBe(15); // 20 - 5

    const movimientos = await prisma.movimientoInventario.findMany({ where: { ventaId } });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "SALIDA", cantidad: 5, saldoResultante: 15 });
  });

  it("rechaza confirmar una venta que dejaria el stock negativo (409)", async () => {
    const crear = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta(999, 9));
    const ventaId = crear.body.data.id;

    const res = await request(app).post(`/api/ventas/${ventaId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(409);

    // El stock no debe haberse tocado: la transaccion se revierte completa.
    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stock?.cantidad).toBe(20);
  });

  it("rechaza confirmar una venta ya confirmada (409)", async () => {
    const crear = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta(2, 9));
    const ventaId = crear.body.data.id;
    await request(app).post(`/api/ventas/${ventaId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app).post(`/api/ventas/${ventaId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(409);
  });

  it("anula una venta en BORRADOR", async () => {
    const crear = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta());
    const ventaId = crear.body.data.id;

    const res = await request(app).post(`/api/ventas/${ventaId}/anular`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("ANULADA");
  });

  it("lista ventas con su detalle y cliente incluidos", async () => {
    await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta());

    const res = await request(app).get("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].cliente.id).toBe(clienteId);
    expect(res.body.data[0].detalle).toHaveLength(1);
  });

  it("GET /api/ventas?page=1&estado=BORRADOR pagina y filtra por estado", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta());
    }
    const confirmada = await request(app).post("/api/ventas").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadVenta());
    await request(app).post(`/api/ventas/${confirmada.body.data.id}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app)
      .get("/api/ventas?page=1&pageSize=10&estado=BORRADOR")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toMatchObject({ total: 3, page: 1, totalPaginas: 1 });
    expect(res.body.data.every((v: { estado: string }) => v.estado === "BORRADOR")).toBe(true);
  });
});
