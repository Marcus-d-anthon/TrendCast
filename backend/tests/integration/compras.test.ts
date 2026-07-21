import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Compras", () => {
  let tokenAdmin: string;
  let tokenBodega: string;
  let fixtures: FixturesBase;
  let proveedorId: string;
  let productoId: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenBodega = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;

    const proveedor = await request(app)
      .post("/api/proveedores")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "RUC", numeroDocumento: "1790111111001", razonSocial: "Proveedor de prueba" });
    proveedorId = proveedor.body.data.id;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria compras" });
    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-COM-001",
        nombre: "Producto para comprar",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
      });
    productoId = producto.body.data.id;
  });

  function payloadCompra(cantidad = 10, precioUnitario = 5) {
    return {
      proveedorId,
      almacenId: fixtures.almacenId,
      detalle: [{ productoId, cantidad, precioUnitario }],
    };
  }

  it("crea una compra en BORRADOR con totales calculados (subtotal + IVA 15%)", async () => {
    const res = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra(10, 5));

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe("BORRADOR");
    expect(Number(res.body.data.subtotal)).toBe(50);
    expect(Number(res.body.data.impuesto)).toBe(7.5);
    expect(Number(res.body.data.total)).toBe(57.5);
    expect(res.body.data.numero).toMatch(/^COM-\d{4}-\d{4}$/);
  });

  it("rechaza crear compra con rol BODEGA (403, sin permiso compras.crear)", async () => {
    const res = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenBodega}`).send(payloadCompra());
    expect(res.status).toBe(403);
  });

  it("rechaza proveedor inexistente (404)", async () => {
    const res = await request(app)
      .post("/api/compras")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ ...payloadCompra(), proveedorId: "00000000-0000-0000-0000-000000000000" });
    expect(res.status).toBe(404);
  });

  it("confirmar una compra genera un movimiento ENTRADA real y actualiza el stock", async () => {
    const crear = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra(10, 5));
    const compraId = crear.body.data.id;

    const confirmar = await request(app).post(`/api/compras/${compraId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(confirmar.status).toBe(200);
    expect(confirmar.body.data.estado).toBe("CONFIRMADA");

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stock?.cantidad).toBe(10);

    const movimientos = await prisma.movimientoInventario.findMany({ where: { compraId } });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "ENTRADA", cantidad: 10, saldoResultante: 10 });

    const logs = await prisma.auditLog.findMany({ where: { entidad: "MovimientoInventario", registroId: movimientos[0].id } });
    expect(logs).toHaveLength(1);
  });

  it("rechaza confirmar una compra ya confirmada (409)", async () => {
    const crear = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra());
    const compraId = crear.body.data.id;
    await request(app).post(`/api/compras/${compraId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app).post(`/api/compras/${compraId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(409);
  });

  it("anula una compra en BORRADOR", async () => {
    const crear = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra());
    const compraId = crear.body.data.id;

    const res = await request(app).post(`/api/compras/${compraId}/anular`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("ANULADA");
  });

  it("rechaza anular una compra ya confirmada (409)", async () => {
    const crear = await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra());
    const compraId = crear.body.data.id;
    await request(app).post(`/api/compras/${compraId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app).post(`/api/compras/${compraId}/anular`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(409);
  });

  it("lista compras con su detalle y proveedor incluidos", async () => {
    await request(app).post("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`).send(payloadCompra());

    const res = await request(app).get("/api/compras").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].proveedor.id).toBe(proveedorId);
    expect(res.body.data[0].detalle).toHaveLength(1);
  });
});
