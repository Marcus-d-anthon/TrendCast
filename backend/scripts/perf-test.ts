import bcrypt from "bcrypt";
import autocannon, { type Result } from "autocannon";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.PERF_BASE_URL ?? "http://localhost:3000";
const EMPRESA_ID = process.env.PERF_EMPRESA_ID ?? "604dd485-f668-4f88-9a65-3bd6d23d91aa";
const PERF_EMAIL = "perf-test@tiansiecuador.com";
const PERF_PASSWORD = "PerfTest_2026x!";
const CONNECTIONS = 10;
// Cantidad fija de requests (no duracion abierta): el limitador general
// (RateLimitMiddleware.ts, limitadorGeneral) permite 600 req/15min por IP en
// desarrollo -- con 4 endpoints x 100 requests el total (400) se mantiene
// bien por debajo de ese techo y el benchmark no se distorsiona con 429s.
// El endpoint de login NO se incluye aqui: tiene su propio limitador mucho
// mas estricto (limitadorLogin, 10 req/15min) pensado para frenar fuerza
// bruta -- medir su "throughput" no tendria sentido, se prueba aparte como
// caso de seguridad (ver pruebas-rendimiento-seguridad-2026-08.md).
const REQUESTS_POR_ENDPOINT = 100;

interface Escenario {
  nombre: string;
  path: string;
}

async function crearUsuarioDePrueba(): Promise<void> {
  const passwordHash = await bcrypt.hash(PERF_PASSWORD, 12);
  await prisma.usuario.upsert({
    where: { email: PERF_EMAIL },
    update: { passwordHash, activo: true, deletedAt: null },
    create: { email: PERF_EMAIL, passwordHash, nombre: "Cuenta de pruebas de rendimiento", rol: "ADMIN", empresaId: EMPRESA_ID },
  });
}

// Soft delete, no hard delete: AuditLog.usuarioId apunta a este usuario con
// una FK real a nivel de base de datos (el login queda registrado), asi que
// borrarlo de verdad violaria esa FK -- mismo patron que UsuariosRepository.
async function borrarUsuarioDePrueba(): Promise<void> {
  await prisma.usuario.updateMany({ where: { email: PERF_EMAIL }, data: { activo: false, deletedAt: new Date() } });
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: PERF_EMAIL, password: PERF_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login fallo con status ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data: { token: string } };
  return json.data.token;
}

async function obtenerProductoIdDeMuestra(): Promise<string> {
  const producto = await prisma.producto.findFirstOrThrow({ where: { empresaId: EMPRESA_ID } });
  return producto.id;
}

function correr(url: string, token: string): Promise<Result> {
  return autocannon({
    url,
    connections: CONNECTIONS,
    amount: REQUESTS_POR_ENDPOINT,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// La libreria de histogramas que usa autocannon (hdr-histogram-percentiles-obj)
// no expone p95 exacto -- los percentiles fijos disponibles son p90, p97_5,
// p99, etc. Se reporta p97_5 como la aproximacion mas cercana a "p95" (queda
// documentado aqui y en el reporte para que no se lea como un error).
function formatearFila(nombre: string, r: Result): string {
  const rps = r.requests.average.toFixed(1);
  const p50 = r.latency.p50.toFixed(1);
  const p95Aprox = r.latency.p97_5.toFixed(1);
  const p99 = r.latency.p99.toFixed(1);
  const errores = r.errors + r.timeouts + r.non2xx;
  return `| ${nombre} | ${r.requests.sent} | ${rps} | ${p50} | ${p95Aprox} | ${p99} | ${errores} |`;
}

async function main() {
  console.log(`Preparando cuenta de pruebas (${PERF_EMAIL})...`);
  await crearUsuarioDePrueba();
  const token = await login();
  const productoId = await obtenerProductoIdDeMuestra();
  console.log(`Login OK. Producto de muestra: ${productoId}`);

  const escenarios: Escenario[] = [
    { nombre: "GET /productos (paginado)", path: "/api/productos?page=1&pageSize=20" },
    { nombre: "GET /movimientos (paginado)", path: "/api/movimientos?page=1&pageSize=20" },
    { nombre: "GET /reportes/existencias", path: "/api/reportes/existencias" },
    { nombre: "GET /prediccion/:productoId", path: `/api/prediccion/${productoId}` },
  ];

  const filas: string[] = [];
  for (const escenario of escenarios) {
    console.log(`\nCorriendo: ${escenario.nombre} (${CONNECTIONS} conexiones, ${REQUESTS_POR_ENDPOINT} requests)...`);
    const resultado = await correr(`${BASE_URL}${escenario.path}`, token);
    filas.push(formatearFila(escenario.nombre, resultado));
    console.log(
      `  ${resultado.requests.average.toFixed(1)} req/s | p50=${resultado.latency.p50}ms p97.5=${resultado.latency.p97_5}ms p99=${resultado.latency.p99}ms | errores=${resultado.errors + resultado.timeouts + resultado.non2xx}`
    );
  }

  console.log("\n\n--- Tabla markdown (copiar al reporte) ---\n");
  console.log("| Endpoint | Requests enviados | Req/s promedio | p50 (ms) | p95≈p97.5 (ms) | p99 (ms) | Errores |");
  console.log("|---|---|---|---|---|---|---|");
  for (const fila of filas) console.log(fila);

  await borrarUsuarioDePrueba();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await borrarUsuarioDePrueba();
  await prisma.$disconnect();
  process.exit(1);
});
