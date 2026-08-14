import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../lib/errors";
import { erroresService } from "../modules/errores/ErroresService";

// Persistencia del error 500 en la tabla error_log -- SIEMPRE fire-and-forget
// (catch silencioso): un fallo al guardar el registro de diagnostico nunca
// debe impedir ni retrasar la respuesta que el cliente ya recibio. Solo se
// llama para errores realmente "de sistema" (500+), nunca para 4xx
// esperados (validacion, permisos, conflictos de negocio) -- esos no son
// bugs, son el flujo normal de la API.
function registrarErrorLog(err: unknown, req: Request, statusCode: number, traceId: string): void {
  const categoria = err instanceof Error ? err.constructor.name : "UnknownError";
  const mensaje = err instanceof Error ? err.message : String(err);
  const stackTrace = err instanceof Error ? (err.stack ?? null) : null;

  erroresService
    .registrar({
      mensaje,
      ruta: req.originalUrl,
      metodo: req.method,
      statusCode,
      categoria,
      stackTrace,
      usuarioId: req.usuario?.id ?? null,
      empresaId: req.usuario?.empresaId ?? null,
      ip: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
      traceId,
    })
    .catch((errorAlGuardar) => logger.error({ err: errorAlGuardar }, "No se pudo persistir el ErrorLog"));
}

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
    if (err.statusCode >= 500) {
      registrarErrorLog(err, req, err.statusCode, randomUUID());
    }
    res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  const traceId = randomUUID();
  logger.error({ err, path: req.originalUrl, traceId }, "Error no controlado");
  registrarErrorLog(err, req, 500, traceId);
  res.status(500).json({
    error: { message: "Error interno del servidor" },
  });
}
