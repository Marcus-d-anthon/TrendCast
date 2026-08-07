import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import type { RolUsuario } from "../generated/prisma/enums";

// Complementario a requireRole: en vez de una lista fija de roles permitidos
// por ruta, consulta la matriz roles_permisos sembrada en el seed. Permite
// ajustar que puede hacer cada rol sin tocar codigo ni migrar de nuevo --
// solo actualizando filas de RolPermiso. Se usa en los modulos nuevos de la
// Semana 2 en adelante; los modulos originales conservan requireRole por
// ahora para no tocar su superficie ya probada sin necesidad.
export function requirePermission(codigo: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      throw new UnauthorizedError();
    }

    const tienePermiso = await prisma.rolPermiso.findFirst({
      where: {
        rol: req.usuario.rol as RolUsuario,
        permiso: { codigo },
      },
    });

    if (!tienePermiso) {
      throw new ForbiddenError(`Esta accion requiere el permiso: ${codigo}`);
    }

    next();
  };
}
