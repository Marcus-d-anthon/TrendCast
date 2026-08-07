import { ConflictError, NotFoundError } from "../../lib/errors";
import { proveedoresRepository } from "./ProveedoresRepository";
import type { ActualizarProveedorInput, CrearProveedorInput } from "./ProveedoresValidators";

export const proveedoresService = {
  listar() {
    return proveedoresRepository.listar();
  },

  async obtener(id: string) {
    const proveedor = await proveedoresRepository.buscarPorId(id);
    if (!proveedor) {
      throw new NotFoundError("Proveedor no encontrado");
    }
    return proveedor;
  },

  async crear(input: CrearProveedorInput) {
    const existente = await proveedoresRepository.buscarPorNumeroDocumento(input.numeroDocumento);
    if (existente) {
      throw new ConflictError("Ya existe un proveedor con ese numero de documento");
    }
    return proveedoresRepository.crear(input);
  },

  async actualizar(id: string, input: ActualizarProveedorInput) {
    await this.obtener(id);

    if (input.numeroDocumento) {
      const existente = await proveedoresRepository.buscarPorNumeroDocumento(input.numeroDocumento);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe un proveedor con ese numero de documento");
      }
    }

    return proveedoresRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await proveedoresRepository.softDelete(id);
  },
};
