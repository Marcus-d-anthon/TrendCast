import { ConflictError, NotFoundError } from "../../lib/errors";
import { comprasRepository } from "../compras/ComprasRepository";
import { ventasRepository } from "../ventas/VentasRepository";
import { devolucionesRepository, type DetalleDevolucionCalculado, type ListarDevolucionesParams } from "./DevolucionesRepository";
import type { CrearDevolucionInput } from "./DevolucionesValidators";

export const devolucionesService = {
  listar(filtros: { ventaId?: string; compraId?: string }) {
    return devolucionesRepository.listar(filtros);
  },

  async listarPaginado(params: ListarDevolucionesParams) {
    const { data, total } = await devolucionesRepository.listarPaginado(params);
    return {
      data,
      meta: { total, page: params.page, pageSize: params.pageSize, totalPaginas: Math.max(1, Math.ceil(total / params.pageSize)) },
    };
  },

  async obtener(id: string) {
    const devolucion = await devolucionesRepository.buscarPorId(id);
    if (!devolucion) {
      throw new NotFoundError("Devolucion no encontrada");
    }
    return devolucion;
  },

  async crear(usuarioId: string, input: CrearDevolucionInput) {
    // El documento origen (venta o compra, segun `tipo`) debe existir, estar
    // CONFIRMADA (sin movimientos reales generados no hay nada que
    // devolver), y pertenecer a la empresa activa -- ventasRepository/
    // comprasRepository.buscarPorId ya escopan por empresa.
    const documento =
      input.tipo === "CLIENTE"
        ? await ventasRepository.buscarPorId(input.ventaId as string)
        : await comprasRepository.buscarPorId(input.compraId as string);

    if (!documento) {
      throw new NotFoundError(input.tipo === "CLIENTE" ? "La venta indicada no existe" : "La compra indicada no existe");
    }
    if (documento.estado !== "CONFIRMADA") {
      throw new ConflictError(
        `Solo se puede devolver mercaderia de ${input.tipo === "CLIENTE" ? "una venta" : "una compra"} CONFIRMADA`
      );
    }

    const detalle: DetalleDevolucionCalculado[] = [];
    for (const linea of input.detalle) {
      // Cuanto se vendio/compro en total de este producto dentro del
      // documento origen (puede aparecer en mas de una linea).
      const cantidadOriginal = documento.detalle
        .filter((d) => d.productoId === linea.productoId)
        .reduce((suma, d) => suma + d.cantidad, 0);
      if (cantidadOriginal === 0) {
        throw new ConflictError(`El producto no forma parte de ${documento.numero}`);
      }

      const yaDevuelta =
        input.tipo === "CLIENTE"
          ? await devolucionesRepository.cantidadDevueltaDeVenta(documento.id, linea.productoId)
          : await devolucionesRepository.cantidadDevueltaDeCompra(documento.id, linea.productoId);

      const disponible = cantidadOriginal - yaDevuelta;
      if (linea.cantidad > disponible) {
        throw new ConflictError(
          `No se puede devolver ${linea.cantidad} unidades: de ${documento.numero} ya se devolvieron ${yaDevuelta} de ${cantidadOriginal}, quedan ${disponible} disponibles`
        );
      }

      detalle.push({ productoId: linea.productoId, cantidad: linea.cantidad });
    }

    return devolucionesRepository.crear(usuarioId, input, documento.almacenId, detalle);
  },

  async confirmar(id: string, usuarioId: string) {
    const devolucion = await this.obtener(id);
    if (devolucion.estado !== "BORRADOR") {
      throw new ConflictError("Solo se puede confirmar una devolucion en estado BORRADOR");
    }
    return devolucionesRepository.confirmar(id, usuarioId);
  },
};
