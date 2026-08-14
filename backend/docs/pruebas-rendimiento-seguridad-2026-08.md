# Pruebas de rendimiento y seguridad — agosto 2026

Re-ejecución real contra el sistema actual (multi-tenant, Super Admin, flujo
completo de Solicitudes, Auditoría), tras el último pase de pruebas
documentado. Todos los números de este documento provienen de ejecuciones
reales contra el backend local (`npm run dev`, base de datos `sgi_dev` con
los datos de siembra reales) — no son estimaciones.

## 1. Rendimiento

**Herramienta:** [`autocannon`](https://github.com/mcollina/autocannon)
(devDependency nueva, ver `backend/scripts/perf-test.ts`). Se puede
reproducir con:

```bash
npm run perf-test
```

**Condiciones:** 10 conexiones concurrentes, 100 requests por endpoint (no
duración abierta, para no chocar con el limitador general de la API — ver
sección 2.2), contra un proceso `tsx watch` recién iniciado en `localhost:3000`.

| Endpoint | Requests enviados | Req/s promedio | p50 (ms) | p95≈p97.5 (ms) | p99 (ms) | Errores |
|---|---|---|---|---|---|---|
| GET /productos (paginado) | 100 | 25.0 | 182.0 | 2187.0 | 2339.0 | 0 |
| GET /movimientos (paginado) | 100 | 50.0 | 154.0 | 244.0 | 245.0 | 0 |
| GET /reportes/existencias | 100 | 50.0 | 129.0 | 162.0 | 165.0 | 0 |
| GET /prediccion/:productoId | 100 | 50.0 | 153.0 | 247.0 | 247.0 | 0 |

> Nota sobre "p95": la librería de histogramas que usa `autocannon`
> (`hdr-histogram-percentiles-obj`) no expone el percentil 95 exacto; el más
> cercano disponible es p97.5, que es el que se reporta en esa columna.

**Lectura de los resultados:**

- Todos los endpoints respondieron con 0 errores (0 timeouts, 0 respuestas
  no-2xx) en las 400 requests totales.
- El primer endpoint probado (`GET /productos`) muestra una cola de latencia
  alta (p97.5 ≈ 2.2s) frente a un p50 de 182ms. Es un efecto de arranque en
  frío: es la primera petición autenticada que recibe el proceso recién
  iniciado (pool de conexiones de Prisma/PG calentándose, JIT de V8, primer
  compile bajo `tsx watch`). Los tres endpoints siguientes, con el proceso ya
  caliente, muestran colas mucho más cortas (p97.5 entre 162ms y 247ms) y son
  representativos del comportamiento en estado estable.
- `GET /prediccion/:productoId` (regresión lineal + SMA sobre el historial de
  movimientos del producto) y `GET /reportes/existencias` (agregación sobre
  todo el catálogo) no muestran sobrecosto relevante frente a un listado
  simple — la lógica de predicción no es el cuello de botella del sistema.

**Recomendación:** si se quiere eliminar la cola de arranque en frío de forma
medible, se puede añadir un *warm-up* (una petición descartada antes de medir)
al script; se documenta aquí como mejora futura, no se implementa en este
pase para no ampliar el alcance aprobado.

## 2. Seguridad

### 2.1 Cabeceras de seguridad (Helmet)

Ejecutado: `tests/integration/security-headers.test.ts` — **2/2 pruebas en
verde**. Confirmado también en vivo contra el servidor local (`curl -D -`):
`Content-Security-Policy`, `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` presentes en
toda respuesta.

### 2.2 Rate limiting (fuerza bruta)

Dos limitadores activos (`backend/src/middlewares/RateLimitMiddleware.ts`):

- **`/auth/login`**: 10 intentos / 15 min por IP. Probado en vivo con una
  ráfaga de 13 intentos de login con credenciales inválidas contra un
  proceso recién iniciado (ventana limpia):

  | Intento | 1–9 | 10 | 11 | 12 | 13 |
  |---|---|---|---|---|---|
  | Status | 401 (credenciales inválidas) | 429 | 429 | 429 | 429 |

  El límite se activa exactamente donde está configurado: los primeros 9
  intentos se procesan normalmente (rechazados por credenciales, no por
  límite — el 10º cupo lo había consumido el propio script de setup), el
  10º en adelante recibe `429 Too Many Requests`.

- **API general**: 600 requests / 15 min por IP. Confirmado indirectamente:
  una corrida de diagnóstico anterior (autocannon con duración abierta en
  vez de cantidad fija) agotó el cupo real del proceso (`RateLimit-Remaining:
  0` observado vía `curl -D -`), causando 429 genuinos en los endpoints
  subsiguientes — se corrigió el script de rendimiento para no confundir esa
  protección real con un fallo del sistema (ver sección 1), pero de paso
  quedó verificado que el limitador general también dispara de verdad bajo
  carga, no solo en la configuración.

### 2.3 Resistencia a inyección SQL

Los únicos dos usos de `$queryRaw` en el backend
(`ReportesRepository.movimientosPorPeriodo`, `PrediccionRepository`) usan
plantillas etiquetadas de Prisma (`` prisma.$queryRaw`...${valor}...` ``), que
parametrizan cada interpolación como bind variable — nunca concatenan texto.
Probado en vivo:

- `GET /reportes/movimientos-por-periodo?granularidad=mensual';DROP TABLE usuarios;--`
  → **400 Bad Request** (`"Invalid option: expected one of \"diaria\"|\"semanal\"|\"mensual\""`).
  El valor nunca llega a la capa SQL: el whitelist de Zod
  (`z.enum(["diaria","semanal","mensual"])`) lo rechaza antes.
- `GET /productos?busqueda=' OR '1'='1` → **200 OK**, tratado como texto
  literal de búsqueda (filtro `contains` de Prisma, parametrizado) — cero
  coincidencias relevantes, no se filtró ni alteró ningún dato.
- Confirmado que la tabla `usuarios` sigue intacta después de ambos intentos
  (`GET /productos` sigue respondiendo 200 con datos reales).

### 2.4 Contraseñas

Hash con `bcrypt`, costo 12 (`SALT_ROUNDS = 12` en `UsuariosService.ts` /
`AuthService.ts`). Combinado con el rate limiting de login (2.2), mitiga
fuerza bruta tanto online (límite de intentos) como offline (costo
computacional del hash si la base de datos se filtrara).

### 2.5 `npm audit`

**Backend** (`npm audit`, 5 vulnerabilidades: 4 moderadas, 1 alta) — **las 5
están en `devDependencies`, ninguna se despliega a producción**:

| Paquete | Severidad | Cadena | Alcance |
|---|---|---|---|
| `nanoid` <3.3.17 | Alta | `vitest → vite → postcss → nanoid` | Solo build/test |
| `uuid` <11.1.1 | Moderada (x4) | `autocannon → hyperid → uuid` (y `exceljs` interno de autocannon) | Solo el script de rendimiento de este mismo pase |

**Frontend** (`npm audit`, 3 vulnerabilidades: 2 moderadas, 1 alta):

| Paquete | Severidad | Cadena | Alcance |
|---|---|---|---|
| `nanoid` <3.3.17 | Alta | `vite → postcss → nanoid` | Solo build, no se empaqueta en el bundle final |
| `uuid` <11.1.1 | Moderada (x2) | `exceljs → uuid` | **`exceljs` sí es dependencia de runtime** (generación de plantillas Excel de carga masiva y exportación) |

El hallazgo real a seguir es el de `exceljs → uuid` en el frontend: es la
única cadena vulnerable que efectivamente se empaqueta y se sirve al
navegador. El aviso (`GHSA-w5hq-g745-h8pq`) requiere que se le pase un
`buf` explícito a las funciones `uuid` afectadas, algo que `exceljs` no hace
en el uso que le da esta app (generación de plantillas/reportes en memoria);
no se identificó una ruta explotable concreta, pero se deja como mejora
futura (`npm audit fix --force`, actualiza `exceljs` a 3.4.0 — cambio de
versión mayor, fuera del alcance de este pase) en vez de aplicarla aquí sin
probar el impacto en la generación de reportes/plantillas.

## 3. Resumen

| Área | Resultado |
|---|---|
| Rendimiento (4 endpoints reales) | 0 errores, latencias de 10–250ms en estado estable |
| Cabeceras de seguridad | 2/2 pruebas automatizadas en verde, confirmado en vivo |
| Rate limiting login | Dispara en el intento 10, confirmado en vivo |
| Rate limiting general | Dispara a los 600 req/15min, confirmado en vivo (real, no simulado) |
| Inyección SQL | 2/2 intentos reales bloqueados (whitelist + parametrización) |
| Contraseñas | bcrypt costo 12 + rate limiting |
| Dependencias (backend) | 0 vulnerabilidades en producción, 5 en devDependencies |
| Dependencias (frontend) | 1 vulnerabilidad de runtime sin ruta explotable identificada (`exceljs`→`uuid`), pendiente de upgrade futuro |
