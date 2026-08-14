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

  // Secreto guardado pero totpHabilitado sigue en false hasta que
  // verificar2fa confirme un codigo real -- asi un QR generado y nunca
  // escaneado no deja la cuenta en un estado raro.
  guardarSecretoTotpPendiente(usuarioId: string, secret: string) {
    return prisma.usuario.update({ where: { id: usuarioId }, data: { totpSecret: secret } });
  },

  habilitarTotp(usuarioId: string) {
    return prisma.usuario.update({ where: { id: usuarioId }, data: { totpHabilitado: true } });
  },

  desactivarTotp(usuarioId: string) {
    return prisma.$transaction([
      prisma.usuario.update({ where: { id: usuarioId }, data: { totpSecret: null, totpHabilitado: false } }),
      prisma.codigoRecuperacion2FA.deleteMany({ where: { usuarioId } }),
    ]);
  },

  crearCodigosRecuperacion(usuarioId: string, hashes: string[]) {
    return prisma.codigoRecuperacion2FA.createMany({ data: hashes.map((codigoHash) => ({ usuarioId, codigoHash })) });
  },

  buscarCodigoRecuperacionNoUsado(usuarioId: string, codigoHash: string) {
    return prisma.codigoRecuperacion2FA.findFirst({ where: { usuarioId, codigoHash, usado: false } });
  },

  marcarCodigoRecuperacionUsado(id: string) {
    return prisma.codigoRecuperacion2FA.update({ where: { id }, data: { usado: true, usadoEn: new Date() } });
  },
};
