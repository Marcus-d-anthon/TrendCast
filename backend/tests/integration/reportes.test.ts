import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Reportes", () => {
  let tokenAdmin: string;
  let productoId: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria reportes" });

    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-REP",
        nombre: "Producto Reportes",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 2,
        precioVenta: 4,
      });
    productoId = producto.body.data.id;

    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 20 });
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenId: fixtures.almacenId, tipo: "SALIDA", cantidad: 6 });
  });

  it("GET /api/reportes/existencias resume unidades y valor total del inventario", async () => {
    const res = await request(app).get("/api/reportes/existencias").set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProductos).toBe(1);
    expect(res.body.data.totalUnidades).toBe(14); // 20 entrada - 6 salida
    expect(res.body.data.valorTotalInventario).toBe(56); // 14 unidades * 4 (precio de venta)
    expect(res.body.data.detalle[0].sku).toBe("SKU-REP");
  });

  it("GET /api/reportes/rotacion suma entradas y salidas por producto", async () => {
    const res = await request(app).get("/api/reportes/rotacion").set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ productoId, entradas: 20, salidas: 6, ajustes: 0 });
  });

  it("GET /api/reportes/movimientos-por-periodo agrupa por periodo y tipo", async () => {
    const res = await request(app)
      .get("/api/reportes/movimientos-por-periodo?granularidad=mensual")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const totalPorTipo = Object.fromEntries(res.body.data.map((f: { tipo: string; total: number }) => [f.tipo, f.total]));
    expect(totalPorTipo.ENTRADA).toBe(20);
    expect(totalPorTipo.SALIDA).toBe(6);
  });

  it("rechaza el acceso a reportes sin token (401)", async () => {
    const res = await request(app).get("/api/reportes/existencias");
    expect(res.status).toBe(401);
  });
});
