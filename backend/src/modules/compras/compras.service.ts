import { ConflictError, NotFoundError } from "../../lib/errors";
import { almacenesRepository } from "../almacenes/almacenes.repository";
import { productosRepository } from "../productos/productos.repository";
import { proveedoresRepository } from "../proveedores/proveedores.repository";
import { comprasRepository, type DetalleCalculado } from "./compras.repository";
import type { CrearCompraInput } from "./compras.validators";

// Tasa de IVA vigente en Ecuador (misma constante conceptual usada en el
// calculo ilustrativo de prisma/seed.ts).
const IVA_ECUADOR = 0.15;

export const comprasService = {
  listar() {
    return comprasRepository.listar();
  },

  async obtener(id: string) {
    const compra = await comprasRepository.buscarPorId(id);
    if (!compra) {
      throw new NotFoundError("Compra no encontrada");
    }
    return compra;
  },

  async crear(usuarioId: string, input: CrearCompraInput) {
    const proveedor = await proveedoresRepository.buscarPorId(input.proveedorId);
    if (!proveedor) {
      throw new NotFoundError("El proveedor indicado no existe");
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

    return comprasRepository.crear(usuarioId, input, { subtotal, impuesto, total, detalle });
  },

  async confirmar(id: string, usuarioId: string) {
    const compra = await this.obtener(id);
    if (compra.estado !== "BORRADOR") {
      throw new ConflictError("Solo se puede confirmar una compra en estado BORRADOR");
    }
    return comprasRepository.confirmar(id, usuarioId);
  },

  // Anular solo aplica a compras en BORRADOR: una compra ya CONFIRMADA ya
  // genero movimientos reales de inventario que no se revierten solos --
  // corregirlos requiere un AJUSTE manual sobre esos movimientos, igual que
  // cualquier otra correccion del libro (nunca se edita ni se borra).
  async anular(id: string) {
    const compra = await this.obtener(id);
    if (compra.estado !== "BORRADOR") {
      throw new ConflictError(
        "Solo se puede anular una compra en estado BORRADOR (una compra confirmada requiere un AJUSTE manual sobre los movimientos ya generados)"
      );
    }
    return comprasRepository.anular(id);
  },
};
