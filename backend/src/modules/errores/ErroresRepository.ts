import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { ListarErroresQuery } from "./ErroresValidators";

const LIMITE_RESULTADOS = 500;

export interface RegistrarErrorLogData {
  mensaje: string;
  ruta: string;
  metodo: string;
  statusCode: number;
  categoria: string | null;
  stackTrace: string | null;
  usuarioId: string | null;
  empresaId: string | null;
  ip: string | null;
  userAgent: string | null;
  traceId: string;
}

export const erroresRepository = {
  registrar(data: RegistrarErrorLogData) {
    return prisma.errorLog.create({ data });
  },

  // Sin escopar por empresaId: es visor de plataforma completa (mismo
  // criterio que AdminRepository) -- un error puede haber ocurrido antes de
  // resolver la empresa activa (ej. token invalido), asi que exigir empresa
  // dejaria huecos.
  async listar(filtros: ListarErroresQuery) {
    const where: Prisma.ErrorLogWhereInput = {
      ...(filtros.busqueda
        ? {
            OR: [
              { mensaje: { contains: filtros.busqueda, mode: "insensitive" } },
              { ruta: { contains: filtros.busqueda, mode: "insensitive" } },
              { traceId: { contains: filtros.busqueda, mode: "insensitive" } },
              { categoria: { contains: filtros.busqueda, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filtros.desde || filtros.hasta
        ? { fecha: { gte: filtros.desde, lte: filtros.hasta } }
        : {}),
    };

    const [registros, total] = await Promise.all([
      prisma.errorLog.findMany({ where, orderBy: { fecha: "desc" }, take: LIMITE_RESULTADOS }),
      prisma.errorLog.count({ where }),
    ]);

    const actorIds = [...new Set(registros.map((r) => r.usuarioId).filter((id): id is string => id !== null))];
    const actores = actorIds.length
      ? await prisma.usuario.findMany({ where: { id: { in: actorIds } }, select: { id: true, nombre: true, email: true } })
      : [];
    const mapaActores = new Map(actores.map((a) => [a.id, a]));

    const empresaIds = [...new Set(registros.map((r) => r.empresaId).filter((id): id is string => id !== null))];
    const empresas = empresaIds.length
      ? await prisma.empresa.findMany({ where: { id: { in: empresaIds } }, select: { id: true, razonSocial: true } })
      : [];
    const mapaEmpresas = new Map(empresas.map((e) => [e.id, e]));

    return {
      total,
      limite: LIMITE_RESULTADOS,
      registros: registros.map((r) => ({
        ...r,
        usuario: r.usuarioId ? (mapaActores.get(r.usuarioId) ?? null) : null,
        empresa: r.empresaId ? (mapaEmpresas.get(r.empresaId) ?? null) : null,
      })),
    };
  },
};
