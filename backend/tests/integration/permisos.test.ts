import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

// Verifica que la autorizacion en los modulos nuevos realmente la gobierna
// la matriz roles_permisos sembrada (requirePermission), no una lista de
// roles fija en el codigo -- si se cambia la matriz sin tocar rutas, este
// comportamiento cambia solo.
describe("Permisos granulares por rol (requirePermission)", () => {
  let fixtures: FixturesBase;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixtures = await asegurarFixturesBase();
  });

  it("SUPERVISOR puede crear un cliente (clientes.crear) pero no eliminarlo (sin clientes.eliminar)", async () => {
    const tokenSupervisor = (await crearUsuarioYObtenerToken(app, "SUPERVISOR")).token;

    const crear = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenSupervisor}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    expect(crear.status).toBe(201);

    const eliminar = await request(app)
      .delete(`/api/clientes/${crear.body.data.id}`)
      .set("Authorization", `Bearer ${tokenSupervisor}`);
    expect(eliminar.status).toBe(403);
  });

  it("VENTAS puede crear un cliente (clientes.crear) pero no puede crear una marca (sin productos.crear)", async () => {
    const tokenVentas = (await crearUsuarioYObtenerToken(app, "VENTAS")).token;

    const cliente = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenVentas}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    expect(cliente.status).toBe(201);

    const marca = await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenVentas}`).send({ nombre: "Marca X" });
    expect(marca.status).toBe(403);
  });

  it("BODEGA puede transferir stock (inventario.crear) pero no crear un almacen (sin almacenes.crear)", async () => {
    const tokenBodega = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
    const tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Categoria permisos" });
    const producto = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        sku: "SKU-PERM-001",
        nombre: "Producto permisos",
        categoriaId: categoria.body.data.id,
        marcaId: fixtures.marcaId,
        unidadMedidaId: fixtures.unidadMedidaId,
        precioCompra: 4,
        precioVenta: 7,
      });
    await request(app)
      .post("/api/movimientos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ productoId: producto.body.data.id, almacenId: fixtures.almacenId, tipo: "ENTRADA", cantidad: 10 });

    const nuevoAlmacen = await request(app).post("/api/almacenes").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Bodega Permisos" });

    const transferencia = await request(app)
      .post("/api/almacenes/transferencias")
      .set("Authorization", `Bearer ${tokenBodega}`)
      .send({
        productoId: producto.body.data.id,
        almacenOrigenId: fixtures.almacenId,
        almacenDestinoId: nuevoAlmacen.body.data.id,
        cantidad: 3,
      });
    expect(transferencia.status).toBe(201);

    const crearAlmacen = await request(app)
      .post("/api/almacenes")
      .set("Authorization", `Bearer ${tokenBodega}`)
      .send({ nombre: "Otra Bodega" });
    expect(crearAlmacen.status).toBe(403);
  });

  it("GERENCIA puede leer pero no crear en ningun modulo nuevo (solo permisos .ver)", async () => {
    const tokenGerencia = (await crearUsuarioYObtenerToken(app, "GERENCIA")).token;

    const leer = await request(app).get("/api/clientes").set("Authorization", `Bearer ${tokenGerencia}`);
    expect(leer.status).toBe(200);

    const crear = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenGerencia}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Cliente de prueba" });
    expect(crear.status).toBe(403);
  });
});
