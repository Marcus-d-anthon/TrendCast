import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarClienteInput, CrearClienteInput } from "./ClientesValidators";

export const clientesRepository = {
  listar() {
    return prisma.cliente.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.cliente.findFirst({ where: { id, deletedAt: null } });
  },

  async buscarPorNumeroDocumento(numeroDocumento: string) {
    const empresaId = await obtenerEmpresaId();
    return prisma.cliente.findFirst({ where: { numeroDocumento, empresaId, deletedAt: null } });
  },

  async crear(data: CrearClienteInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.cliente.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarClienteInput) {
    return prisma.cliente.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.cliente.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
