import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarCategoriaInput, CrearCategoriaInput } from "./CategoriasValidators";

export const categoriasRepository = {
  listar() {
    return prisma.categoria.findMany({
      where: { deletedAt: null, empresaId: obtenerEmpresaActiva() },
      orderBy: { nombre: "asc" },
    });
  },

  buscarPorId(id: string) {
    return prisma.categoria.findFirst({ where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.categoria.findFirst({ where: { nombre, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  async crear(data: CrearCategoriaInput) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.categoria.create({ data: { ...data, empresaId } });
  },

  // empresaId en el where es defensa en profundidad -- ver el comentario
  // equivalente en ProductosRepository.actualizar.
  actualizar(id: string, data: ActualizarCategoriaInput) {
    return prisma.categoria.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data });
  },

  softDelete(id: string) {
    return prisma.categoria.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
