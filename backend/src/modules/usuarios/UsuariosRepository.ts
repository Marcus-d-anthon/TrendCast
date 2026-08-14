import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";
import type { RolUsuario } from "../../generated/prisma/enums";

export interface CrearUsuarioData {
  email: string;
  passwordHash: string;
  nombre: string;
  rol: RolUsuario;
  almacenId?: string;
}

export interface ActualizarUsuarioData {
  nombre?: string;
  rol?: RolUsuario;
  almacenId?: string | null;
  activo?: boolean;
}

export const usuariosRepository = {
  // Escopado por empresa activa (defensa en profundidad, mismo patron que
  // el resto de repositorios -- ver Productos/Clientes/etc): sin este
  // filtro, un ADMIN de una empresa veia (y el selector de Super Admin
  // ignoraba) las cuentas de TODAS las empresas. El SUPERUSUARIO se excluye
  // -- no "pertenece" a ninguna empresa de negocio, no tiene sentido que
  // aparezca en el padron de usuarios de una.
  listar() {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.findMany({
      where: { deletedAt: null, empresaId, rol: { not: "SUPERUSUARIO" } },
      orderBy: { nombre: "asc" },
    });
  },

  buscarPorEmail(email: string) {
    return prisma.usuario.findFirst({ where: { email, deletedAt: null } });
  },

  // Sin filtrar por deletedAt: el email tiene UNIQUE a nivel de base de
  // datos (no solo entre cuentas activas), asi que una fila dada de baja
  // logica sigue bloqueando ese correo para un usuario nuevo. Se usa antes
  // de crear, para devolver un 409 claro en vez de dejar que el INSERT
  // choque contra la restriccion unica y explote como 500.
  buscarPorEmailIncluyendoEliminados(email: string) {
    return prisma.usuario.findFirst({ where: { email } });
  },

  // Sin escopar por empresa: lo usan AuthMiddleware/AuthService para que un
  // usuario se vuelva a consultar a si mismo (por su propio id, sacado del
  // JWT) -- ahi la empresa activa todavia no esta resuelta, o ni aplica.
  buscarPorId(id: string) {
    return prisma.usuario.findFirst({ where: { id, deletedAt: null } });
  },

  // Version escopada, para cuando un ADMIN/SUPERUSUARIO gestiona la cuenta
  // de OTRO usuario (editar/eliminar desde UsuariosService) -- evita que se
  // pueda tocar por id una cuenta de una empresa distinta a la activa.
  buscarPorIdEnEmpresaActiva(id: string) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.findFirst({ where: { id, empresaId, deletedAt: null } });
  },

  async crear(data: CrearUsuarioData) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.create({ data: { ...data, empresaId } });
  },

  actualizar(id: string, data: ActualizarUsuarioData) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.update({ where: { id, empresaId }, data });
  },

  // Soft delete: un DELETE fisico falla contra la FK de audit_log.usuario_id
  // (no representada en las relaciones de Prisma, ver AuditExtension.ts) en
  // cuanto el usuario ya tiene un LOGIN registrado -- mismo patron que
  // Producto/Categoria en el resto del sistema.
  desactivar(id: string) {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.update({ where: { id, empresaId }, data: { activo: false, deletedAt: new Date() } });
  },
};
