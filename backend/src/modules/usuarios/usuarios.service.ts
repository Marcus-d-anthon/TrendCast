import bcrypt from "bcrypt";
import { ConflictError } from "../../lib/errors";
import { usuariosRepository } from "./usuarios.repository";
import type { CrearUsuarioInput } from "./usuarios.validators";

const SALT_ROUNDS = 12;

function sinPasswordHash<T extends { passwordHash: string }>(usuario: T): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...resto } = usuario;
  return resto;
}

export const usuariosService = {
  async listar() {
    const usuarios = await usuariosRepository.listar();
    return usuarios.map(sinPasswordHash);
  },

  async crear(input: CrearUsuarioInput) {
    const existente = await usuariosRepository.buscarPorEmail(input.email);
    if (existente) {
      throw new ConflictError("Ya existe un usuario registrado con ese email");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const usuario = await usuariosRepository.crear({
      email: input.email,
      passwordHash,
      nombre: input.nombre,
      rol: input.rol,
    });

    return sinPasswordHash(usuario);
  },
};
