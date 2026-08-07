import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { imprimirBannerArranque } from "./lib/startup-banner";
import { prisma } from "./lib/prisma";

const app = createApp();

const server = app.listen(env.PORT, async () => {
  logger.info(`Servidor escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);

  let baseDeDatosConectada = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    baseDeDatosConectada = true;
  } catch (err) {
    logger.error({ err }, "No se pudo verificar la conexion a la base de datos");
  }

  if (env.NODE_ENV !== "test") {
    imprimirBannerArranque({
      version: "1.0.0",
      port: env.PORT,
      entorno: env.NODE_ENV,
      baseDeDatosConectada,
    });
  }
});

function shutdown(signal: string): void {
  logger.info(`Senal ${signal} recibida, cerrando servidor...`);
  server.close(() => {
    logger.info("Servidor cerrado correctamente");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
