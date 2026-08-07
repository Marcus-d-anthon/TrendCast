import express from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";
import { describe, expect, it } from "vitest";

// Prueba el mecanismo de rate limiting en si mismo (no la instancia real de
// la app, que se relaja deliberadamente en NODE_ENV=test para no bloquear el
// resto de la suite -- ver src/middlewares/RateLimitMiddleware.ts).
function construirAppDePrueba(limit: number) {
  const app = express();
  app.use(rateLimit({ windowMs: 60_000, limit, standardHeaders: true, legacyHeaders: false }));
  app.get("/ping", (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe("Rate limiting", () => {
  it("permite peticiones hasta el limite configurado", async () => {
    const app = construirAppDePrueba(3);

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/ping");
      expect(res.status).toBe(200);
    }
  });

  it("bloquea con 429 al superar el limite configurado", async () => {
    const app = construirAppDePrueba(3);

    for (let i = 0; i < 3; i++) {
      await request(app).get("/ping");
    }

    const res = await request(app).get("/ping");
    expect(res.status).toBe(429);
  });
});
