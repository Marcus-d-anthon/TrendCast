import { ConflictError, NotFoundError } from "../../lib/errors";
import { clientesRepository } from "./clientes.repository";
import type { ActualizarClienteInput, CrearClienteInput } from "./clientes.validators";

export const clientesService = {
  listar() {
    return clientesRepository.listar();
  },

  async obtener(id: string) {
    const cliente = await clientesRepository.buscarPorId(id);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado");
    }
    return cliente;
  },

  async crear(input: CrearClienteInput) {
    const existente = await clientesRepository.buscarPorNumeroDocumento(input.numeroDocumento);
    if (existente) {
      throw new ConflictError("Ya existe un cliente con ese numero de documento");
    }
    return clientesRepository.crear(input);
  },

  async actualizar(id: string, input: ActualizarClienteInput) {
    await this.obtener(id);

    if (input.numeroDocumento) {
      const existente = await clientesRepository.buscarPorNumeroDocumento(input.numeroDocumento);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe un cliente con ese numero de documento");
      }
    }

    return clientesRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await clientesRepository.softDelete(id);
  },
};
