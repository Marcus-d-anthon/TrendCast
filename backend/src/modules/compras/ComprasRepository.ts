import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { CrearCompraInput } from "./ComprasValidators";

const INCLUDE_RELACIONES = {
  proveedor: true,
  almacen: true,
  usuario: { select: { id: true, nombre: true, email: true } },
  detalle: { include: { producto: { select: { id: true, sku: true, nombre: true } } } },
} as const;

export interface DetalleCalculado {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export const comprasRepository = {
  listar() {
    return prisma.compra.findMany({ orderBy: { fecha: "desc" }, include: INCLUDE_RELACIONES });
  },

  buscarPorId(id: string) {
    return prisma.compra.findUnique({ where: { id }, include: INCLUDE_RELACIONES });
  },

  // Numero de documento secuencial por año (COM-2026-0001, ...). No hay
  // concurrencia alta esperada en este sistema; suficiente para el alcance.
  async generarNumero(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await prisma.compra.count();
    return `COM-${anio}-${String(total + 1).padStart(4, "0")}`;
  },

  async crear(
    usuarioId: string,
    input: CrearCompraInput,
    totales: { subtotal: number; impuesto: number; total: number; detalle: DetalleCalculado[] }
  ) {
    const empresaId = await obtenerEmpresaId();
    const numero = await this.generarNumero();
    return prisma.compra.create({
      data: {
        numero,
        empresaId,
        proveedorId: input.proveedorId,
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

  // Ruta critica: confirmar una compra corre en UNA transaccion atomica.
  // Por cada linea genera un MovimientoInventario ENTRADA y actualiza Stock
  // -- mismo principio que MovimientosRepository.registrar, generalizado
  // para iterar N lineas en vez de una sola. El AuditLog se escribe
  // explicitamente aqui (no via extension) por la misma razon documentada
  // en MovimientosRepository: las extensiones de query no garantizan
  // visibilidad completa dentro de transacciones interactivas.
  async confirmar(compraId: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUniqueOrThrow({ where: { id: compraId }, include: { detalle: true } });

      for (const linea of compra.detalle) {
        const stockActual = await tx.stock.findUniqueOrThrow({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: compra.almacenId } },
        });
        const saldoResultante = stockActual.cantidad + linea.cantidad;

        const movimiento = await tx.movimientoInventario.create({
          data: {
            tipo: "ENTRADA",
            cantidad: linea.cantidad,
            saldoResultante,
            referencia: compra.numero,
            motivo: "Recepcion de compra confirmada",
            productoId: linea.productoId,
            almacenId: compra.almacenId,
            usuarioId,
            compraId: compra.id,
          },
        });

        await tx.stock.update({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: compra.almacenId } },
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
      }

      return tx.compra.update({
        where: { id: compraId },
        data: { estado: "CONFIRMADA" },
        include: INCLUDE_RELACIONES,
      });
    });
  },

  anular(id: string) {
    return prisma.compra.update({ where: { id }, data: { estado: "ANULADA" }, include: INCLUDE_RELACIONES });
  },
};
