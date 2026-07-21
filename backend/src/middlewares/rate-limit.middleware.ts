import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// En pruebas de integracion, decenas de tests inician sesion contra el
// mismo proceso/IP -- un limite pensado para uso real bloquearia la propia
// suite. Se mantiene el limitador activo (para poder probarlo puntualmente
// con un test dedicado) pero con un techo alto en NODE_ENV=test.
const esEntornoDePruebas = env.NODE_ENV === "test";

// Limite estricto para login/refresh: mitiga fuerza bruta de credenciales de
// forma activa (antes solo se dependia del costo de bcrypt, ~500ms por
// intento, para desalentar intentos repetidos -- ver docs/tesis/06 hallazgo
// pendiente). 10 intentos cada 15 minutos por IP en produccion/desarrollo.
export const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Demasiados intentos. Intenta de nuevo en unos minutos." } },
});

// Limite general para el resto de la API: mas permisivo, solo para
// contener abuso/loops accidentales, no pensado como control anti-fuerza-bruta.
export const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esEntornoDePruebas ? 100000 : 600,
  standardHeaders: true,
  legacyHeaders: false,
});
