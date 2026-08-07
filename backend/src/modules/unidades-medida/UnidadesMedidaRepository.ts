import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarUnidadMedidaInput, CrearUnidadMedidaInput } from "./UnidadesMedidaValidators";

export const unidadesMedidaRepository = {
  listar() {
    return prisma.unidadMedida.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.unidadMedida.findFirst({ where: { id, deletedAt: null } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.unidadMedida.findFirst({ where: { nombre, deletedAt: null } });
  },

  async crear(data: CrearUnidadMedidaInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.unidadMedida.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarUnidadMedidaInput) {
    return prisma.unidadMedida.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.unidadMedida.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
