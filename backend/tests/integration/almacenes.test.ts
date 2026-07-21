import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Almacenes", () => {
  let tokenAdmin: string;
  let tokenOperador: string;
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
  });

  it("crea un almacen con rol ADMIN", async () => {
    const res = await request(app)
      .post("/api/almacenes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Bodega Cuenca", direccion: "Av. Solano" });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe("Bodega Cuenca");
  });

  it("rechaza crear con rol BODEGA (403)", async () => {
    const res = await request(app).post("/api/almacenes").set("Authorization", `Bearer ${tokenOperador}`).send({ nombre: "Bodega X" });
    expect(res.status).toBe(403);
  });

  it("rechaza nombre duplicado (409)", async () => {
    await request(app).post("/api/almacenes").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Bodega Cuenca" });
    const res = await request(app).post("/api/almacenes").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Bodega Cuenca" });
    expect(res.status).toBe(409);
  });

  it("al crear un almacen nuevo, genera Stock en cero para cada producto activo existente", async () => {
    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria almacenes" });

    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-ALM-001",
        nombre: "Producto para almacen nuevo",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 8,
      });

    const nuevoAlmacen = await request(app)
      .post("/api/almacenes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Bodega Cuenca" });

    const stock = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId: producto.body.data.id, almacenId: nuevoAlmacen.body.data.id } },
    });
    expect(stock).not.toBeNull();
    expect(stock?.cantidad).toBe(0);
  });

  it("lista almacenes (lectura permitida a BODEGA)", async () => {
    await request(app).post("/api/almacenes").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Bodega Cuenca" });
    const res = await request(app).get("/api/almacenes").set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Transferencias entre almacenes", () => {
  let tokenAdmin: string;
  let fixtures: FixturesBase;
  let productoId: string;
  let almacenDestinoId: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria transferencias" });

    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-TRANS-001",
        nombre: "Producto para transferir",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
      });
    productoId = producto.body.data.id;

    // ENTRADA de stock en el almacen fixture, para tener de donde transferir.
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 20 });

    const nuevoAlmacen = await request(app)
      .post("/api/almacenes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Bodega Destino" });
    almacenDestinoId = nuevoAlmacen.body.data.id;
  });

  it("transfiere stock entre dos almacenes generando dos movimientos TRANSFERENCIA enlazados", async () => {
    const res = await request(app)
      .post("/api/almacenes/transferencias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenOrigenId: fixtures.almacenId, almacenDestinoId, cantidad: 8, motivo: "Redistribucion" });

    expect(res.status).toBe(201);
    expect(res.body.data.salida.saldoResultante).toBe(12);
    expect(res.body.data.entrada.saldoResultante).toBe(8);
    expect(res.body.data.entrada.movimientoOrigenId).toBe(res.body.data.salida.id);

    const stockOrigen = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    const stockDestino = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: almacenDestinoId } },
    });
    expect(stockOrigen?.cantidad).toBe(12);
    expect(stockDestino?.cantidad).toBe(8);
  });

  it("rechaza transferir mas cantidad de la disponible en el origen (409)", async () => {
    const res = await request(app)
      .post("/api/almacenes/transferencias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenOrigenId: fixtures.almacenId, almacenDestinoId, cantidad: 999 });

    expect(res.status).toBe(409);
  });

  it("rechaza origen y destino iguales (400)", async () => {
    const res = await request(app)
      .post("/api/almacenes/transferencias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenOrigenId: fixtures.almacenId, almacenDestinoId: fixtures.almacenId, cantidad: 5 });

    expect(res.status).toBe(400);
  });

  it("registra la transferencia en audit_log", async () => {
    const res = await request(app)
      .post("/api/almacenes/transferencias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenOrigenId: fixtures.almacenId, almacenDestinoId, cantidad: 5 });

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "MovimientoInventario", registroId: res.body.data.entrada.id },
    });
    expect(logs).toHaveLength(1);
  });
});
