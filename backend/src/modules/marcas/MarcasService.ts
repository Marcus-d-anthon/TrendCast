import { ConflictError, NotFoundError } from "../../lib/errors";
import { marcasRepository } from "./marcas.repository";
import type { ActualizarMarcaInput, CrearMarcaInput } from "./marcas.validators";

export const marcasService = {
  listar() {
    return marcasRepository.listar();
  },

  async obtener(id: string) {
    const marca = await marcasRepository.buscarPorId(id);
    if (!marca) {
      throw new NotFoundError("Marca no encontrada");
    }
    return marca;
  },

  async crear(input: CrearMarcaInput) {
    const existente = await marcasRepository.buscarPorNombre(input.nombre);
    if (existente) {
      throw new ConflictError("Ya existe una marca con ese nombre");
    }
    return marcasRepository.crear(input);
  },

  async actualizar(id: string, input: ActualizarMarcaInput) {
    await this.obtener(id);

    if (input.nombre) {
      const existente = await marcasRepository.buscarPorNombre(input.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe una marca con ese nombre");
      }
    }

    return marcasRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await marcasRepository.softDelete(id);
  },
};
