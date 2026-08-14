import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarProveedorInput, CrearProveedorInput } from "./ProveedoresValidators";

export const proveedoresRepository = {
  listar() {
    return prisma.proveedor.findMany({ where: { deletedAt: null, empresaId: obtenerEmpresaActiva() }, orderBy: { razonSocial: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.proveedor.findFirst({ where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  buscarPorNumeroDocumento(numeroDocumento: string) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.proveedor.findFirst({ where: { numeroDocumento, empresaId, deletedAt: null } });
  },

  // Codigo legible por empresa (mismo patron que ComprasRepository.generarNumero) --
  // ver el comentario equivalente en SolicitudesRepository.generarNumero.
  async generarCodigo(): Promise<string> {
    const empresaId = obtenerEmpresaActiva();
    const total = await prisma.proveedor.count({ where: { empresaId } });
    return `PRV-${String(total + 1).padStart(6, "0")}`;
  },

  async crear(data: CrearProveedorInput) {
    const empresaId = obtenerEmpresaActiva();
    const codigo = await this.generarCodigo();
    return prisma.proveedor.create({ data: { ...data, empresaId, codigo } });
  },

  // empresaId en el where es defensa en profundidad -- ver el comentario
  // equivalente en ProductosRepository.actualizar.
  actualizar(id: string, data: ActualizarProveedorInput) {
    return prisma.proveedor.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data });
  },

  softDelete(id: string) {
    return prisma.proveedor.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
