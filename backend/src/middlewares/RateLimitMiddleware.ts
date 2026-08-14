import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// En pruebas de integracion, decenas de tests inician sesion contra el
// mismo proceso/IP -- un limite pensado para uso real bloquearia la propia
// suite. Se mantiene el limitador activo (para poder probarlo puntualmente
// con un test dedicado) pero con un techo alto en NODE_ENV=test.
const esEntornoDePruebas = env.NODE_ENV === "test";

const mensajeDemasiadosIntentos = { error: { message: "Demasiados intentos. Intenta de nuevo en unos minutos." } };

// Limite estricto para login: mitiga fuerza bruta de credenciales de forma
// activa (antes solo se dependia del costo de bcrypt, ~500ms por intento,
// para desalentar intentos repetidos -- ver docs/tesis/06 hallazgo
// pendiente). 10 intentos cada 15 minutos por IP en produccion/desarrollo.
export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensajeDemasiadosIntentos,
});

// /auth/refresh no es un vector de adivinar credenciales (exige poseer ya un
// refresh token valido) y se dispara solo, en segundo plano, cada vez que el
// usuario extiende su sesion -- compartir el balde estricto de login con este
// endpoint agotaba el limite con uso normal. Techo mas alto, pero no
// ilimitado (sigue siendo parte de la superficie de auth).
export const limitadorRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 100000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensajeDemasiadosIntentos,
});

// Verificar un codigo TOTP/de recuperacion si es un vector real de adivinar
// (6 digitos), asi que mantiene un balde estricto y dedicado -- separado del
// login para que intentos de 2FA no agoten (ni sean agotados por) los
// intentos de password.
export const limitador2faVerificar = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensajeDemasiadosIntentos,
});

// Configurar (generar QR) y desactivar 2FA no son vectores de adivinar --
// configurar solo genera un secreto nuevo para una sesion ya autenticada, y
// desactivar ya exige volver a escribir la contrasena. Un usuario activando
// 2FA por primera vez puede necesitar reintentar el escaneo del QR varias
// veces sin toparse con el mismo limite pensado para fuerza bruta.
export const limitador2faConfigurar = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensajeDemasiadosIntentos,
});

// Limite general para el resto de la API: mas permisivo, solo para
// contener abuso/loops accidentales, no pensado como control anti-fuerza-bruta.
export const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 100000 : 600,
  standardHeaders: true,
  legacyHeaders: false,
});
