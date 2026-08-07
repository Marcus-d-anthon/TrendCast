import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export function requireRole(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      throw new UnauthorizedError();
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw new ForbiddenError(`Esta accion requiere rol: ${rolesPermitidos.join(" o ")}`);
    }
    next();
  };
}
