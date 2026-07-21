import dotenv from "dotenv";
import { z } from "zod";

// En pruebas (NODE_ENV=test, fijado por vitest.config.ts) se carga .env.test
// para apuntar a una base de datos separada (sgi_test), nunca a la de
// desarrollo. tests/helpers/test-db.ts vuelve a verificar esto antes de
// truncar tablas, como segunda barrera de seguridad.
dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatorio"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),
  // Vida corta a proposito: la sesion prolongada la sostiene el refresh
  // token (opaco, revocable, ver src/lib/refresh-token.ts), no el JWT.
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DIAS: z.coerce.number().int().positive().default(7),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detalle = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`Variables de entorno invalidas:\n${detalle}`);
  process.exit(1);
}

export const env = parsed.data;
