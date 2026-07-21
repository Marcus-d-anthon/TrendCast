import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Clientes", () => {
  let tokenAdmin: string;
  let tokenOperador: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
  });

  it("crea un cliente con rol ADMIN y lo registra en audit_log", async () => {
    const res = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Maria Lopez" });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe("Maria Lopez");

    const logs = await prisma.auditLog.findMany({ where: { entidad: "Cliente", registroId: res.body.data.id } });
    expect(logs).toHaveLength(1);
  });

  it("rechaza crear cliente con rol BODEGA (403)", async () => {
    const res = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenOperador}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Maria Lopez" });
    expect(res.status).toBe(403);
  });

  it("rechaza numero de documento duplicado (409)", async () => {
    await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Maria Lopez" });

    const res = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Otra Persona" });

    expect(res.status).toBe(409);
  });

  it("lista clientes (lectura permitida a BODEGA)", async () => {
    await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "RUC", numeroDocumento: "1790333333001", nombre: "Farmacia Cruz del Sur" });

    const res = await request(app).get("/api/clientes").set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("el soft delete oculta el cliente de listados pero conserva la fila", async () => {
    const crear = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ tipoDocumento: "CEDULA", numeroDocumento: "1712345678", nombre: "Maria Lopez" });
    const id = crear.body.data.id;

    const del = await request(app).delete(`/api/clientes/${id}`).set("Authorization", `Bearer ${tokenAdmin}`);
    expect(del.status).toBe(204);

    const filaCruda = await prisma.cliente.findUnique({ where: { id } });
    expect(filaCruda).not.toBeNull();
    expect(filaCruda?.deletedAt).not.toBeNull();
  });
});
