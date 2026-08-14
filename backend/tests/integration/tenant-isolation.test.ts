import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { runWithUsuarioActual } from "../../src/lib/async-context";
import { prisma } from "../../src/lib/prisma";
import { usuariosService } from "../../src/modules/usuarios/UsuariosService";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { asegurarFixturesBase, type FixturesBase } from "../helpers/fixtures";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();
const RUC_EMPRESA_B = "TEST-0000000002";

// Segunda empresa independiente, con su propio catalogo minimo -- mismo
// principio que asegurarFixturesBase()/conEmpresaDePruebas() en
// tests/helpers/empresa-context.ts, pero apuntando a un RUC distinto para
// probar aislamiento real entre dos tenants, no solo dentro de uno.
async function asegurarFixturesEmpresaB(): Promise<FixturesBase> {
  const empresa = await prisma.empresa.upsert({
    where: { ruc: RUC_EMPRESA_B },
    update: {},
    create: { ruc: RUC_EMPRESA_B, razonSocial: "Empresa B de Pruebas" },
  });
  const almacen = await prisma.almacen.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Almacen B" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Almacen B" },
  });
  const marca = await prisma.marca.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Marca B" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Marca B" },
  });
  const unidadMedida = await prisma.unidadMedida.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Unidad B" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Unidad B", abreviatura: "u" },
  });
  return { empresaId: empresa.id, almacenId: almacen.id, marcaId: marca.id, unidadMedidaId: unidadMedida.id };
}

async function crearUsuarioEnEmpresaB(rol: "ADMIN"): Promise<{ token: string }> {
  const fixturesB = await asegurarFixturesEmpresaB();
  const email = `b-${rol.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}@tiansi.test`;
  const password = "ClaveSegura123";
  await runWithUsuarioActual({ id: null, rol: "ADMIN", empresaId: fixturesB.empresaId }, () =>
    usuariosService.crear({ email, password, nombre: `Usuario B ${rol}`, rol })
  );
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return { token: res.body.data.token as string };
}

describe("Aislamiento entre empresas (Broken Access Control)", () => {
  let tokenA: string;
  let tokenB: string;
  let fixturesA: FixturesBase;
  let categoriaIdA: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    fixturesA = await asegurarFixturesBase();
    tokenA = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenB = (await crearUsuarioEnEmpresaB("ADMIN")).token;

    const categoria = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ nombre: "Categoria A" });
    categoriaIdA = categoria.body.data.id;
  });

  it("un producto creado en la empresa A no es visible ni editable desde la empresa B", async () => {
    const crear = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        sku: "AISLA-001",
        nombre: "Producto de A",
        categoriaId: categoriaIdA,
        marcaId: fixturesA.marcaId,
        unidadMedidaId: fixturesA.unidadMedidaId,
        precioCompra: 5,
        precioVenta: 9,
      });
    expect(crear.status).toBe(201);
    const productoId = crear.body.data.id;

    // Confirmado desde A: el producto existe y se puede leer normalmente.
    const leerComoA = await request(app).get(`/api/productos/${productoId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(leerComoA.status).toBe(200);

    const leerComoB = await request(app).get(`/api/productos/${productoId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(leerComoB.status).toBe(404);

    const actualizarComoB = await request(app)
      .put(`/api/productos/${productoId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ nombre: "Nombre cambiado por B" });
    expect(actualizarComoB.status).toBe(404);

    const eliminarComoB = await request(app).delete(`/api/productos/${productoId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(eliminarComoB.status).toBe(404);

    // El producto de A sigue intacto: si el DELETE de B hubiera funcionado,
    // buscarPorId (filtra deletedAt: null) ya no lo devolveria aqui.
    const releerComoA = await request(app).get(`/api/productos/${productoId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(releerComoA.status).toBe(200);
    expect(releerComoA.body.data.nombre).toBe("Producto de A");
  });

  it("un cliente creado en la empresa A no es visible ni editable desde la empresa B", async () => {
    const crear = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1799999999", nombre: "Cliente de A" });
    expect(crear.status).toBe(201);
    const clienteId = crear.body.data.id;

    const leerComoB = await request(app).get(`/api/clientes/${clienteId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(leerComoB.status).toBe(404);

    const actualizarComoB = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ nombre: "Nombre cambiado por B" });
    expect(actualizarComoB.status).toBe(404);

    const eliminarComoB = await request(app).delete(`/api/clientes/${clienteId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(eliminarComoB.status).toBe(404);
  });
});
