import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Marcas", () => {
  let tokenAdmin: string;
  let tokenOperador: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
  });

  it("crea una marca con rol ADMIN y la registra en audit_log", async () => {
    const res = await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Tianshi Nutrition" });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe("Tianshi Nutrition");

    const logs = await prisma.auditLog.findMany({ where: { entidad: "Marca", registroId: res.body.data.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].accion).toBe("CREATE");
  });

  it("rechaza crear marca con rol BODEGA (403)", async () => {
    const res = await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenOperador}`).send({ nombre: "Tianshi Care" });
    expect(res.status).toBe(403);
  });

  it("rechaza nombre duplicado (409)", async () => {
    await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Tianshi Labs" });
    const res = await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Tianshi Labs" });
    expect(res.status).toBe(409);
  });

  it("lista marcas (lectura permitida a BODEGA)", async () => {
    await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Tianshi Labs" });
    const res = await request(app).get("/api/marcas").set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("el soft delete oculta la marca de listados pero conserva la fila", async () => {
    const crear = await request(app).post("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Tianshi Labs" });
    const id = crear.body.data.id;

    const del = await request(app).delete(`/api/marcas/${id}`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(del.status).toBe(204);

    const listado = await request(app).get("/api/marcas").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(listado.body.data).toHaveLength(0);

    const filaCruda = await prisma.marca.findUnique({ where: { id } });
    expect(filaCruda).not.toBeNull();
    expect(filaCruda?.deletedAt).not.toBeNull();
  });
});
