import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

async function crearProductoConStockMinimo(token: string, fixtures: FixturesBase, stockMinimo: number) {
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
      stockMinimo,
    });

  return producto.body.data as { id: string };
}

describe("Modulo Alertas de stock minimo", () => {
  let tokenAdmin: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
  });

  it("incluye productos cuyo stock actual esta en o por debajo del minimo", async () => {
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 3 });

    const res = await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].productoId).toBe(producto.id);
    expect(res.body.data[0].unidadesFaltantes).toBe(2);
  });

  it("excluye productos cuyo stock esta por encima del minimo", async () => {
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });

    const res = await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe("Alertas persistidas (GET /api/alertas/persistidas, PATCH /:id/resolver)", () => {
  let tokenAdmin: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
  });

  it("persiste una alerta STOCK_BAJO y la resuelve automaticamente al recuperar stock", async () => {
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 3 });

    const primeraLectura = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(primeraLectura.status).toBe(200);
    const alertaStockBajo = primeraLectura.body.data.find((a: { tipo: string; registroId: string }) => a.tipo === "STOCK_BAJO" && a.registroId === producto.id);
    expect(alertaStockBajo).toBeTruthy();

    // Recupera el stock por encima del minimo: la siguiente sincronizacion
    // debe resolver la alerta automaticamente.
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 20 });

    const segundaLectura = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const sigueAbierta = segundaLectura.body.data.find((a: { id: string }) => a.id === alertaStockBajo.id);
    expect(sigueAbierta).toBeUndefined();

    const filaCruda = await prisma.alerta.findUnique({ where: { id: alertaStockBajo.id } });
    expect(filaCruda?.resuelta).toBe(true);
  });

  it("persiste una alerta AGOTADO cuando el stock llega a cero", async () => {
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);

    const res = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const alerta = res.body.data.find((a: { tipo: string; registroId: string }) => a.tipo === "AGOTADO" && a.registroId === producto.id);
    expect(alerta).toBeTruthy();
  });

  it("genera una alerta COMPRA_PENDIENTE mientras la compra siga en BORRADOR y la resuelve al confirmarla", async () => {
    const proveedor = await request(app)
      .post("/api/proveedores")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "RUC", numeroDocumento: "1790111111001", razonSocial: "Proveedor de prueba" });
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);

    const compra = await request(app)
      .post("/api/compras")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        proveedorId: proveedor.body.data.id,
        almacenId: fixtures.almacenId,
        detalle: [{ productoId: producto.id, cantidad: 10, precioUnitario: 5 }],
      });

    const conPendiente = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const alertaPendiente = conPendiente.body.data.find(
      (a: { tipo: string; registroId: string }) => a.tipo === "COMPRA_PENDIENTE" && a.registroId === compra.body.data.id
    );
    expect(alertaPendiente).toBeTruthy();

    await request(app).post(`/api/compras/${compra.body.data.id}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);

    const sinPendiente = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const yaNoEsta = sinPendiente.body.data.find((a: { id: string }) => a.id === alertaPendiente.id);
    expect(yaNoEsta).toBeUndefined();
  });

  it("genera una alerta VENTA_ANULADA al anular una venta en borrador", async () => {
    const cliente = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);

    const venta = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        clienteId: cliente.body.data.id,
        almacenId: fixtures.almacenId,
        detalle: [{ productoId: producto.id, cantidad: 1, precioUnitario: 10 }],
      });
    await request(app).post(`/api/ventas/${venta.body.data.id}/anular`).set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const alerta = res.body.data.find(
      (a: { tipo: string; registroId: string }) => a.tipo === "VENTA_ANULADA" && a.registroId === venta.body.data.id
    );
    expect(alerta).toBeTruthy();
  });

  it("PATCH /:id/resolver marca una alerta como resuelta manualmente", async () => {
    const producto = await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    const lectura = await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`);
    const alerta = lectura.body.data.find((a: { registroId: string }) => a.registroId === producto.id);

    const res = await request(app).patch(`/api/alertas/${alerta.id}/resolver`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.resuelta).toBe(true);
  });

  it("responde 404 al resolver una alerta inexistente", async () => {
    const res = await request(app)
      .patch("/api/alertas/00000000-0000-0000-0000-000000000000/resolver")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });
});
