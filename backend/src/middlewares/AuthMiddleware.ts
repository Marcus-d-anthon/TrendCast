import type { NextFunction, Request, Response } from "express";
import { runWithUsuarioActual } from "../lib/async-context";
import { UnauthorizedError } from "../lib/errors";
import { verificarToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { usuariosRepository } from "../modules/usuarios/UsuariosRepository";

export interface UsuarioRequest {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  almacenId: string | null;
  empresaId: string;
}

const HEADER_EMPRESA_VISTA = "x-empresa-vista";

// Resuelve la empresa "activa" del request: por defecto la propia del
// usuario, salvo que sea SUPERUSUARIO y mande un X-Empresa-Vista valido
// (empresa existente y activa) -- para cualquier otro rol el header ni
// siquiera se lee, asi que no hay forma de que un rol de negocio comun
// influya en que empresaId termina en el contexto de la request.
async function resolverEmpresaActiva(req: Request, usuario: { rol: string; empresaId: string }): Promise<string> {
  if (usuario.rol !== "SUPERUSUARIO") {
    return usuario.empresaId;
  }
  const empresaVista = req.headers[HEADER_EMPRESA_VISTA];
  const empresaVistaId = Array.isArray(empresaVista) ? empresaVista[0] : empresaVista;
  if (!empresaVistaId) {
    return usuario.empresaId;
  }
  const empresa = await prisma.empresa.findFirst({ where: { id: empresaVistaId, activo: true } });
  return empresa ? empresa.id : usuario.empresaId;
}

declare module "express-serve-static-core" {
  interface Request {
    usuario?: UsuarioRequest;
  }
}

// Verifica el JWT y vuelve a consultar el usuario en la base de datos (no
// confia ciegamente en el payload del token) para rechazar tokens de
// usuarios desactivados o dados de baja logica. Tambien propaga el usuario
// actual via AsyncLocalStorage para que las extensiones de Prisma (ver
// extensions/audit.extension.ts) sepan quien esta mutando datos.
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token no proporcionado");
  }
  const token = header.slice("Bearer ".length);

  let payload;
  try {
    payload = verificarToken(token);
  } catch {
    throw new UnauthorizedError("Token invalido o expirado");
  }

  const usuario = await usuariosRepository.buscarPorId(payload.sub);
  if (!usuario || !usuario.activo) {
    throw new UnauthorizedError("Usuario no valido");
  }

  const empresaActivaId = await resolverEmpresaActiva(req, usuario);

  req.usuario = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    almacenId: usuario.almacenId,
    empresaId: empresaActivaId,
  };

  runWithUsuarioActual({ id: usuario.id, rol: usuario.rol, empresaId: empresaActivaId }, () => next());
}
