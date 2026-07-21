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
};
