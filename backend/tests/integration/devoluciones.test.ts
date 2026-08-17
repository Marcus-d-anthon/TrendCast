import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Devoluciones", () => {
  let tokenAdmin: string;
  let fixtures: FixturesBase;
  let clienteId: string;
  let proveedorId: string;
  let productoId: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;

    const cliente = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    clienteId = cliente.body.data.id;

    const proveedor = await request(app)
      .post("/api/proveedores")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "RUC", numeroDocumento: "1790111111001", razonSocial: "Proveedor de prueba" });
    proveedorId = proveedor.body.data.id;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria devoluciones" });
    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-DEV-001",
        nombre: "Producto para devolver",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
      });
    productoId = producto.body.data.id;

    // ENTRADA previa para tener stock disponible que vender.
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 20 });
  });

  async function crearYConfirmarVenta(cantidad = 10) {
    const crear = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ clienteId, almacenId: fixtures.almacenId, detalle: [{ productoId, cantidad, precioUnitario: 9 }] });
    const ventaId = crear.body.data.id;
    await request(app).post(`/api/ventas/${ventaId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    return ventaId;
  }

  async function crearYConfirmarCompra(cantidad = 10) {
    const crear = await request(app)
      .post("/api/compras")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ proveedorId, almacenId: fixtures.almacenId, detalle: [{ productoId, cantidad, precioUnitario: 5 }] });
    const compraId = crear.body.data.id;
    await request(app).post(`/api/compras/${compraId}/confirmar`).set("Authorization", `Bearer ${tokenAdmin}`);
    return compraId;
  }

  it("crea y confirma una devolucion de cliente: el stock sube y el movimiento queda DEVOLUCION_CLIENTE", async () => {
    const ventaId = await crearYConfirmarVenta(10);
    const stockTrasVenta = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stockTrasVenta?.cantidad).toBe(10); // 20 entrada - 10 vendidas

    const crear = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", ventaId, motivo: "Producto defectuoso", detalle: [{ productoId, cantidad: 4 }] });
    expect(crear.status).toBe(201);
    expect(crear.body.data.estado).toBe("BORRADOR");
    const devolucionId = crear.body.data.id;

    const confirmar = await request(app)
      .post(`/api/devoluciones/${devolucionId}/confirmar`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(confirmar.status).toBe(200);
    expect(confirmar.body.data.estado).toBe("CONFIRMADA");

    const stockTrasDevolucion = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stockTrasDevolucion?.cantidad).toBe(14); // 10 + 4 devueltas

    const movimientos = await prisma.movimientoInventario.findMany({ where: { devolucionId } });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "DEVOLUCION_CLIENTE", cantidad: 4, saldoResultante: 14, ventaId });
  });

  it("crea y confirma una devolucion a proveedor: el stock baja y el movimiento queda DEVOLUCION_PROVEEDOR", async () => {
    const compraId = await crearYConfirmarCompra(10);
    const stockTrasCompra = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stockTrasCompra?.cantidad).toBe(30); // 20 entrada + 10 compradas

    const crear = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "PROVEEDOR", compraId, motivo: "Mercaderia en mal estado", detalle: [{ productoId, cantidad: 3 }] });
    expect(crear.status).toBe(201);
    const devolucionId = crear.body.data.id;

    const confirmar = await request(app)
      .post(`/api/devoluciones/${devolucionId}/confirmar`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(confirmar.status).toBe(200);

    const stockTrasDevolucion = await prisma.stock.findUnique({
      where: { productoId_almacenId: { productoId, almacenId: fixtures.almacenId } },
    });
    expect(stockTrasDevolucion?.cantidad).toBe(27); // 30 - 3 devueltas al proveedor

    const movimientos = await prisma.movimientoInventario.findMany({ where: { devolucionId } });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "DEVOLUCION_PROVEEDOR", cantidad: 3, saldoResultante: 27, compraId });
  });

  it("rechaza devolver mas unidades de las vendidas (409)", async () => {
    const ventaId = await crearYConfirmarVenta(5);

    const res = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", ventaId, motivo: "Excede lo vendido", detalle: [{ productoId, cantidad: 6 }] });

    expect(res.status).toBe(409);
  });

  it("rechaza acumular devoluciones que superen lo vendido entre varias devoluciones confirmadas (409)", async () => {
    const ventaId = await crearYConfirmarVenta(10);

    const primera = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", ventaId, motivo: "Primera devolucion", detalle: [{ productoId, cantidad: 7 }] });
    await request(app)
      .post(`/api/devoluciones/${primera.body.data.id}/confirmar`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    const segunda = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", ventaId, motivo: "Segunda devolucion", detalle: [{ productoId, cantidad: 4 }] });

    expect(segunda.status).toBe(409);
  });

  it("rechaza registrar una devolucion de una venta que sigue en BORRADOR (409)", async () => {
    const crear = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ clienteId, almacenId: fixtures.almacenId, detalle: [{ productoId, cantidad: 5, precioUnitario: 9 }] });
    const ventaId = crear.body.data.id;

    const res = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", ventaId, motivo: "Venta aun no confirmada", detalle: [{ productoId, cantidad: 1 }] });

    expect(res.status).toBe(409);
  });

  it("rechaza crear una devolucion de tipo CLIENTE con compraId en vez de ventaId (400)", async () => {
    const compraId = await crearYConfirmarCompra(5);

    const res = await request(app)
      .post("/api/devoluciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipo: "CLIENTE", compraId, motivo: "Combinacion invalida", detalle: [{ productoId, cantidad: 1 }] });

    expect(res.status).toBe(400);
  });
});
