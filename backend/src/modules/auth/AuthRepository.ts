import { prisma } from "../../lib/prisma";

export const authRepository = {
  crearRefreshToken(usuarioId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { usuarioId, tokenHash, expiresAt } });
  },

  buscarRefreshTokenPorHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revocarRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  // Trazabilidad de acceso: entidad "Usuario" + accion LOGIN reutiliza la
  // misma tabla audit_log que ya registra creaciones/ediciones/bajas, en vez
  // de una tabla aparte solo para logins -- un unico libro de auditoria es
  // lo que pidio el usuario ("trazabilidad de todos los movimientos").
  registrarAcceso(usuarioId: string, rol: string, ip: string | null, userAgent: string | null) {
    return prisma.auditLog.create({
      data: {
        entidad: "Usuario",
        registroId: usuarioId,
        accion: "LOGIN",
        valorNuevo: { rol },
        usuarioId,
        ip,
        userAgent,
      },
    });
  },
};
