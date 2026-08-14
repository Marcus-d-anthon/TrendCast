import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { ActualizarClienteInput, CrearClienteInput } from "./ClientesValidators";

export const clientesRepository = {
  listar() {
    return prisma.cliente.findMany({ where: { deletedAt: null, empresaId: obtenerEmpresaActiva() }, orderBy: { nombre: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.cliente.findFirst({ where: { id, deletedAt: null, empresaId: obtenerEmpresaActiva() } });
  },

  buscarPorNumeroDocumento(numeroDocumento: string) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.cliente.findFirst({ where: { numeroDocumento, empresaId, deletedAt: null } });
  },

  // Codigo legible por empresa (mismo patron que ComprasRepository.generarNumero) --
  // ver el comentario equivalente en SolicitudesRepository.generarNumero.
  async generarCodigo(): Promise<string> {
    const empresaId = obtenerEmpresaActiva();
    const total = await prisma.cliente.count({ where: { empresaId } });
    return `CLI-${String(total + 1).padStart(6, "0")}`;
  },

  async crear(data: CrearClienteInput) {
    const empresaId = obtenerEmpresaActiva();
    const codigo = await this.generarCodigo();
    return prisma.cliente.create({ data: { ...data, empresaId, codigo } });
  },

  // empresaId en el where es defensa en profundidad -- ver el comentario
  // equivalente en ProductosRepository.actualizar.
  actualizar(id: string, data: ActualizarClienteInput) {
    return prisma.cliente.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data });
  },

  softDelete(id: string) {
    return prisma.cliente.update({ where: { id, empresaId: obtenerEmpresaActiva() }, data: { deletedAt: new Date() } });
  },
};
