import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger";
import { openApiDocument } from "./docs/openapi";
import { errorHandlerMiddleware } from "./middlewares/ErrorHandlerMiddleware";
import { limitadorGeneral } from "./middlewares/RateLimitMiddleware";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  // helmet: cabeceras de seguridad estandar (oculta X-Powered-By, agrega
  // X-Content-Type-Options, X-Frame-Options, CSP basica, etc. -- hallazgo
  // pendiente documentado en docs/tesis/06, ahora resuelto).
  app.use(helmet());
  // cors: antes no habia restriccion de origen configurada (el frontend
  // llegaba via proxy de Vite en desarrollo); se habilita explicitamente
  // para permitir despliegues donde frontend y backend viven en dominios
  // distintos.
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use("/api", limitadorGeneral, apiRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
    });
  });

  app.use(errorHandlerMiddleware);

  return app;
}
