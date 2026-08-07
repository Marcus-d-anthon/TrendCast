// tsc no copia archivos no-TS (imagenes, etc): este paso posterior al build
// copia src/assets a dist/assets manteniendo la misma ruta relativa que en
// desarrollo (donde tsx corre directo sobre src/, sin este paso).
import { cpSync, existsSync, mkdirSync } from "node:fs";

if (existsSync("src/assets")) {
  mkdirSync("dist/assets", { recursive: true });
  cpSync("src/assets", "dist/assets", { recursive: true });
  console.log("Assets copiados a dist/assets");
}
