import { prisma } from "../../lib/prisma";

// El visor de auditoria no filtra por empresaId explicitamente: siempre se
// consulta junto a un registroId concreto que el frontend ya obtuvo de una
// vista propia escopada (ej. un producto que el usuario ya podia ver), asi
// que no hace falta un segundo filtro aqui -- no es un descuido.
export const auditoriaRepository = {
  async listarPorRegistro(entidad: string, registroId: string) {
    const registros = await prisma.auditLog.findMany({
      where: { entidad, registroId },
      orderBy: { fecha: "desc" },
    });

    // usuarioId en AuditLog es una FK logica (no una relacion de Prisma, ver
    // AuditExtension.ts): se resuelve el nombre del actor a mano, mismo
    // patron que AdminRepository.listarUsuarios.
    const actorIds = [...new Set(registros.map((r) => r.usuarioId).filter((id): id is string => id !== null))];
    const actores = actorIds.length
      ? await prisma.usuario.findMany({ where: { id: { in: actorIds } }, select: { id: true, nombre: true, email: true } })
      : [];
    const mapaActores = new Map(actores.map((a) => [a.id, a]));

    return registros.map((r) => ({
      ...r,
      actor: r.usuarioId ? (mapaActores.get(r.usuarioId) ?? null) : null,
    }));
  },
};
