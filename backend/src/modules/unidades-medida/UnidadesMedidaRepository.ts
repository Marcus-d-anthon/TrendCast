import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarUnidadMedidaInput, CrearUnidadMedidaInput } from "./UnidadesMedidaValidators";

export const unidadesMedidaRepository = {
  listar() {
    return prisma.unidadMedida.findMany({ where: { deletedAt: null, empresaId: obtenerEmpresaActiva() }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.unidadMedida.findFirst({ where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.unidadMedida.findFirst({ where: { nombre, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  async crear(data: CrearUnidadMedidaInput) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.unidadMedida.create({ data: { ...data, empresaId } });
  },

  // empresaId en el where es defensa en profundidad -- ver el comentario
  // equivalente en ProductosRepository.actualizar.
  actualizar(id: string, data: ActualizarUnidadMedidaInput) {
    return prisma.unidadMedida.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data });
  },

  softDelete(id: string) {
    return prisma.unidadMedida.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
