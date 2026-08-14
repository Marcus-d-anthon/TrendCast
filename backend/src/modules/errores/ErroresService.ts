import { erroresRepository, type RegistrarErrorLogData } from "./ErroresRepository";
import type { ListarErroresQuery } from "./ErroresValidators";

export const erroresService = {
  listar(filtros: ListarErroresQuery) {
    return erroresRepository.listar(filtros);
  },

  // Fire-and-forget desde ErrorHandlerMiddleware: un fallo al guardar el log
  // nunca debe tumbar la respuesta que ya se le envio al cliente, por eso
  // el catch vive en el middleware, no aqui.
  registrar(data: RegistrarErrorLogData) {
    return erroresRepository.registrar(data);
  },
};
