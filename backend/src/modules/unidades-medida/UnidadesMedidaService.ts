import { ConflictError, NotFoundError } from "../../lib/errors";
import { unidadesMedidaRepository } from "./unidades-medida.repository";
import type { ActualizarUnidadMedidaInput, CrearUnidadMedidaInput } from "./unidades-medida.validators";

export const unidadesMedidaService = {
  listar() {
    return unidadesMedidaRepository.listar();
  },

  async obtener(id: string) {
    const unidad = await unidadesMedidaRepository.buscarPorId(id);
    if (!unidad) {
      throw new NotFoundError("Unidad de medida no encontrada");
    }
    return unidad;
  },

  async crear(input: CrearUnidadMedidaInput) {
    const existente = await unidadesMedidaRepository.buscarPorNombre(input.nombre);
    if (existente) {
      throw new ConflictError("Ya existe una unidad de medida con ese nombre");
    }
    return unidadesMedidaRepository.crear(input);
  },

  async actualizar(id: string, input: ActualizarUnidadMedidaInput) {
    await this.obtener(id);

    if (input.nombre) {
      const existente = await unidadesMedidaRepository.buscarPorNombre(input.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe una unidad de medida con ese nombre");
      }
    }

    return unidadesMedidaRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await unidadesMedidaRepository.softDelete(id);
  },
};
