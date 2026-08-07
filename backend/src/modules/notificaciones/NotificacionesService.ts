import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { notificacionesRepository } from "./NotificacionesRepository";

export const notificacionesService = {
  listar(usuarioId: string) {
    return notificacionesRepository.listarPorUsuario(usuarioId);
  },

  contarNoLeidas(usuarioId: string) {
    return notificacionesRepository.contarNoLeidas(usuarioId);
  },

  async marcarLeida(id: string, usuarioId: string) {
    const notificacion = await notificacionesRepository.buscarPorId(id);
    if (!notificacion) {
      throw new NotFoundError("Notificacion no encontrada");
    }
    if (notificacion.usuarioId !== usuarioId) {
      throw new ForbiddenError("No puedes marcar como leida una notificacion de otro usuario");
    }
    return notificacionesRepository.marcarLeida(id);
  },
};
