import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { generarCodigosRecuperacion, hashCodigoRecuperacion } from "../../lib/codigos-recuperacion";
import { ConflictError, UnauthorizedError, ValidationError } from "../../lib/errors";
import { firmarToken } from "../../lib/jwt";
import { obtenerCodigosPermisoDeRol } from "../../lib/permisos-matriz";
import { calcularExpiracionRefreshToken, generarRefreshToken, hashRefreshToken } from "../../lib/refresh-token";
import { usuariosRepository } from "../usuarios/UsuariosRepository";
import { authRepository } from "./AuthRepository";
import type { LoginInput } from "./AuthValidators";

const NOMBRE_EMISOR_TOTP = "TrendCast";
authenticator.options = { window: 1 };

async function emitirTokens(usuarioId: string, rol: string) {
  const token = firmarToken({ sub: usuarioId, rol });

  const refreshToken = generarRefreshToken();
  await authRepository.crearRefreshToken(usuarioId, hashRefreshToken(refreshToken), calcularExpiracionRefreshToken());

  return { token, refreshToken };
}

async function verificarCodigo2fa(usuarioId: string, secret: string | null, codigo: string): Promise<boolean> {
  if (secret && authenticator.check(codigo, secret)) {
    return true;
  }
  const hash = hashCodigoRecuperacion(codigo);
  const registro = await authRepository.buscarCodigoRecuperacionNoUsado(usuarioId, hash);
  if (!registro) {
    return false;
  }
  await authRepository.marcarCodigoRecuperacionUsado(registro.id);
  return true;
}

export const authService = {
  async login(input: LoginInput, contexto: { ip: string | null; userAgent: string | null }) {
    const usuario = await usuariosRepository.buscarPorEmail(input.email);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    if (usuario.totpHabilitado) {
      if (!input.codigoTotp) {
        return { requiere2fa: true } as const;
      }
      const codigoValido = await verificarCodigo2fa(usuario.id, usuario.totpSecret, input.codigoTotp);
      if (!codigoValido) {
        throw new UnauthorizedError("Codigo de verificacion invalido");
      }
    }

    const { token, refreshToken } = await emitirTokens(usuario.id, usuario.rol);
    const permisos = await obtenerCodigosPermisoDeRol(usuario.rol);

    await authRepository.registrarAcceso(usuario.id, usuario.rol, contexto.ip, contexto.userAgent).catch(() => undefined);

    return {
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        permisos,
        almacenId: usuario.almacenId,
        empresaId: usuario.empresaId,
        totpHabilitado: usuario.totpHabilitado,
      },
    };
  },

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
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        permisos,
        almacenId: usuario.almacenId,
        empresaId: usuario.empresaId,
        totpHabilitado: usuario.totpHabilitado,
      },
    };
  },

  async configurar2fa(usuarioId: string) {
    const usuario = await usuariosRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UnauthorizedError("Usuario no valido");
    }
    if (usuario.totpHabilitado) {
      throw new ConflictError("La verificacion en dos pasos ya esta activada para esta cuenta");
    }

    const secret = authenticator.generateSecret();
    await authRepository.guardarSecretoTotpPendiente(usuarioId, secret);

    const otpauthUrl = authenticator.keyuri(usuario.email, NOMBRE_EMISOR_TOTP, secret);
    const qr = await QRCode.toDataURL(otpauthUrl);
    return { qr, secret };
  },

  async verificar2fa(usuarioId: string, codigo: string) {
    const usuario = await usuariosRepository.buscarPorId(usuarioId);
    if (!usuario?.totpSecret) {
      throw new ConflictError("Primero debes generar un codigo QR desde /auth/2fa/configurar");
    }
    if (!authenticator.check(codigo, usuario.totpSecret)) {
      // 400, no 401: la sesion (el token) es perfectamente valida, lo que
      // fallo fue el valor del codigo enviado. Usar 401 aqui hacia que el
      // interceptor global del frontend lo confundiera con una sesion
      // expirada y desloguera al usuario en medio de la activacion de 2FA.
      throw new ValidationError("Codigo de verificacion invalido");
    }

    await authRepository.habilitarTotp(usuarioId);

    const codigosEnClaro = generarCodigosRecuperacion();
    await authRepository.crearCodigosRecuperacion(usuarioId, codigosEnClaro.map(hashCodigoRecuperacion));

    return { codigosRecuperacion: codigosEnClaro };
  },

  async desactivar2fa(usuarioId: string, password: string) {
    const usuario = await usuariosRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UnauthorizedError("Usuario no valido");
    }
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      // Mismo motivo que en verificar2fa: la sesion sigue siendo valida.
      throw new ValidationError("Contrasena incorrecta");
    }
    await authRepository.desactivarTotp(usuarioId);
  },
};
