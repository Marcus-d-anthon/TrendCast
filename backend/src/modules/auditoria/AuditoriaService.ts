import { auditoriaRepository } from "./AuditoriaRepository";

export const auditoriaService = {
  listarPorRegistro(entidad: string, registroId: string) {
    return auditoriaRepository.listarPorRegistro(entidad, registroId);
  },
};
