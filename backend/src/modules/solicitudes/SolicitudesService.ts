import { ConflictError, NotFoundError } from "../../lib/errors";
import { productosRepository } from "../productos/ProductosRepository";
import { solicitudesRepository, type ListarSolicitudesFiltros } from "./SolicitudesRepository";
import type { CrearSolicitudInput } from "./SolicitudesValidators";

export const solicitudesService = {
  listar(filtros: ListarSolicitudesFiltros) {
    return solicitudesRepository.listar(filtros);
  },

  async obtener(id: string) {
    const solicitud = await solicitudesRepository.buscarPorId(id);
    if (!solicitud) {
      throw new NotFoundError("Solicitud no encontrada");
    }
    return solicitud;
  },

  async crear(solicitanteId: string, input: CrearSolicitudInput) {
    const producto = await productosRepository.buscarPorId(input.productoId);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }
    return solicitudesRepository.crear(solicitanteId, input);
  },

  async aprobar(id: string, aprobadorId: string) {
    const solicitud = await this.obtener(id);
    if (solicitud.estado !== "PENDIENTE") {
      throw new ConflictError("Solo se puede aprobar una solicitud en estado PENDIENTE");
    }
    return solicitudesRepository.aprobar(id, aprobadorId);
  },

  async rechazar(id: string, aprobadorId: string, motivo: string) {
    const solicitud = await this.obtener(id);
    if (solicitud.estado !== "PENDIENTE") {
      throw new ConflictError("Solo se puede rechazar una solicitud en estado PENDIENTE");
    }
    return solicitudesRepository.rechazar(id, aprobadorId, motivo);
  },

  async efectuar(id: string, efectuadorId: string) {
    const solicitud = await this.obtener(id);
    if (solicitud.estado !== "APROBADA") {
      throw new ConflictError("Solo se puede efectuar una solicitud en estado APROBADA");
    }
    return solicitudesRepository.efectuar(id, efectuadorId);
  },
};
