import { alertasService } from "../alertas/alertas.service";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { almacenesRepository } from "../almacenes/almacenes.repository";
import { clientesRepository } from "../clientes/clientes.repository";
import { productosRepository } from "../productos/productos.repository";
import { ventasRepository, type DetalleCalculado } from "./ventas.repository";
import type { CrearVentaInput } from "./ventas.validators";

const IVA_ECUADOR = 0.15;

export const ventasService = {
  listar() {
    return ventasRepository.listar();
  },

  async obtener(id: string) {
    const venta = await ventasRepository.buscarPorId(id);
    if (!venta) {
      throw new NotFoundError("Venta no encontrada");
    }
    return venta;
  },

  async crear(usuarioId: string, input: CrearVentaInput) {
    const cliente = await clientesRepository.buscarPorId(input.clienteId);
    if (!cliente) {
      throw new NotFoundError("El cliente indicado no existe");
    }
    const almacen = await almacenesRepository.buscarPorId(input.almacenId);
    if (!almacen) {
      throw new NotFoundError("El almacen indicado no existe");
    }

    const detalle: DetalleCalculado[] = [];
    let subtotal = 0;
    for (const linea of input.detalle) {
      const producto = await productosRepository.buscarPorId(linea.productoId);
      if (!producto) {
        throw new NotFoundError(`El producto ${linea.productoId} no existe`);
      }
      if (!producto.activo) {
        throw new ConflictError(`El producto ${producto.sku} esta inactivo`);
      }
      const subtotalLinea = Math.round(linea.cantidad * linea.precioUnitario * 100) / 100;
      subtotal = Math.round((subtotal + subtotalLinea) * 100) / 100;
      detalle.push({
        productoId: linea.productoId,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        subtotal: subtotalLinea,
      });
    }
    const impuesto = Math.round(subtotal * IVA_ECUADOR * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;

    return ventasRepository.crear(usuarioId, input, { subtotal, impuesto, total, detalle });
  },

  async confirmar(id: string, usuarioId: string) {
    const venta = await this.obtener(id);
    if (venta.estado !== "BORRADOR") {
      throw new ConflictError("Solo se puede confirmar una venta en estado BORRADOR");
    }
    const resultado = await ventasRepository.confirmar(id, usuarioId);

    // Evaluacion inmediata (no espera a la sincronizacion completa del
    // siguiente GET /alertas): una venta que agota o deja bajo minimo un
    // producto debe reflejarse en las alertas sin demora.
    for (const producto of resultado.productosAfectados) {
      await alertasService.evaluarProducto(producto.productoId);
    }

    return resultado;
  },

  async anular(id: string) {
    const venta = await this.obtener(id);
    if (venta.estado !== "BORRADOR") {
      throw new ConflictError(
        "Solo se puede anular una venta en estado BORRADOR (una venta confirmada requiere un AJUSTE manual sobre los movimientos ya generados)"
      );
    }
    const anulada = await ventasRepository.anular(id);
    await alertasService.generarVentaAnulada(anulada.id, anulada.numero);
    return anulada;
  },
};
