import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/build-app";

const app = buildTestApp();

describe("Cabeceras de seguridad HTTP (helmet + cors)", () => {
  it("oculta X-Powered-By y agrega cabeceras de helmet en /health", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
  });

  it("responde con cabeceras CORS a una peticion con Origin", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeDefined();
  });
});
