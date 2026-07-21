import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("Modulo Unidades de Medida", () => {
  let tokenAdmin: string;
  let tokenOperador: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    tokenAdmin = (await crearUsuarioYObtenerToken(app, "ADMIN")).token;
    tokenOperador = (await crearUsuarioYObtenerToken(app, "BODEGA")).token;
  });

  it("crea una unidad de medida con rol ADMIN", async () => {
    const res = await request(app)
      .post("/api/unidades-medida")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Kilogramo", abreviatura: "kg" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ nombre: "Kilogramo", abreviatura: "kg" });
  });

  it("rechaza crear con rol BODEGA (403)", async () => {
    const res = await request(app)
      .post("/api/unidades-medida")
      .set("Authorization", `Bearer ${tokenOperador}`)
      .send({ nombre: "Litro", abreviatura: "l" });
    expect(res.status).toBe(403);
  });

  it("rechaza nombre duplicado (409)", async () => {
    await request(app).post("/api/unidades-medida").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Litro", abreviatura: "l" });
    const res = await request(app).post("/api/unidades-medida").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Litro", abreviatura: "l" });
    expect(res.status).toBe(409);
  });

  it("lista unidades (lectura permitida a BODEGA)", async () => {
    await request(app).post("/api/unidades-medida").set("Authorization", `Bearer ${tokenAdmin}`).send({ nombre: "Litro", abreviatura: "l" });
    const res = await request(app).get("/api/unidades-medida").set("Authorization", `Bearer ${tokenOperador}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
