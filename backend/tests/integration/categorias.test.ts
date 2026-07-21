import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Categorias", () => {
  let tokenAdmin: string;
  let tokenOperador: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
  });

  it("crea una categoria con rol ADMIN y la registra en audit_log", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Suplementos" });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe("Suplementos");
    expect(res.body.data.createdBy).toBeTruthy();

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "Categoria", registroId: res.body.data.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].accion).toBe("CREATE");
  });

  it("rechaza crear categoria con rol OPERADOR (403)", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenOperador}`)
      .send({ nombre: "Suplementos" });

    expect(res.status).toBe(403);
  });

  it("rechaza nombre duplicado (409)", async () => {
    await request(app).post("/api/categorias").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Suplementos" });

    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Suplementos" });

    expect(res.status).toBe(409);
  });

  it("lista categorias activas (lectura permitida a rol OPERADOR)", async () => {
    await request(app).post("/api/categorias").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Suplementos" });

    const res = await request(app).get("/api/categorias").set("Authorization", `Bearer ${tokenOperador}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("actualiza una categoria y registra el cambio en audit_log", async () => {
    const crear = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Suplementos" });
    const id = crear.body.data.id;

    const put = await request(app)
      .put(`/api/categorias/${id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ descripcion: "Linea de suplementos nutricionales" });

    expect(put.status).toBe(200);
    expect(put.body.data.descripcion).toBe("Linea de suplementos nutricionales");

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "Categoria", registroId: id },
      orderBy: { fecha: "asc" },
    });
    expect(logs.map((l) => l.accion)).toEqual(["CREATE", "UPDATE"]);
  });

  it("el soft delete oculta la categoria de listados/lectura pero conserva la fila (nunca borrado fisico)", async () => {
    const crear = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Suplementos" });
    const id = crear.body.data.id;

    const del = await request(app).delete(`/api/categorias/${id}`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(del.status).toBe(204);

    const listado = await request(app).get("/api/categorias").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(listado.body.data).toHaveLength(0);

    const obtener = await request(app).get(`/api/categorias/${id}`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(obtener.status).toBe(404);

    // La fila sigue existiendo fisicamente en la base de datos.
    const filaCruda = await prisma.categoria.findUnique({ where: { id } });
    expect(filaCruda).not.toBeNull();
    expect(filaCruda?.deletedAt).not.toBeNull();

    const logs = await prisma.auditLog.findMany({
      where: { entidad: "Categoria", registroId: id },
      orderBy: { fecha: "asc" },
    });
    expect(logs.map((l) => l.accion)).toEqual(["CREATE", "SOFT_DELETE"]);
  });

  it("rechaza eliminar con rol OPERADOR (403)", async () => {
    const crear = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Suplementos" });
    const id = crear.body.data.id;

    const res = await request(app).delete(`/api/categorias/${id}`).set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(403);
  });
});
