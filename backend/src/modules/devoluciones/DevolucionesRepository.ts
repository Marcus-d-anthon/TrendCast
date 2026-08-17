import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaActiva } from "../../lib/async-context";
import { ConflictError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import type { CrearDevolucionInput } from "./DevolucionesValidators";

const INCLUDE_RELACIONES = {
  venta: { select: { id: true, numero: true } },
  compra: { select: { id: true, numero: true } },
  almacen: true,
  usuario: { select: { id: true, nombre: true, email: true } },
  detalle: { include: { producto: { select: { id: true, sku: true, nombre: true } } } },
} as const;

export interface DetalleDevolucionCalculado {
  productoId: string;
  cantidad: number;
}

export interface ListarDevolucionesParams {
  page: number;
  pageSize: number;
  estado?: "BORRADOR" | "CONFIRMADA" | "ANULADA";
  tipo?: "CLIENTE" | "PROVEEDOR";
}

export const devolucionesRepository = {
  listar(filtros: { ventaId?: string; compraId?: string } = {}) {
    return prisma.devolucion.findMany({
      where: { empresaId: obtenerEmpresaActiva(), ...filtros },
      orderBy: { fecha: "desc" },
      include: INCLUDE_RELACIONES,
    });
  },

  async listarPaginado({ page, pageSize, estado, tipo }: ListarDevolucionesParams) {
    const where: Prisma.DevolucionWhereInput = {
      empresaId: obtenerEmpresaActiva(),
      ...(estado ? { estado } : {}),
      ...(tipo ? { tipo } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.devolucion.findMany({
        where,
        orderBy: { fecha: "desc" },
        include: INCLUDE_RELACIONES,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.devolucion.count({ where }),
    ]);

    return { data, total };
  },

  buscarPorId(id: string) {
    return prisma.devolucion.findFirst({ where: { id, empresaId: obtenerEmpresaActiva() }, include: INCLUDE_RELACIONES });
  },

  // Numero secuencial por año Y por empresa -- mismo patron que
  // ComprasRepository.generarNumero / VentasRepository.generarNumero.
  async generarNumero(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await prisma.devolucion.count({ where: { empresaId: obtenerEmpresaActiva() } });
    return `DEV-${anio}-${String(total + 1).padStart(4, "0")}`;
  },

  async crear(usuarioId: string, input: CrearDevolucionInput, almacenId: string, detalle: DetalleDevolucionCalculado[]) {
    const empresaId = obtenerEmpresaActiva();
    const numero = await this.generarNumero();
    return prisma.devolucion.create({
      data: {
        numero,
        empresaId,
        tipo: input.tipo,
        motivo: input.motivo,
        ventaId: input.ventaId ?? null,
        compraId: input.compraId ?? null,
        almacenId,
        usuarioId,
        detalle: { create: detalle },
      },
      include: INCLUDE_RELACIONES,
    });
  },

  // Mismo patron que Compras/VentasRepository.confirmar (transaccion atomica,
  // un MovimientoInventario por linea). CLIENTE suma stock (como una
  // compra), PROVEEDOR lo resta (como una venta, con la misma validacion de
  // stock suficiente -- no se puede devolver al proveedor mas de lo que hay
  // fisicamente en el almacen).
  async confirmar(devolucionId: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      const devolucion = await tx.devolucion.findUniqueOrThrow({ where: { id: devolucionId }, include: { detalle: true } });
      const esEntrada = devolucion.tipo === "CLIENTE";

      for (const linea of devolucion.detalle) {
        const stockActual = await tx.stock.findUniqueOrThrow({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: devolucion.almacenId } },
        });
        const saldoResultante = esEntrada ? stockActual.cantidad + linea.cantidad : stockActual.cantidad - linea.cantidad;
        if (saldoResultante < 0) {
          const producto = await tx.producto.findUniqueOrThrow({ where: { id: linea.productoId } });
          throw new ConflictError(
            `Stock insuficiente para ${producto.sku}: hay ${stockActual.cantidad} unidades y se intenta devolver ${linea.cantidad} al proveedor`
          );
        }

        const movimiento = await tx.movimientoInventario.create({
          data: {
            tipo: esEntrada ? "DEVOLUCION_CLIENTE" : "DEVOLUCION_PROVEEDOR",
            cantidad: linea.cantidad,
            saldoResultante,
            referencia: devolucion.numero,
            motivo: devolucion.motivo,
            productoId: linea.productoId,
            almacenId: devolucion.almacenId,
            usuarioId,
            devolucionId: devolucion.id,
            ventaId: devolucion.ventaId,
            compraId: devolucion.compraId,
          },
        });

        await tx.stock.update({
          where: { productoId_almacenId: { productoId: linea.productoId, almacenId: devolucion.almacenId } },
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

      return tx.devolucion.update({
        where: { id: devolucionId },
        data: { estado: "CONFIRMADA" },
        include: INCLUDE_RELACIONES,
      });
    });
  },

  // Cuanto ya se devolvio (en devoluciones CONFIRMADAS) de un producto
  // dentro de una venta/compra especifica -- el Service lo usa para capar
  // cuanto se puede devolver todavia (nunca mas de lo que se vendio/compro).
  async cantidadDevueltaDeVenta(ventaId: string, productoId: string): Promise<number> {
    const resultado = await prisma.detalleDevolucion.aggregate({
      where: { productoId, devolucion: { ventaId, estado: "CONFIRMADA" } },
      _sum: { cantidad: true },
    });
    return resultado._sum.cantidad ?? 0;
  },

  async cantidadDevueltaDeCompra(compraId: string, productoId: string): Promise<number> {
    const resultado = await prisma.detalleDevolucion.aggregate({
      where: { productoId, devolucion: { compraId, estado: "CONFIRMADA" } },
      _sum: { cantidad: true },
    });
    return resultado._sum.cantidad ?? 0;
  },
};
