import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Solicitudes", () => {
  let tokenAdmin: string;
  let tokenBodega: string;
  let tokenGerencia: string;
  let tokenSupervisor: string;
  let fixtures: FixturesBase;
  let productoId: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenBodega = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
    tokenGerencia = (await crearUsuarioYObtenerToken(app, "GERENCIA")).token;
    tokenSupervisor = (await crearUsuarioYObtenerToken(app, "SUPERVISOR")).token;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria solicitudes" });
    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-SOL-001",
        nombre: "Producto para solicitudes",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
      });
    productoId = producto.body.data.id;
  });

  function payloadSolicitud(tipo: "REABASTECIMIENTO" | "VENTA_ESPECIAL" = "REABASTECIMIENTO", cantidad = 10) {
    return { tipo, productoId, almacenId: fixtures.almacenId, cantidad };
  }

  async function crearSolicitud(tipo: "REABASTECIMIENTO" | "VENTA_ESPECIAL" = "REABASTECIMIENTO", cantidad = 10) {
    const res = await request(app)
      .post("/api/solicitudes")
      .set("Authorization", `Bearer ${tokenBodega}`)
      .send(payloadSolicitud(tipo, cantidad));
    return res.body.data.id as string;
  }

  it("crea una solicitud PENDIENTE (BODEGA)", async () => {
    const res = await request(app).post("/api/solicitudes").set("Authorization", `Bearer ${tokenBodega}`).send(payloadSolicitud());
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe("PENDIENTE");
  });

  it("aprueba una solicitud PENDIENTE (GERENCIA)", async () => {
    const id = await crearSolicitud();
    const res = await request(app).patch(`/api/solicitudes/${id}/aprobar`).set("Authorization", `Bearer ${tokenGerencia}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("APROBADA");
    expect(res.body.data.aprobador).toBeTruthy();
  });

  it("rechaza una solicitud PENDIENTE con motivo (GERENCIA)", async () => {
    const id = await crearSolicitud();
    const res = await request(app)
      .patch(`/api/solicitudes/${id}/rechazar`)
      .set("Authorization", `Bearer ${tokenGerencia}`)
      .send({ motivo: "No hay presupuesto este mes" });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("RECHAZADA");
    expect(res.body.data.motivoRechazo).toBe("No hay presupuesto este mes");
  });

  it("rechaza aprobar una solicitud que no esta PENDIENTE (409)", async () => {
    const id = await crearSolicitud();
    await request(app).patch(`/api/solicitudes/${id}/aprobar`).set("Authorization", `Bearer ${tokenGerencia}`);

    const res = await request(app).patch(`/api/solicitudes/${id}/aprobar`).set("Authorization", `Bearer ${tokenGerencia}`);
    expect(res.status).toBe(409);
  });

  it("rechaza efectuar una solicitud que no esta APROBADA (409)", async () => {
    const id = await crearSolicitud();
    const res = await request(app).patch(`/api/solicitudes/${id}/efectuar`).set("Authorization", `Bearer ${tokenSupervisor}`);
    expect(res.status).toBe(409);
  });

  it("efectuar una solicitud APROBADA de REABASTECIMIENTO genera un movimiento ENTRADA real y actualiza stock", async () => {
    const id = await crearSolicitud("REABASTECIMIENTO", 15);
    await request(app).patch(`/api/solicitudes/${id}/aprobar`).set("Authorization", `Bearer ${tokenGerencia}`);

    const res = await request(app).patch(`/api/solicitudes/${id}/efectuar`).set("Authorization", `Bearer ${tokenSupervisor}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("EFECTUADA");

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stock?.cantidad).toBe(15);

    const movimientos = await prisma.movimientoInventario.findMany({ where: { solicitudId: id } });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "ENTRADA", cantidad: 15, saldoResultante: 15 });

    const logs = await prisma.auditLog.findMany({ where: { entidad: "MovimientoInventario", registroId: movimientos[0].id } });
    expect(logs).toHaveLength(1);
  });

  it("efectuar una VENTA_ESPECIAL sin stock suficiente responde 409 y no cambia el estado", async () => {
    const id = await crearSolicitud("VENTA_ESPECIAL", 5);
    await request(app).patch(`/api/solicitudes/${id}/aprobar`).set("Authorization", `Bearer ${tokenGerencia}`);

    const res = await request(app).patch(`/api/solicitudes/${id}/efectuar`).set("Authorization", `Bearer ${tokenSupervisor}`);
    expect(res.status).toBe(409);

    const solicitud = await prisma.solicitud.findUniqueOrThrow({ where: { id } });
    expect(solicitud.estado).toBe("APROBADA");

    const movimientos = await prisma.movimientoInventario.findMany({ where: { solicitudId: id } });
    expect(movimientos).toHaveLength(0);
  });
});
