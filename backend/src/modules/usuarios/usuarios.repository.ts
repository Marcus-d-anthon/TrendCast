import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { RolUsuario } from "../../generated/prisma/enums";

export interface CrearUsuarioData {
  email: string;
  passwordHash: string;
  nombre: string;
  rol: RolUsuario;
}

export const usuariosRepository = {
  listar() {
    return prisma.usuario.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  },

  buscarPorEmail(email: string) {
    return prisma.usuario.findFirst({ where: { email, deletedAt: null } });
  },

  buscarPorId(id: string) {
    return prisma.usuario.findFirst({ where: { id, deletedAt: null } });
  },

  async crear(data: CrearUsuarioData) {
    const empresaId = await obtenerEmpresaId();
    return prisma.usuario.create({ data: { ...data, empresaId } });
  },
};
