import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarMarcaInput, CrearMarcaInput } from "./MarcasValidators";

export const marcasRepository = {
  listar() {
    return prisma.marca.findMany({ where: { deletedAt: null, empresaId: obtenerEmpresaActiva() }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.marca.findFirst({ where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.marca.findFirst({ where: { nombre, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  async crear(data: CrearMarcaInput) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.marca.create({ data: { ...data, empresaId } });
  },

  // empresaId en el where es defensa en profundidad -- ver el comentario
  // equivalente en ProductosRepository.actualizar.
  actualizar(id: string, data: ActualizarMarcaInput) {
    return prisma.marca.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data });
  },

  softDelete(id: string) {
    return prisma.marca.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
