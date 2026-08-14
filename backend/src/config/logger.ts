import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  // Red de seguridad (Sensitive Data Exposure): hoy nada de esto se loguea
  // realmente (pino-http solo registra metadata de req/res, no el body), pero
  // esto deja explicito que si algun dia se agrega logging de body no se
  // filtren credenciales por accidente.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.body.password",
      "req.body.passwordActual",
      "req.body.passwordNueva",
      "req.body.codigoTotp",
      "req.body.refreshToken",
    ],
    censor: "[REDACTADO]",
  },
});
