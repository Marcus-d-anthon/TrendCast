import { Prisma } from "../../generated/prisma/client";
import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarProductoInput, CrearProductoInput } from "./ProductosValidators";

const INCLUDE_RELACIONES = { categoria: true, marca: true, unidadMedida: true, stocks: { include: { almacen: true } } } as const;

export interface ListarPaginadoParams {
  page: number;
  pageSize: number;
  busqueda?: string;
  categoriaId?: string;
}

export const productosRepository = {
  // Usado por exportacion (catalogo completo) y por cualquier consumidor
  // interno que de verdad necesite TODOS los productos, no una pagina.
  listar() {
    return prisma.producto.findMany({
      where: { deletedAt: null, empresaId: obtenerEmpresaActiva() },
      orderBy: { nombre: "asc" },
      include: INCLUDE_RELACIONES,
    });
  },

  async listarPaginado({ page, pageSize, busqueda, categoriaId }: ListarPaginadoParams) {
    const where: Prisma.ProductoWhereInput = {
      deletedAt: null,
      empresaId: obtenerEmpresaActiva(),
      ...(categoriaId ? { categoriaId } : {}),
      ...(busqueda
        ? { OR: [{ nombre: { contains: busqueda, mode: "insensitive" } }, { sku: { contains: busqueda, mode: "insensitive" } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        orderBy: { nombre: "asc" },
        include: INCLUDE_RELACIONES,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.producto.count({ where }),
    ]);

    return { data, total };
  },

  buscarPorId(id: string) {
    return prisma.producto.findFirst({
      where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() },
      include: INCLUDE_RELACIONES,
    });
  },

  buscarPorSku(sku: string) {
    return prisma.producto.findFirst({ where: { sku, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  // Crea el producto y su saldo inicial en cero en CADA almacen activo de la
  // empresa, en una unica transaccion atomica: nunca debe existir un
  // producto sin fila de stock en un almacen operativo.
  async crearConStock(data: CrearProductoInput) {
    const empresaId = obtenerEmpresaActiva();
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

  // empresaId en el where (ademas del id) es defensa en profundidad: hoy el
  // service ya valida propiedad vía buscarPorId() antes de llamar aqui, pero
  // si algun modulo nuevo llegara a saltarse ese paso, Prisma rechaza el
  // update entero (P2025, "registro no encontrado") en vez de escribir sobre
  // el producto de otra empresa -- mismo principio en el resto de este archivo.
  actualizar(id: string, data: ActualizarProductoInput) {
    return prisma.producto.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data, include: INCLUDE_RELACIONES });
  },

  softDelete(id: string) {
    return prisma.producto.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
