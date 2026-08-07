import { ConflictError, NotFoundError } from "../../lib/errors";
import { categoriasRepository } from "../categorias/CategoriasRepository";
import { marcasRepository } from "../marcas/MarcasRepository";
import { unidadesMedidaRepository } from "../unidades-medida/UnidadesMedidaRepository";
import { productosRepository } from "./ProductosRepository";
import type { ActualizarProductoInput, CrearProductoInput } from "./ProductosValidators";

export interface FilaImportacionError {
  fila: number;
  sku: string;
  mensaje: string;
}

export const productosService = {
  listar() {
    return productosRepository.listar();
  },

  async listarPaginado(params: { page: number; pageSize: number; busqueda?: string; categoriaId?: string }) {
    const { data, total } = await productosRepository.listarPaginado(params);
    return {
      data,
      meta: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPaginas: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
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

  // Cada fila se procesa de forma independiente (no en una unica
  // transaccion): un SKU duplicado o una categoria inexistente en la fila 40
  // no debe descartar las 39 filas validas que ya se importaron. Reutiliza
  // crear() para no duplicar las validaciones de negocio (FKs, SKU unico).
  async importarMasivo(filas: CrearProductoInput[]) {
    const creados: string[] = [];
    const errores: FilaImportacionError[] = [];

    for (const [indice, fila] of filas.entries()) {
      try {
        const producto = await this.crear(fila);
        creados.push(producto.id);
      } catch (err) {
        errores.push({
          fila: indice + 1,
          sku: fila.sku,
          mensaje: err instanceof Error ? err.message : "Error desconocido al crear el producto",
        });
      }
    }

    return { totalFilas: filas.length, creados: creados.length, errores };
  },
};
