import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { usuariosService } from "../../src/modules/usuarios/usuarios.service";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await limpiarBaseDeDatos();
    await usuariosService.crear({
      email: "admin@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Admin Test",
      rol: "ADMIN",
    });
  });

  it("devuelve un token de acceso y un refresh token con credenciales correctas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@tiansi.test", password: "ClaveSegura123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
    expect(res.body.data.usuario.rol).toBe("ADMIN");
    expect(res.body.data.usuario.email).toBe("admin@tiansi.test");
  });

  it("rechaza password incorrecta", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@tiansi.test", password: "incorrecta" });

    expect(res.status).toBe(401);
  });

  it("rechaza un email que no existe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-existe@tiansi.test", password: "cualquiera" });

    expect(res.status).toBe(401);
  });

  it("rechaza un body invalido (400)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "no-es-un-email" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  beforeEach(async () => {
    await limpiarBaseDeDatos();
    await usuariosService.crear({
      email: "admin@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Admin Test",
      rol: "ADMIN",
    });
  });

  it("renueva el token de acceso con un refresh token vigente y rota el refresh token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@tiansi.test", password: "ClaveSegura123" });
    const refreshTokenOriginal = login.body.data.refreshToken as string;

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: refreshTokenOriginal });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
    expect(res.body.data.refreshToken).not.toBe(refreshTokenOriginal);
  });

  it("rechaza un refresh token ya usado (rotacion, 401)", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@tiansi.test", password: "ClaveSegura123" });
    const refreshTokenOriginal = login.body.data.refreshToken as string;

    await request(app).post("/api/auth/refresh").send({ refreshToken: refreshTokenOriginal });

    const reuso = await request(app).post("/api/auth/refresh").send({ refreshToken: refreshTokenOriginal });
    expect(reuso.status).toBe(401);
  });

  it("rechaza un refresh token inexistente (401)", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "token-que-no-existe" });
    expect(res.status).toBe(401);
  });
});

describe("Autenticacion y autorizacion por rol en rutas protegidas", () => {
  beforeEach(async () => {
    await limpiarBaseDeDatos();
  });

  it("rechaza una ruta protegida sin token (401)", async () => {
    const res = await request(app).post("/api/usuarios").send({});
    expect(res.status).toBe(401);
  });

  it("rechaza una ruta protegida con rol incorrecto (403)", async () => {
    await usuariosService.crear({
      email: "bodega@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Bodega Test",
      rol: "BODEGA",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "bodega@tiansi.test", password: "ClaveSegura123" });
    const token = login.body.data.token;

    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "nuevo@tiansi.test", password: "ClaveSegura123", nombre: "Nuevo", rol: "BODEGA" });

    expect(res.status).toBe(403);
  });

  it("permite registrar un usuario cuando el rol es ADMIN (201)", async () => {
    await usuariosService.crear({
      email: "admin2@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Admin2",
      rol: "ADMIN",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin2@tiansi.test", password: "ClaveSegura123" });
    const token = login.body.data.token;

    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "nuevo2@tiansi.test", password: "ClaveSegura123", nombre: "Nuevo2", rol: "BODEGA" });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("nuevo2@tiansi.test");
    expect(res.body.data.passwordHash).toBeUndefined();
  });
});

describe("GET /api/usuarios", () => {
  beforeEach(async () => {
    await limpiarBaseDeDatos();
  });

  it("permite a ADMIN listar usuarios sin exponer passwordHash", async () => {
    await usuariosService.crear({
      email: "admin3@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Admin3",
      rol: "ADMIN",
    });
    await usuariosService.crear({
      email: "bodega3@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Bodega3",
      rol: "BODEGA",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin3@tiansi.test", password: "ClaveSegura123" });
    const token = login.body.data.token;

    const res = await request(app).get("/api/usuarios").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((u: { passwordHash?: string }) => u.passwordHash === undefined)).toBe(true);
  });

  it("rechaza listar usuarios con rol distinto de ADMIN (403)", async () => {
    await usuariosService.crear({
      email: "supervisor3@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Supervisor3",
      rol: "SUPERVISOR",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor3@tiansi.test", password: "ClaveSegura123" });
    const token = login.body.data.token;

    const res = await request(app).get("/api/usuarios").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
