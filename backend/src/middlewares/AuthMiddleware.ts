import type { NextFunction, Request, Response } from "express";
import { runWithUsuarioActual } from "../lib/async-context";
import { UnauthorizedError } from "../lib/errors";
import { verificarToken } from "../lib/jwt";
import { usuariosRepository } from "../modules/usuarios/UsuariosRepository";

export interface UsuarioRequest {
  id: string;
  email: string;
  nombre: string;
  rol: string;
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

  req.usuario = { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };

  runWithUsuarioActual({ id: usuario.id, rol: usuario.rol }, () => next());
}
