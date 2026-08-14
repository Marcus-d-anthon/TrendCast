import { ConflictError, NotFoundError } from "../../lib/errors";
import { productosRepository } from "../productos/ProductosRepository";
import { movimientosRepository } from "./MovimientosRepository";
import type { ListarMovimientosQuery, RegistrarMovimientoInput } from "./MovimientosValidators";

export const movimientosService = {
  listar(filtros: ListarMovimientosQuery) {
    return movimientosRepository.listar(filtros);
  },

  async listarPaginado(filtros: ListarMovimientosQuery) {
    const page = filtros.page ?? 1;
    const pageSize = filtros.pageSize;
    const { data, total } = await movimientosRepository.listarPaginado(filtros, page, pageSize);
    return { data, meta: { total, page, pageSize, totalPaginas: Math.max(1, Math.ceil(total / pageSize)) } };
  },

  async registrar(usuarioId: string, input: RegistrarMovimientoInput) {
    const producto = await productosRepository.buscarPorId(input.productoId);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }
    if (!producto.activo) {
      throw new ConflictError("No se pueden registrar movimientos sobre un producto inactivo");
    }

    const stockDelAlmacen = producto.stocks.find((s) => s.almacenId === input.almacenId);
    if (!stockDelAlmacen) {
      throw new NotFoundError("El producto no tiene stock registrado en el almacen indicado");
    }
    const saldoResultante = await this.calcularSaldoResultante(input, stockDelAlmacen.cantidad);

    return movimientosRepository.registrar(usuarioId, input, saldoResultante);
  },

  async calcularSaldoResultante(input: RegistrarMovimientoInput, stockActual: number): Promise<number> {
    if (input.tipo === "ENTRADA") {
      return stockActual + input.cantidad;
    }

    if (input.tipo === "SALIDA") {
      const saldoResultante = stockActual - input.cantidad;
      if (saldoResultante < 0) {
        throw new ConflictError(
          `Stock insuficiente: hay ${stockActual} unidades disponibles y se intentan retirar ${input.cantidad}`
        );
      }
      return saldoResultante;
    }

    // AJUSTE: "cantidad" representa el nuevo saldo absoluto correcto (no un
    // delta), para eliminar la ambiguedad de si un ajuste suma o resta. Por
    // el CHECK de base de datos (cantidad > 0), un ajuste no puede fijar el
    // saldo exactamente en 0; ese caso excepcional se registra como una
    // SALIDA por el total del stock restante, manteniendo a "cantidad" como
    // magnitud siempre positiva en los tres tipos de movimiento.
    const original = await movimientosRepository.buscarPorId(input.movimientoOrigenId as string);
    if (!original || original.productoId !== input.productoId || original.almacenId !== input.almacenId) {
      throw new NotFoundError("El movimiento original a ajustar no existe para este producto y almacen");
    }
    return input.cantidad;
  },
};
