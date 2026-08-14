import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { usuariosService } from "../../src/modules/usuarios/UsuariosService";
import { buildTestApp } from "../helpers/build-app";
import { conEmpresaDePruebas } from "../helpers/empresa-context";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();

// Este archivo crea usuarios llamando directo a usuariosService.crear (sin
// pasar por HTTP), asi que necesita su propio contexto de "empresa activa"
// -- ver tests/helpers/empresa-context.ts.
function crearUsuario(input: Parameters<typeof usuariosService.crear>[0]) {
  return conEmpresaDePruebas(() => usuariosService.crear(input));
}

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await limpiarBaseDeDatos();
    await crearUsuario({
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
    expect(Array.isArray(res.body.data.usuario.permisos)).toBe(true);
    expect(res.body.data.usuario.permisos).toContain("productos.crear");
    expect(res.body.data.usuario.permisos).toContain("usuarios.eliminar");
  });

  it("un rol no-ADMIN recibe solo los permisos de su matriz (no la lista completa)", async () => {
    await crearUsuario({
      email: "bodega@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Bodega Test",
      rol: "BODEGA",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bodega@tiansi.test", password: "ClaveSegura123" });

    expect(res.status).toBe(200);
    expect(res.body.data.usuario.permisos).toContain("inventario.ver");
    expect(res.body.data.usuario.permisos).not.toContain("usuarios.eliminar");
    expect(res.body.data.usuario.permisos).not.toContain("compras.crear");
  });

  it("registra el acceso en audit_log (trazabilidad)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("User-Agent", "vitest-suite")
      .send({ email: "admin@tiansi.test", password: "ClaveSegura123" });

    expect(res.status).toBe(200);

    const registro = await prisma.auditLog.findFirst({
      where: { entidad: "Usuario", registroId: res.body.data.usuario.id, accion: "LOGIN" },
      orderBy: { fecha: "desc" },
    });
    expect(registro).not.toBeNull();
    expect(registro?.usuarioId).toBe(res.body.data.usuario.id);
    expect(registro?.userAgent).toBe("vitest-suite");
    expect((registro?.valorNuevo as { rol: string } | null)?.rol).toBe("ADMIN");
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
    await crearUsuario({
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
    expect(res.body.data.usuario.permisos).toContain("productos.crear");
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
    await crearUsuario({
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
    await crearUsuario({
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
      // VENTAS y no BODEGA a proposito: BODEGA ahora requiere almacenId (ver
      // UsuariosValidators.ts), y esta prueba solo verifica el camino feliz
      // de registro por un ADMIN, no las reglas de asignacion de almacen.
      .send({ email: "nuevo2@tiansi.test", password: "ClaveSegura123", nombre: "Nuevo2", rol: "VENTAS" });

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
    await crearUsuario({
      email: "admin3@tiansi.test",
      password: "ClaveSegura123",
      nombre: "Admin3",
      rol: "ADMIN",
    });
    await crearUsuario({
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
    await crearUsuario({
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
