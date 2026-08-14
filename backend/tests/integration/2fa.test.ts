import { authenticator } from "otplib";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { crearUsuarioYObtenerToken } from "../helpers/auth-helper";
import { buildTestApp } from "../helpers/build-app";
import { limpiarBaseDeDatos } from "../helpers/test-db";

const app = buildTestApp();
const PASSWORD = "ClaveSegura123";

describe("Modulo 2FA (TOTP)", () => {
  let token: string;
  let email: string;

  beforeEach(async () => {
    await limpiarBaseDeDatos();
    const usuario = await crearUsuarioYObtenerToken(app, "ADMIN");
    token = usuario.token;
    email = usuario.email;
  });

  it("configura y verifica 2FA con un codigo TOTP real, entrega 8 codigos de recuperacion", async () => {
    const configurar = await request(app).post("/api/auth/2fa/configurar").set("Authorization", `Bearer ${token}`);
    expect(configurar.status).toBe(200);
    expect(configurar.body.data.secret).toBeTruthy();
    expect(configurar.body.data.qr).toMatch(/^data:image\/png;base64,/);

    const codigo = authenticator.generate(configurar.body.data.secret);
    const verificar = await request(app).post("/api/auth/2fa/verificar").set("Authorization", `Bearer ${token}`).send({ codigo });

    expect(verificar.status).toBe(200);
    expect(verificar.body.data.codigosRecuperacion).toHaveLength(8);
  });

  it("rechaza verificar 2FA con un codigo incorrecto (400, la sesion sigue siendo valida)", async () => {
    await request(app).post("/api/auth/2fa/configurar").set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .post("/api/auth/2fa/verificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ codigo: "000000" });
    expect(res.status).toBe(400);
  });

  async function activar2fa(): Promise<{ secret: string; codigosRecuperacion: string[] }> {
    const configurar = await request(app).post("/api/auth/2fa/configurar").set("Authorization", `Bearer ${token}`);
    const secret = configurar.body.data.secret as string;
    const codigo = authenticator.generate(secret);
    const verificar = await request(app).post("/api/auth/2fa/verificar").set("Authorization", `Bearer ${token}`).send({ codigo });
    return { secret, codigosRecuperacion: verificar.body.data.codigosRecuperacion };
  }

  it("login sin codigo en una cuenta con 2FA responde requiere2fa (sin emitir tokens)", async () => {
    await activar2fa();
    const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.requiere2fa).toBe(true);
    expect(res.body.data.token).toBeUndefined();
  });

  it("login con un codigo TOTP valido emite tokens normalmente", async () => {
    const { secret } = await activar2fa();
    const codigo = authenticator.generate(secret);
    const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD, codigoTotp: codigo });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.usuario.totpHabilitado).toBe(true);
  });

  it("login con un codigo TOTP invalido es rechazado (401)", async () => {
    await activar2fa();
    const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD, codigoTotp: "000000" });
    expect(res.status).toBe(401);
  });

  it("login con un codigo de recuperacion funciona una sola vez", async () => {
    const { codigosRecuperacion } = await activar2fa();
    const codigoRecuperacion = codigosRecuperacion[0];

    const primerUso = await request(app)
      .post("/api/auth/login")
      .send({ email, password: PASSWORD, codigoTotp: codigoRecuperacion });
    expect(primerUso.status).toBe(200);
    expect(primerUso.body.data.token).toBeTruthy();

    const segundoUso = await request(app)
      .post("/api/auth/login")
      .send({ email, password: PASSWORD, codigoTotp: codigoRecuperacion });
    expect(segundoUso.status).toBe(401);
  });

  it("desactivar 2FA exige la contrasena correcta y limpia el estado", async () => {
    await activar2fa();

    const passwordIncorrecta = await request(app)
      .post("/api/auth/2fa/desactivar")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "incorrecta" });
    expect(passwordIncorrecta.status).toBe(400);

    const desactivar = await request(app)
      .post("/api/auth/2fa/desactivar")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: PASSWORD });
    expect(desactivar.status).toBe(204);

    const login = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.requiere2fa).toBeUndefined();
    expect(login.body.data.token).toBeTruthy();
  });
});
