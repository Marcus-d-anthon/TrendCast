import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaId } from "../../lib/empresa";
import { ConflictError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import type { CrearVentaInput } from "./ventas.validators";

const INCLUDE_RELACIONES = {
  cliente: true,
  almacen: true,
  usuario: { select: { id: true, nombre: true, email: true } },
  detalle: { include: { producto: { select: { id: true, sku: true, nombre: true, stockMinimo: true } } } },
} as const;

export interface DetalleCalculado {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export const ventasRepository = {
  listar() {
    return prisma.venta.findMany({ orderBy: { fecha: "desc" }, include: INCLUDE_RELACIONES });
  },

  buscarPorId(id: string) {
    return prisma.venta.findUnique({ where: { id }, include: INCLUDE_RELACIONES });
  },

  async generarNumero(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await prisma.venta.count();
    return `VEN-${anio}-${String(total + 1).padStart(4, "0")}`;
  },

  async crear(
    usuarioId: string,
    input: CrearVentaInput,
    totales: { subtotal: number; impuesto: number; total: number; detalle: DetalleCalculado[] }
  ) {
    const empresaId = await obtenerEmpresaId();
    const numero = await this.generarNumero();
    return prisma.venta.create({
      data: {
        numero,
        empresaId,
        clienteId: input.clienteId,
        almacenId: input.almacenId,
        usuarioId,
        subtotal: totales.subtotal,
        impuesto: totales.impuesto,
        total: totales.total,
        detalle: { create: totales.detalle },
      },
      include: INCLUDE_RELACIONES,
    });
  },

  // Simetrico a compras.repository.confirmar, con SALIDA en vez de ENTRADA:
  // por cada linea valida que el stock alcance (mismo criterio que
  // movimientos.service.calcularSaldoResultante para una SALIDA manual) y
  // solo entonces genera el movimiento + actualiza Stock, todo en UNA
  // transaccion atomica.
  async confirmar(ventaId: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUniqueOrThrow({ where: { id: ventaId }, include: { detalle: true } });

      const productosAfectados: { productoId: string; saldoResultante: number; stockMinimo: number }[] = [];

      for (const linea of venta.detalle) {
        const stockActual = await tx.stock.findUniqueOrThrow({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: venta.almacenId } },
        });
        const saldoResultante = stockActual.cantidad - linea.cantidad;
        if (saldoResultante < 0) {
          const producto = await tx.producto.findUniqueOrThrow({ where: { id: linea.productoId } });
          throw new ConflictError(
            `Stock insuficiente para ${producto.sku}: hay ${stockActual.cantidad} unidades y se intentan vender ${linea.cantidad}`
          );
        }

        const movimiento = await tx.movimientoInventario.create({
          data: {
            tipo: "SALIDA",
            cantidad: linea.cantidad,
            saldoResultante,
            referencia: venta.numero,
            motivo: "Despacho de venta confirmada",
            productoId: linea.productoId,
            almacenId: venta.almacenId,
            usuarioId,
            ventaId: venta.id,
          },
        });

        await tx.stock.update({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: venta.almacenId } },
          data: { cantidad: saldoResultante },
        });

        await tx.auditLog.create({
          data: {
            entidad: "MovimientoInventario",
            registroId: movimiento.id,
            accion: "CREATE",
            valorAnterior: Prisma.JsonNull,
            valorNuevo: movimiento as unknown as Prisma.InputJsonValue,
            usuarioId,
          },
        });

        const producto = await tx.producto.findUniqueOrThrow({ where: { id: linea.productoId } });
        productosAfectados.push({ productoId: linea.productoId, saldoResultante, stockMinimo: producto.stockMinimo });
      }

      const ventaConfirmada = await tx.venta.update({
        where: { id: ventaId },
        data: { estado: "CONFIRMADA" },
        include: INCLUDE_RELACIONES,
      });

      return { venta: ventaConfirmada, productosAfectados };
    });
  },

  anular(id: string) {
    return prisma.venta.update({ where: { id }, data: { estado: "ANULADA" }, include: INCLUDE_RELACIONES });
  },
};
