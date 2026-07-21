import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

function fechaHaceMeses(meses: number): Date {
  const fecha = new Date();
  fecha.setUTCDate(1); // fija el dia para evitar que meses de distinta longitud crucen de bucket
  fecha.setUTCMonth(fecha.getUTCMonth() - meses);
  return fecha;
}

describe("Modulo Predictivo", () => {
  let tokenAdmin: string;
  let adminId: string;
  let productoId: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    const admin = await crearUsuarioYObtenerToken(app, "ADMIN");
    tokenAdmin = admin.token;
    adminId = admin.usuarioId;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria predictivo" });

    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-PRED",
        nombre: "Producto Predictivo",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 3,
        precioVenta: 5,
        stockMinimo: 10,
      });
    productoId = producto.body.data.id;

    // Historial de 3 meses de SALIDA con demanda 10, 12, 14 (progresion lineal
    // exacta: regresion a=8 b=2, proyeccion del 4to periodo = 16; ver el
    // calculo a mano en tests/unit/prediccion.math.test.ts).
    const demandaPorMes = [10, 12, 14];
    for (let i = 0; i < demandaPorMes.length; i++) {
      const mesesAtras = demandaPorMes.length - 1 - i;
      await prisma.movimientoInventario.create({
        data: {
          tipo: "SALIDA",
          cantidad: demandaPorMes[i],
          saldoResultante: 100, // arbitrario: no interviene en el calculo predictivo
          productoId,
          almacenId: fixtures.almacenId,
          usuarioId: adminId,
          fecha: fechaHaceMeses(mesesAtras),
        },
      });
    }

    // Deja un stock actual conocido para probar la recomendacion de reabastecimiento.
    await prisma.stock.update({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
      data: { cantidad: 5 },
    });
  });

  it("agrupa el historial por mes y calcula SMA + regresion lineal", async () => {
    const res = await request(app)
      .get(`/api/prediccion/${productoId}?periodos=6&granularidad=mensual`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.historico).toHaveLength(3);
    expect(res.body.data.historico.map((p: { demanda: number }) => p.demanda)).toEqual([10, 12, 14]);

    // SMA de ventana 3: (10+12+14)/3 = 12
    expect(res.body.data.promedioMovil.proyeccionProximoPeriodo).toBeCloseTo(12);

    // Regresion lineal exacta: a=8, b=2, proyeccion del periodo 4 = 16
    expect(res.body.data.regresionLineal.interceptoA).toBeCloseTo(8);
    expect(res.body.data.regresionLineal.pendienteB).toBeCloseTo(2);
    expect(res.body.data.regresionLineal.proyeccionProximoPeriodo).toBeCloseTo(16);
  });

  it("calcula la recomendacion de reabastecimiento con base en stock actual y minimo", async () => {
    const res = await request(app)
      .get(`/api/prediccion/${productoId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    // demandaProyectada=16, stockMinimo=10, stockActual=5 -> max(0, 16+10-5) = 21
    expect(res.body.data.recomendacionReabastecimiento).toBe(21);
  });

  it("responde 404 para un producto inexistente", async () => {
    const res = await request(app)
      .get("/api/prediccion/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });

  it("respeta el parametro periodos limitando la ventana historica usada", async () => {
    const res = await request(app)
      .get(`/api/prediccion/${productoId}?periodos=2`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.historico).toHaveLength(2);
    expect(res.body.data.historico.map((p: { demanda: number }) => p.demanda)).toEqual([12, 14]);
  });
});
