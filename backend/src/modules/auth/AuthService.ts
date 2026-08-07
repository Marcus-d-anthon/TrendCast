import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../lib/errors";
import { firmarToken } from "../../lib/jwt";
import { obtenerCodigosPermisoDeRol } from "../../lib/permisos-matriz";
import { calcularExpiracionRefreshToken, generarRefreshToken, hashRefreshToken } from "../../lib/refresh-token";
import { usuariosRepository } from "../usuarios/UsuariosRepository";
import { authRepository } from "./AuthRepository";
import type { LoginInput } from "./AuthValidators";

async function emitirTokens(usuarioId: string, rol: string) {
  const token = firmarToken({ sub: usuarioId, rol });

  const refreshToken = generarRefreshToken();
  await authRepository.crearRefreshToken(usuarioId, hashRefreshToken(refreshToken), calcularExpiracionRefreshToken());

  return { token, refreshToken };
}

export const authService = {
  async login(input: LoginInput) {
    const usuario = await usuariosRepository.buscarPorEmail(input.email);

    // Mensaje generico en ambos casos (usuario inexistente o password
    // incorrecta) para no revelar si un email esta registrado.
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    const { token, refreshToken } = await emitirTokens(usuario.id, usuario.rol);
    const permisos = await obtenerCodigosPermisoDeRol(usuario.rol);

    return {
      token,
      refreshToken,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, permisos },
    };
  },

  // Rotacion: el refresh token usado se revoca y se emite uno nuevo, tanto
  // en el camino feliz como al detectar reuso -- un refresh token ya
  // revocado que vuelve a presentarse es indicio de robo (el poseedor
  // legitimo ya rompio la cadena al pedir el siguiente), por eso se rechaza
  // sin excepciones en vez de reintentar validarlo de otra forma.
  async refrescar(refreshTokenRecibido: string) {
    const hash = hashRefreshToken(refreshTokenRecibido);
    const registro = await authRepository.buscarRefreshTokenPorHash(hash);

    if (!registro || registro.revokedAt || registro.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token invalido o expirado");
    }

    const usuario = await usuariosRepository.buscarPorId(registro.usuarioId);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError("Usuario no valido");
    }

    await authRepository.revocarRefreshToken(registro.id);
    const { token, refreshToken } = await emitirTokens(usuario.id, usuario.rol);
    const permisos = await obtenerCodigosPermisoDeRol(usuario.rol);

    return {
      token,
      refreshToken,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, permisos },
    };
  },
};
