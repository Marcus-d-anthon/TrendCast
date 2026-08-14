import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { openApiDocument } from "./docs/openapi";
import { errorHandlerMiddleware } from "./middlewares/ErrorHandlerMiddleware";
import { limitadorGeneral } from "./middlewares/RateLimitMiddleware";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  // helmet: cabeceras de seguridad estandar (oculta X-Powered-By, agrega
  // X-Content-Type-Options, X-Frame-Options, etc). CSP y HSTS explicitos en
  // vez de los defaults de Helmet -- el frontend no carga nada externo (sin
  // Google Fonts/CDN, ver @fontsource/* en package.json), asi que un CSP
  // estricto ('self' + data: para el QR de 2FA y el logo del backend) no
  // rompe nada y deja documentado el endurecimiento contra XSS. HSTS aplica
  // de verdad cuando el despliegue real sirve por HTTPS (un proxy/hosting
  // hace la terminacion TLS); declararlo aqui dejaria la intencion explicita
  // aunque en desarrollo local no tenga efecto (solo se envia sobre HTTPS).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
    })
  );
  // cors: antes no habia restriccion de origen configurada (cors() sin
  // opciones reflejaba cualquier origen que pidiera la request). Ahora solo
  // el origen real del frontend puede llamar a la API.
  app.use(cors({ origin: env.FRONTEND_URL }));
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
