import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarAlmacenInput, CrearAlmacenInput } from "./AlmacenesValidators";

export const almacenesRepository = {
  listar() {
    return prisma.almacen.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.almacen.findFirst({ where: { id, deletedAt: null } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.almacen.findFirst({ where: { nombre, deletedAt: null } });
  },

  // Simetrico a ProductosRepository.crearConStock: un almacen nuevo debe
  // nacer con una fila de Stock (cantidad 0) para CADA producto activo ya
  // existente, para que ese almacen quede utilizable de inmediato en
  // movimientos/ventas/compras sin un paso manual adicional.
  async crearConStock(data: CrearAlmacenInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.$transaction(async (tx) => {
      const almacen = await tx.almacen.create({ data: { ...data, empresaId } });
      const productos = await tx.producto.findMany({ where: { empresaId, activo: true, deletedAt: null } });
      if (productos.length > 0) {
        await tx.stock.createMany({
          data: productos.map((producto) => ({ productoId: producto.id, almacenId: almacen.id, cantidad: 0 })),
        });
      }
      return almacen;
    });
  },

  actualizar(id: string, data: ActualizarAlmacenInput) {
    return prisma.almacen.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.almacen.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  buscarStock(productoId: string, almacenId: string) {
    return prisma.stock.findUnique({ where: { productoId_almacenId: { productoId, almacenId } } });
  },

  // Mismo espiritu que MovimientosRepository.registrar: leer el stock,
  // insertar los movimientos y actualizar ambos saldos corren en UNA sola
  // transaccion atomica. Una transferencia genera DOS filas de tipo
  // TRANSFERENCIA (salida en el origen, entrada en el destino) enlazadas
  // por movimiento_origen_id -- mismo mecanismo de auto-relacion que ya usa
  // un AJUSTE para referenciar el movimiento que corrige.
  async registrarTransferencia(
    usuarioId: string,
    input: { productoId: string; almacenOrigenId: string; almacenDestinoId: string; cantidad: number; motivo?: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const stockOrigen = await tx.stock.findUniqueOrThrow({
        where: { productoId_almacenId: { productoId: input.productoId, almacenId: input.almacenOrigenId } },
      });
      const stockDestino = await tx.stock.findUniqueOrThrow({
        where: { productoId_almacenId: { productoId: input.productoId, almacenId: input.almacenDestinoId } },
      });

      const saldoOrigen = stockOrigen.cantidad - input.cantidad;
      const saldoDestino = stockDestino.cantidad + input.cantidad;

      const salida = await tx.movimientoInventario.create({
        data: {
          tipo: "TRANSFERENCIA",
          cantidad: input.cantidad,
          saldoResultante: saldoOrigen,
          motivo: input.motivo,
          referencia: `Transferencia a almacen ${input.almacenDestinoId}`,
          productoId: input.productoId,
          almacenId: input.almacenOrigenId,
          usuarioId,
        },
      });

      const entrada = await tx.movimientoInventario.create({
        data: {
          tipo: "TRANSFERENCIA",
          cantidad: input.cantidad,
          saldoResultante: saldoDestino,
          motivo: input.motivo,
          referencia: `Transferencia desde almacen ${input.almacenOrigenId}`,
          movimientoOrigenId: salida.id,
          productoId: input.productoId,
          almacenId: input.almacenDestinoId,
          usuarioId,
        },
      });

      await tx.stock.update({
        where: { productoId_almacenId: { productoId: input.productoId, almacenId: input.almacenOrigenId } },
        data: { cantidad: saldoOrigen },
      });
      await tx.stock.update({
        where: { productoId_almacenId: { productoId: input.productoId, almacenId: input.almacenDestinoId } },
        data: { cantidad: saldoDestino },
      });

      await tx.auditLog.create({
        data: {
          entidad: "MovimientoInventario",
          registroId: entrada.id,
          accion: "CREATE",
          valorAnterior: Prisma.JsonNull,
          valorNuevo: { salida, entrada } as unknown as Prisma.InputJsonValue,
          usuarioId,
        },
      });

      return { salida, entrada };
    });
  },
};
