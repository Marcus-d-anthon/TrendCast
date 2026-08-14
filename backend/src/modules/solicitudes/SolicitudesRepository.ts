import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaActiva } from "../../lib/async-context";
import { ConflictError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import type { CrearSolicitudInput, ListarSolicitudesQuery } from "./SolicitudesValidators";

const INCLUDE_RELACIONES = {
  producto: { select: { id: true, sku: true, nombre: true } },
  almacen: { select: { id: true, nombre: true } },
  solicitante: { select: { id: true, nombre: true, email: true } },
  aprobador: { select: { id: true, nombre: true, email: true } },
  efectuador: { select: { id: true, nombre: true, email: true } },
} as const;

export interface ListarSolicitudesFiltros extends ListarSolicitudesQuery {
  solicitanteId?: string;
}

export const solicitudesRepository = {
  // Solicitud no tiene columna empresa_id propia -- se acota via producto,
  // mismo motivo que MovimientosRepository.
  listar(filtros: ListarSolicitudesFiltros) {
    const where: Prisma.SolicitudWhereInput = {
      estado: filtros.estado,
      solicitanteId: filtros.solicitanteId,
      producto: { empresaId: obtenerEmpresaActiva() },
    };
    return prisma.solicitud.findMany({
      where,
      include: INCLUDE_RELACIONES,
      orderBy: { createdAt: "desc" },
    });
  },

  buscarPorId(id: string) {
    return prisma.solicitud.findFirst({
      where: { id, producto: { empresaId: obtenerEmpresaActiva() } },
      include: INCLUDE_RELACIONES,
    });
  },

  // Codigo legible por empresa (mismo patron que ComprasRepository.generarNumero):
  // se prefiere sobre el id crudo (UUID) para cualquier lugar donde un
  // humano necesite escribirlo/leerlo en voz alta -- el id sigue siendo la
  // llave primaria real e impredecible, esto es solo una referencia.
  async generarNumero(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await prisma.solicitud.count({ where: { producto: { empresaId: obtenerEmpresaActiva() } } });
    return `SOL-${anio}-${String(total + 1).padStart(4, "0")}`;
  },

  async crear(solicitanteId: string, input: CrearSolicitudInput) {
    const numero = await this.generarNumero();
    return prisma.solicitud.create({
      data: { ...input, solicitanteId, numero },
      include: INCLUDE_RELACIONES,
    });
  },

  aprobar(id: string, aprobadorId: string) {
    return prisma.solicitud.update({
      where: { id },
      data: { estado: "APROBADA", aprobadorId, fechaAprobacion: new Date() },
      include: INCLUDE_RELACIONES,
    });
  },

  rechazar(id: string, aprobadorId: string, motivo: string) {
    return prisma.solicitud.update({
      where: { id },
      data: { estado: "RECHAZADA", aprobadorId, fechaAprobacion: new Date(), motivoRechazo: motivo },
      include: INCLUDE_RELACIONES,
    });
  },

  // Ruta critica (mismo principio que ComprasRepository.confirmar /
  // VentasRepository.confirmar): en UNA transaccion atomica genera el
  // MovimientoInventario real que la solicitud representaba (ENTRADA para
  // REABASTECIMIENTO, SALIDA para VENTA_ESPECIAL), actualiza Stock, escribe
  // el AuditLog explicito (las extensiones de query no garantizan
  // visibilidad dentro de transacciones interactivas) y recien entonces
  // marca la solicitud como EFECTUADA.
  async efectuar(solicitudId: string, efectuadorId: string) {
    return prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitud.findUniqueOrThrow({ where: { id: solicitudId } });

      const stockActual = await tx.stock.findUniqueOrThrow({
        where: { productoId_almacenId: { productoId: solicitud.productoId, almacenId: solicitud.almacenId } },
      });

      const tipoMovimiento = solicitud.tipo === "REABASTECIMIENTO" ? "ENTRADA" : "SALIDA";
      const saldoResultante =
        tipoMovimiento === "ENTRADA" ? stockActual.cantidad + solicitud.cantidad : stockActual.cantidad - solicitud.cantidad;

      if (saldoResultante < 0) {
        const producto = await tx.producto.findUniqueOrThrow({ where: { id: solicitud.productoId } });
        throw new ConflictError(
          `Stock insuficiente para ${producto.sku}: hay ${stockActual.cantidad} unidades y la solicitud pide ${solicitud.cantidad}`
        );
      }

      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: tipoMovimiento,
          cantidad: solicitud.cantidad,
          saldoResultante,
          referencia: solicitud.numero ?? `SOL-${solicitud.id.slice(0, 8)}`,
          motivo:
            solicitud.tipo === "REABASTECIMIENTO" ? "Reabastecimiento por solicitud aprobada" : "Venta especial por solicitud aprobada",
          productoId: solicitud.productoId,
          almacenId: solicitud.almacenId,
          usuarioId: efectuadorId,
          solicitudId: solicitud.id,
        },
      });

      await tx.stock.update({
        where: { productoId_almacenId: { productoId: solicitud.productoId, almacenId: solicitud.almacenId } },
        data: { cantidad: saldoResultante },
      });

      await tx.auditLog.create({
        data: {
          entidad: "MovimientoInventario",
          registroId: movimiento.id,
          accion: "CREATE",
          valorAnterior: Prisma.JsonNull,
          valorNuevo: movimiento as unknown as Prisma.InputJsonValue,
          usuarioId: efectuadorId,
        },
      });

      return tx.solicitud.update({
        where: { id: solicitudId },
        data: { estado: "EFECTUADA", efectuadorId, fechaEfectuacion: new Date() },
        include: INCLUDE_RELACIONES,
      });
    });
  },
};
