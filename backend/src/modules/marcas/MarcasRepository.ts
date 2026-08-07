import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarMarcaInput, CrearMarcaInput } from "./marcas.validators";

export const marcasRepository = {
  listar() {
    return prisma.marca.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.marca.findFirst({ where: { id, deletedAt: null } });
  },

  buscarPorNombre(nombre: string) {
    return prisma.marca.findFirst({ where: { nombre, deletedAt: null } });
  },

  async crear(data: CrearMarcaInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.marca.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarMarcaInput) {
    return prisma.marca.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.marca.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
