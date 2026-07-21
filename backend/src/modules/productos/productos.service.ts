import { ConflictError, NotFoundError } from "../../lib/errors";
import { categoriasRepository } from "../categorias/categorias.repository";
import { marcasRepository } from "../marcas/marcas.repository";
import { unidadesMedidaRepository } from "../unidades-medida/unidades-medida.repository";
import { productosRepository } from "./productos.repository";
import type { ActualizarProductoInput, CrearProductoInput } from "./productos.validators";

export const productosService = {
  listar() {
    return productosRepository.listar();
  },

  async obtener(id: string) {
    const producto = await productosRepository.buscarPorId(id);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }
    return producto;
  },

  async crear(input: CrearProductoInput) {
    const categoria = await categoriasRepository.buscarPorId(input.categoriaId);
    if (!categoria) {
      throw new NotFoundError("La categoria indicada no existe");
    }
    const marca = await marcasRepository.buscarPorId(input.marcaId);
    if (!marca) {
      throw new NotFoundError("La marca indicada no existe");
    }
    const unidadMedida = await unidadesMedidaRepository.buscarPorId(input.unidadMedidaId);
    if (!unidadMedida) {
      throw new NotFoundError("La unidad de medida indicada no existe");
    }

    const existente = await productosRepository.buscarPorSku(input.sku);
    if (existente) {
      throw new ConflictError("Ya existe un producto con ese SKU");
    }

    return productosRepository.crearConStock(input);
  },

  async actualizar(id: string, input: ActualizarProductoInput) {
    await this.obtener(id);

    if (input.categoriaId) {
      const categoria = await categoriasRepository.buscarPorId(input.categoriaId);
      if (!categoria) {
        throw new NotFoundError("La categoria indicada no existe");
      }
    }
    if (input.marcaId) {
      const marca = await marcasRepository.buscarPorId(input.marcaId);
      if (!marca) {
        throw new NotFoundError("La marca indicada no existe");
      }
    }
    if (input.unidadMedidaId) {
      const unidadMedida = await unidadesMedidaRepository.buscarPorId(input.unidadMedidaId);
      if (!unidadMedida) {
        throw new NotFoundError("La unidad de medida indicada no existe");
      }
    }

    return productosRepository.actualizar(id, input);
  },

  async eliminar(id: string) {
    await this.obtener(id);
    await productosRepository.softDelete(id);
  },
};
