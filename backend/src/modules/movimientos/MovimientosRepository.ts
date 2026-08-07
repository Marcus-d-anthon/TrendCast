import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { ListarMovimientosQuery, RegistrarMovimientoInput } from "./MovimientosValidators";

const INCLUDE_RELACIONES = {
  producto: { select: { id: true, sku: true, nombre: true } },
  usuario: { select: { id: true, nombre: true, email: true } },
} as const;

export const movimientosRepository = {
  buscarPorId(id: string) {
    return prisma.movimientoInventario.findUnique({ where: { id } });
  },

  listar(filtros: ListarMovimientosQuery) {
    return prisma.movimientoInventario.findMany({
      where: {
        productoId: filtros.productoId,
        almacenId: filtros.almacenId,
        tipo: filtros.tipo,
        fecha: {
          gte: filtros.desde,
          lte: filtros.hasta,
        },
      },
      orderBy: { fecha: "desc" },
      include: INCLUDE_RELACIONES,
    });
  },

  // Ruta critica: leer el stock actual, insertar el movimiento, actualizar
  // el saldo y registrar el audit_log corren en UNA sola transaccion atomica
  // (todo o nada). El AuditLog se escribe explicitamente aqui (no via
  // extension) porque MovimientoInventario esta fuera de la lista blanca de
  // auto-auditoria -- ver extensions/audit.extension.ts.
  async registrar(usuarioId: string, input: RegistrarMovimientoInput, saldoResultante: number) {
    return prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: input.tipo,
          cantidad: input.cantidad,
          saldoResultante,
          referencia: input.referencia,
          motivo: input.motivo,
          productoId: input.productoId,
          almacenId: input.almacenId,
          usuarioId,
          movimientoOrigenId: input.movimientoOrigenId,
        },
      });

      await tx.stock.update({
        where: { productoId_almacenId: { productoId: input.productoId, almacenId: input.almacenId } },
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

      return tx.movimientoInventario.findUniqueOrThrow({
        where: { id: movimiento.id },
        include: INCLUDE_RELACIONES,
      });
    });
  },
};
