import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../lib/errors";

// Middleware de manejo de errores centralizado. Debe registrarse al final de
// la cadena de middlewares (app.use(errorHandlerMiddleware)) para que Express
// lo reconozca como error handler (firma de 4 parametros).
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logger.warn({ err: err.issues, path: req.originalUrl }, "Error de validacion");
    res.status(400).json({
      error: {
        message: "Datos de entrada invalidos",
        details: err.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensaje: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    const nivel = err.statusCode >= 500 ? "error" : "warn";
    logger[nivel]({ err, path: req.originalUrl }, err.message);
    res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err, path: req.originalUrl }, "Error no controlado");
  res.status(500).json({
    error: { message: "Error interno del servidor" },
  });
}
