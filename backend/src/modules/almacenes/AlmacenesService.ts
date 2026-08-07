import { ConflictError, NotFoundError } from "../../lib/errors";
import { productosRepository } from "../productos/ProductosRepository";
import { almacenesRepository } from "./AlmacenesRepository";
import type { ActualizarAlmacenInput, CrearAlmacenInput, TransferenciaInput } from "./AlmacenesValidators";

export const almacenesService = {
  listar() {
    return almacenesRepository.listar();
  },

  async obtener(id: string) {
    const almacen = await almacenesRepository.buscarPorId(id);
    if (!almacen) {
      throw new NotFoundError("Almacen no encontrado");
    }
    return almacen;
  },

  async crear(input: CrearAlmacenInput) {
    const existente = await almacenesRepository.buscarPorNombre(input.nombre);
    if (existente) {
      throw new ConflictError("Ya existe un almacen con ese nombre");
    }
    return almacenesRepository.crearConStock(input);
  },

  async actualizar(id: string, input: ActualizarAlmacenInput) {
    await this.obtener(id);

    if (input.nombre) {
      const existente = await almacenesRepository.buscarPorNombre(input.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError("Ya existe un almacen con ese nombre");
      }
    }

    return almacenesRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await almacenesRepository.softDelete(id);
  },

  async registrarTransferencia(usuarioId: string, input: TransferenciaInput) {
    const producto = await productosRepository.buscarPorId(input.productoId);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }
    if (!producto.activo) {
      throw new ConflictError("No se pueden transferir productos inactivos");
    }

    await this.obtener(input.almacenOrigenId);
    await this.obtener(input.almacenDestinoId);

    const stockOrigen = await almacenesRepository.buscarStock(input.productoId, input.almacenOrigenId);
    if (!stockOrigen) {
      throw new NotFoundError("El producto no tiene stock registrado en el almacen de origen");
    }
    if (stockOrigen.cantidad < input.cantidad) {
      throw new ConflictError(
        `Stock insuficiente en el almacen de origen: hay ${stockOrigen.cantidad} unidades y se intentan transferir ${input.cantidad}`
      );
    }
    const stockDestino = await almacenesRepository.buscarStock(input.productoId, input.almacenDestinoId);
    if (!stockDestino) {
      throw new NotFoundError("El producto no tiene stock registrado en el almacen de destino");
    }

    return almacenesRepository.registrarTransferencia(usuarioId, input);
  },
};
