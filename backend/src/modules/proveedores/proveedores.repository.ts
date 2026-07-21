import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { ActualizarProveedorInput, CrearProveedorInput } from "./proveedores.validators";

export const proveedoresRepository = {
  listar() {
    return prisma.proveedor.findMany({ where: { deletedAt: null }, orderBy: { razonSocial: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.proveedor.findFirst({ where: { id, deletedAt: null } });
  },

  async buscarPorNumeroDocumento(numeroDocumento: string) {
    const empresaId = await obtenerEmpresaId();
    return prisma.proveedor.findFirst({ where: { numeroDocumento, empresaId, deletedAt: null } });
  },

  async crear(data: CrearProveedorInput) {
    const empresaId = await obtenerEmpresaId();
    return prisma.proveedor.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarProveedorInput) {
    return prisma.proveedor.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.proveedor.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
