import { prisma } from "../../lib/prisma";
import type { CanalNotificacion } from "../../generated/prisma/enums";

export const notificacionesRepository = {
  listarPorUsuario(usuarioId: string) {
    return prisma.notificacion.findMany({ where: { usuarioId }, orderBy: { fecha: "desc" } });
  },

  contarNoLeidas(usuarioId: string) {
    return prisma.notificacion.count({ where: { usuarioId, leida: false } });
  },

  buscarPorId(id: string) {
    return prisma.notificacion.findUnique({ where: { id } });
  },

  crear(usuarioId: string, titulo: string, mensaje: string, canal: CanalNotificacion = "SISTEMA") {
    return prisma.notificacion.create({ data: { usuarioId, titulo, mensaje, canal } });
  },

  marcarLeida(id: string) {
    return prisma.notificacion.update({ where: { id }, data: { leida: true } });
  },
};
