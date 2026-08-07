import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarProductoInput, CrearProductoInput } from "./ProductosValidators";

const INCLUDE_RELACIONES = { categoria: true, marca: true, unidadMedida: true, stocks: { include: { almacen: true } } } as const;

export const productosRepository = {
  listar() {
    return prisma.producto.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
      include: INCLUDE_RELACIONES,
    });
  },

  buscarPorId(id: string) {
    return prisma.producto.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE_RELACIONES,
    });
  },

  buscarPorSku(sku: string) {
    return prisma.producto.findFirst({ where: { sku, deletedAt: null } });
  },

  // Crea el producto y su saldo inicial en cero en CADA almacen activo de la
  // empresa, en una unica transaccion atomica: nunca debe existir un
  // producto sin fila de stock en un almacen operativo.
  async crearConStock(data: CrearProductoInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.$transaction(async (tx) => {
      const producto = await tx.producto.create({ data: { ...data, empresaId } });
      const almacenes = await tx.almacen.findMany({ where: { empresaId, activo: true, deletedAt: null } });
      await tx.stock.createMany({
        data: almacenes.map((almacen) => ({ productoId: producto.id, almacenId: almacen.id, cantidad: 0 })),
      });
      return tx.producto.findUniqueOrThrow({
        where: { id: producto.id },
        include: INCLUDE_RELACIONES,
      });
    });
  },

  actualizar(id: string, data: ActualizarProductoInput) {
    return prisma.producto.update({ where: { id }, data, include: INCLUDE_RELACIONES });
  },

  softDelete(id: string) {
    return prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
