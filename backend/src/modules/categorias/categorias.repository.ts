import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarCategoriaInput, CrearCategoriaInput } from "./categorias.validators";

export const categoriasRepository = {
  listar() {
    return prisma.categoria.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
    });
  },

  buscarPorId(id: string) {
    return prisma.categoria.findFirst({ where: { id, deletedAt: null } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.categoria.findFirst({ where: { nombre, deletedAt: null } });
  },

  async crear(data: CrearCategoriaInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.categoria.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarCategoriaInput) {
    return prisma.categoria.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.categoria.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
