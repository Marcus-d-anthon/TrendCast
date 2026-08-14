import type { Express } from "express";
import request from "supertest";
import { usuariosService } from "../../src/modules/usuarios/UsuariosService";
import { conEmpresaDePruebas } from "./empresa-context";

const PASSWORD = "ClaveSegura123";

export async function crearUsuarioYObtenerToken(
  app: Express,
  rol: "ADMIN" | "SUPERVISOR" | "BODEGA" | "VENTAS" | "GERENCIA",
  email = `${rol.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}@tiansi.test`
): Promise<{ token: string; usuarioId: string; email: string }> {
  const usuario = await conEmpresaDePruebas(() =>
    usuariosService.crear({ email, password: PASSWORD, nombre: `Usuario ${rol}`, rol })
  );

  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });

  return { token: res.body.data.token as string, usuarioId: usuario.id, email };
}
