import bcrypt from "bcrypt";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { usuariosRepository } from "./UsuariosRepository";
import type { ActualizarUsuarioInput, CrearUsuarioInput } from "./UsuariosValidators";

const SALT_ROUNDS = 12;

// Nunca deben viajar al cliente: el hash de password ni el secreto TOTP
// crudo (aunque este ultimo nunca se selecciona intencionalmente en ningun
// endpoint de usuarios, es una segunda barrera si algun query cambia).
function sinCamposSensibles<T extends { passwordHash: string; totpSecret?: string | null }>(
  usuario: T
): Omit<T, "passwordHash" | "totpSecret"> {
  const { passwordHash: _passwordHash, totpSecret: _totpSecret, ...resto } = usuario;
  return resto;
}

export const usuariosService = {
  async listar() {
    const usuarios = await usuariosRepository.listar();
    return usuarios.map(sinCamposSensibles);
  },

  async crear(input: CrearUsuarioInput) {
    const existente = await usuariosRepository.buscarPorEmailIncluyendoEliminados(input.email);
    if (existente?.deletedAt) {
      throw new ConflictError(
        "Ese correo perteneció a una cuenta eliminada y no se puede reutilizar. Usa un correo distinto."
      );
    }
    if (existente) {
      throw new ConflictError("Ya existe un usuario registrado con ese email");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const usuario = await usuariosRepository.crear({
      email: input.email,
      passwordHash,
      nombre: input.nombre,
      rol: input.rol,
      almacenId: input.almacenId,
    });

    return sinCamposSensibles(usuario);
  },

  async actualizar(id: string, input: ActualizarUsuarioInput) {
    const usuario = await usuariosRepository.buscarPorIdEnEmpresaActiva(id);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado");
    }
    // SUPERUSUARIO es un rol sensible asignado a mano (ver
    // UsuariosValidators.ts): ni siquiera otro SUPERUSUARIO puede editarlo
    // desde esta pantalla, evita bloqueos o degradaciones accidentales de la
    // unica cuenta con visibilidad cross-empresa.
    if (usuario.rol === "SUPERUSUARIO") {
      throw new ForbiddenError("La cuenta de Super Admin no se puede editar desde esta pantalla");
    }

    const rolEfectivo = input.rol ?? usuario.rol;
    const almacenIdEfectivo = input.almacenId !== undefined ? input.almacenId : usuario.almacenId;

    if (rolEfectivo === "BODEGA" && !almacenIdEfectivo) {
      throw new ConflictError("Un usuario con rol Bodega debe tener un almacén asignado");
    }

    const actualizado = await usuariosRepository.actualizar(id, {
      nombre: input.nombre,
      rol: input.rol,
      // Si el rol efectivo deja de ser Bodega, el almacen no aplica -- se
      // limpia en vez de dejar un valor huerfano que ya no significa nada.
      almacenId: rolEfectivo === "BODEGA" ? almacenIdEfectivo : null,
      activo: input.activo,
    });

    return sinCamposSensibles(actualizado);
  },

  async eliminar(id: string) {
    const usuario = await usuariosRepository.buscarPorIdEnEmpresaActiva(id);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado");
    }
    if (usuario.rol === "SUPERUSUARIO") {
      throw new ForbiddenError("La cuenta de Super Admin no se puede eliminar desde esta pantalla");
    }

    await usuariosRepository.desactivar(id);
  },
};
