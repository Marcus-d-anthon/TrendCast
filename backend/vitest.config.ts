import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { NODE_ENV: "test" },
    // Los tests de integracion comparten una sola base de datos fisica
    // (sgi_test) y cada suite hace TRUNCATE en beforeEach; correr archivos en
    // paralelo produce condiciones de carrera entre ellos (un TRUNCATE de un
    // archivo borra filas que otro archivo esta usando a mitad de una
    // prueba). fileParallelism:false por si solo no fue suficiente para
    // forzar un unico proceso/worker real -- se fuerza explicitamente con
    // pool "forks" + singleFork.
    fileParallelism: false,
    pool: "forks",
    singleFork: true,
  },
});
