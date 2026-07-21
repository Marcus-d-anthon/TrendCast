import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
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

describe("Modulo Notificaciones", () => {
  let tokenAdmin: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
  });

  it("una alerta nueva genera una notificacion interna para el ADMIN", async () => {
    await crearProductoConStockMinimo(tokenAdmin, fixtures, 5); // nace en 0, dispara AGOTADO
    await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`); // sincroniza Alerta -> Notificacion

    const res = await request(app).get("/api/notificaciones").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].canal).toBe("SISTEMA");
    expect(res.body.data[0].leida).toBe(false);
  });

  it("no duplica la notificacion en sincronizaciones repetidas de la misma alerta", async () => {
    await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);

    await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`); // sincroniza otra vez
    await request(app).get("/api/alertas/persistidas").set("Authorization", `Bearer ${tokenAdmin}`); // y otra vez

    const res = await request(app).get("/api/notificaciones").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.body.data).toHaveLength(1);
  });

  it("GET /api/notificaciones/no-leidas cuenta correctamente", async () => {
    await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`);

    const res = await request(app).get("/api/notificaciones/no-leidas").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  it("PATCH /:id/leida marca como leida y actualiza el conteo", async () => {
    await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`);
    const lista = await request(app).get("/api/notificaciones").set("Authorization", `Bearer ${tokenAdmin}`);
    const notificacionId = lista.body.data[0].id;

    const res = await request(app).patch(`/api/notificaciones/${notificacionId}/leida`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.leida).toBe(true);

    const conteo = await request(app).get("/api/notificaciones/no-leidas").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(conteo.body.data.total).toBe(0);
  });

  it("rechaza marcar como leida una notificacion de otro usuario (403)", async () => {
    await crearProductoConStockMinimo(tokenAdmin, fixtures, 5);
    await request(app).get("/api/alertas").set("Authorization", `Bearer ${tokenAdmin}`);
    const lista = await request(app).get("/api/notificaciones").set("Authorization", `Bearer ${tokenAdmin}`);
    const notificacionId = lista.body.data[0].id;

    const tokenSupervisor = (await crearUsuarioYObtenerToken(app, "SUPERVISOR")).token;
    const res = await request(app)
      .patch(`/api/notificaciones/${notificacionId}/leida`)
      .set("Authorization", `Bearer ${tokenSupervisor}`);
    expect(res.status).toBe(403);
  });
});
