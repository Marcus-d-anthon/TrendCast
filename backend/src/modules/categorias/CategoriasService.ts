import { ConflictError, NotFoundError } from "../../lib/errors";
import { categoriasRepository } from "./CategoriasRepository";
import type { ActualizarCategoriaInput, CrearCategoriaInput } from "./CategoriasValidators";

export const categoriasService = {
  listar() {
    return categoriasRepository.listar();
  },

  async obtener(id: string) {
    const categoria = await categoriasRepository.buscarPorId(id);
    if (!categoria) {
      throw new NotFoundError("Categoria no encontrada");
    }
    return categoria;
  },

  async crear(input: CrearCategoriaInput) {
    const existente = await categoriasRepository.buscarPorNombre(input.nombre);
    if (existente) {
      throw new ConflictError("Ya existe una categoria con ese nombre");
    }
    return categoriasRepository.crear(input);
  },

  async actualizar(id: string, input: ActualizarCategoriaInput) {
    await this.obtener(id);

    if (input.nombre) {
      const existente = await categoriasRepository.buscarPorNombre(input.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe una categoria con ese nombre");
      }
    }

    return categoriasRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await categoriasRepository.softDelete(id);
  },
};
