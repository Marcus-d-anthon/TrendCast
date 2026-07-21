# SGI — Sistema de Gestión de Inventarios con Análisis Predictivo

Backend del proyecto de titulación (carrera de Desarrollo de Software) para el caso de estudio
**TIANSHI ECUADOR S.A.** Expone una API REST para gestión de productos, movimientos de inventario,
alertas de stock mínimo, proyección de demanda y reportes, con **auditoría automática** e
**integridad de datos** como prioridad de diseño.

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Crear la base de datos](#crear-la-base-de-datos)
- [Migraciones](#migraciones)
- [Seed de datos de ejemplo](#seed-de-datos-de-ejemplo)
- [Levantar el servidor](#levantar-el-servidor)
- [Pruebas](#pruebas)
- [Documentación de la API](#documentación-de-la-api)
- [Modelo de datos (resumen)](#modelo-de-datos-resumen)
- [Decisiones de arquitectura](#decisiones-de-arquitectura)
- [Roles y permisos](#roles-y-permisos)
- [Estructura de carpetas](#estructura-de-carpetas)

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22 + TypeScript 7 |
| Framework HTTP | Express 5 |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma ORM 7 (generador `prisma-client`, sin motor Rust, con driver adapter `@prisma/adapter-pg`) |
| Autenticación | JWT (`jsonwebtoken`) + hashing de contraseñas con `bcrypt` |
| Validación | Zod 4 |
| Logging | pino |
| Pruebas | Vitest + Supertest |
| Documentación de API | OpenAPI 3.0 servido con `swagger-ui-express` en `/docs` |

## Requisitos previos

- Node.js 22 o superior
- PostgreSQL 16 (u otra versión compatible) corriendo localmente o accesible por red
- npm (viene con Node.js)

## Instalación

```bash
npm install
npm run prisma:generate
```

El segundo comando genera el cliente de Prisma en `src/generated/prisma/` a partir de `schema.prisma`.
Es un paso manual (Prisma no agrega un hook `postinstall` que lo dispare solo) y hay que repetirlo cada
vez que cambie `schema.prisma`.

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL: `postgresql://usuario:password@host:puerto/basededatos?schema=public` |
| `JWT_SECRET` | Secreto para firmar los JWT (mínimo 16 caracteres; usar un valor largo y aleatorio en producción) |
| `JWT_EXPIRES_IN` | Tiempo de expiración de los tokens (ej. `8h`) |
| `PORT` | Puerto del servidor Express |
| `NODE_ENV` | `development` \| `test` \| `production` |

Las variables se validan con Zod al arrancar (`src/config/env.ts`): si falta alguna o tiene un formato
inválido, el proceso termina inmediatamente con un mensaje explicativo (`process.exit(1)`), en vez de
fallar más adelante de forma confusa.

Para las pruebas automatizadas existe un archivo separado `.env.test` (ver sección [Pruebas](#pruebas)).

## Crear la base de datos

Con PostgreSQL corriendo, crear un rol de aplicación y la base de datos (ejemplo usando `psql` como
superusuario `postgres`):

```sql
CREATE ROLE sgi_app WITH LOGIN PASSWORD 'una_password_segura';
ALTER ROLE sgi_app CREATEDB; -- necesario para que Prisma pueda crear su base de datos "shadow" al migrar
CREATE DATABASE sgi_dev OWNER sgi_app;
```

Actualizar `DATABASE_URL` en `.env` con esas credenciales, por ejemplo:

```
DATABASE_URL="postgresql://sgi_app:una_password_segura@localhost:5432/sgi_dev?schema=public"
```

> El permiso `CREATEDB` solo es necesario para `prisma migrate dev` en desarrollo (usa una base de datos
> temporal para calcular diffs). No es necesario para `prisma migrate deploy` en producción.

## Migraciones

```bash
npx prisma migrate dev
```

Esto aplica todas las migraciones versionadas en `prisma/migrations/`, incluyendo las sentencias
`CHECK` y las claves foráneas de auditoría agregadas a mano (ver
[Decisiones de arquitectura](#decisiones-de-arquitectura)).

Para entornos ya provisionados (CI/producción), usar en su lugar:

```bash
npx prisma migrate deploy
```

**Si se agrega una migración nueva que recree alguna de las tablas con `CHECK`**, hay que repetir a mano
el paso de agregar esas restricciones — ver `prisma/checks.sql` como referencia completa, y el comentario
al final del `migration.sql` inicial que explica el procedimiento (`migrate dev --create-only`, editar el
SQL generado, luego aplicar).

## Seed de datos de ejemplo

```bash
npx prisma db seed
```

Crea:

- 4 usuarios (uno por cada rol, más un segundo operador), todos con la contraseña `Seed12345!`:
  - `admin@tiansiecuador.com` (ADMIN)
  - `supervisor@tiansiecuador.com` (SUPERVISOR)
  - `operador1@tiansiecuador.com`, `operador2@tiansiecuador.com` (OPERADOR)
- 4 categorías y 15 productos realistas para una distribuidora de suplementos/cuidado personal
- Alrededor de 6 meses de historial de movimientos por producto, con patrones variados (tendencia
  creciente, decreciente o estable), para que el módulo predictivo tenga series con las que proyectar
- Un movimiento de tipo `AJUSTE` de ejemplo, referenciando a un movimiento anterior, para demostrar el
  mecanismo de corrección sin editar el libro

El script vive en `prisma/seed.ts` y es re-ejecutable sobre una base vacía (falla con conflicto de
`email`/`sku` si se corre dos veces sobre datos existentes, ya que no hace upsert — está pensado para
poblar una base de datos limpia).

## Levantar el servidor

```bash
npm run dev     # desarrollo, con recarga automática (tsx watch)
npm run build   # compila TypeScript a dist/
npm start       # corre el build compilado (requiere build previo)
```

Verificación rápida: `GET http://localhost:3000/health` debe responder `200 {"status":"ok",...}`.

## Pruebas

```bash
npm test        # corre toda la suite (unitarias + integración) una vez
npm run test:watch
```

Las pruebas de integración usan una **base de datos de pruebas separada** (nunca la de desarrollo), para
poder truncar tablas libremente entre tests sin riesgo. Configuración:

1. Crear la base de datos de pruebas (mismo rol `sgi_app`):
   ```sql
   CREATE DATABASE sgi_test OWNER sgi_app;
   ```
2. Crear `.env.test` (mismo formato que `.env`, pero apuntando a `sgi_test`).
3. Aplicar las migraciones ahí también:
   ```bash
   DATABASE_URL="postgresql://sgi_app:...@localhost:5432/sgi_test?schema=public" npx prisma migrate deploy
   ```

`vitest.config.ts` fija `NODE_ENV=test` para el proceso de pruebas, lo que hace que `src/config/env.ts`
cargue `.env.test` en lugar de `.env`. Como barrera adicional, `tests/helpers/test-db.ts` verifica en
tiempo de ejecución que `DATABASE_URL` contenga `sgi_test` antes de truncar cualquier tabla — si por error
apuntara a la base de desarrollo, lanza una excepción en vez de borrar datos.

Los archivos de test de integración corren **secuencialmente** (`fileParallelism: false` en
`vitest.config.ts`), porque todos comparten la misma base de datos física y hacen `TRUNCATE` entre cada
caso; correrlos en paralelo produce condiciones de carrera.

- `tests/unit/` — funciones puras (fórmulas del módulo predictivo), sin base de datos.
- `tests/integration/` — endpoints HTTP end-to-end contra PostgreSQL real (Supertest + Prisma).

## Documentación de la API

Con el servidor corriendo, la documentación interactiva (OpenAPI 3.0 + Swagger UI) está en:

```
http://localhost:3000/docs
```

El documento OpenAPI se define a mano en `src/docs/openapi.ts` (una única fuente de verdad, en vez de
comentarios JSDoc dispersos en cada archivo de rutas).

## Modelo de datos (resumen)

Seis tablas de negocio, todas con soft delete donde aplica (**nunca se borra nada físicamente**):

| Tabla | Propósito | Notas de auditoría |
|---|---|---|
| `usuarios` | Cuentas del sistema (ADMIN / SUPERVISOR / OPERADOR) | `created_at/updated_at/created_by/updated_by/deleted_at` |
| `categorias` | Categorías de producto | ídem |
| `productos` | Catálogo, con SKU único | ídem |
| `stock_actual` | Saldo actual por producto (1:1 con `productos`) | `created_at/updated_at/created_by/updated_by` (sin `deleted_at`: su ciclo de vida sigue al del producto) |
| `movimientos_inventario` | **Libro inmutable append-only** de ENTRADA/SALIDA/AJUSTE | Solo `created_at` + `fecha` (de negocio). Sin `updated_at/updated_by/deleted_at`: no aplican a una fila que nunca muta |
| `audit_log` | Bitácora genérica de toda mutación (INSERT/UPDATE/soft-delete) | `entidad`, `registro_id`, `accion`, `valor_anterior`/`valor_nuevo` (JSON), `usuario_id`, `fecha` |

Relaciones clave:

- `productos.categoria_id → categorias.id` (`ON DELETE RESTRICT`)
- `movimientos_inventario.producto_id → productos.id`, `.usuario_id → usuarios.id` (`ON DELETE RESTRICT`)
- `movimientos_inventario.movimiento_origen_id → movimientos_inventario.id` (auto-relación: un `AJUSTE`
  referencia al movimiento que corrige)
- `*.created_by` / `*.updated_by → usuarios.id`: columnas escalares con **FK real agregada a mano en la
  migración** (`ON DELETE RESTRICT`), sin relación Prisma navegable — ver justificación abajo.

Restricciones de integridad a nivel de base de datos (no solo en la aplicación):

- `UNIQUE` en `usuarios.email`, `categorias.nombre`, `productos.sku`
- `CHECK (stock_minimo >= 0)`, `CHECK (precio_unitario >= 0)`, `CHECK (cantidad de stock_actual >= 0)`,
  `CHECK (cantidad de movimiento > 0)`, `CHECK (saldo_resultante >= 0)`
- Todas las FKs de negocio con `ON DELETE RESTRICT`: incluso un `DELETE` físico directo en la base de
  datos (fuera de la aplicación) sería rechazado si existen registros dependientes — defensa en
  profundidad junto con el soft delete a nivel de aplicación.

## Decisiones de arquitectura

Documentadas aquí para poder defenderlas ante el tribunal; el detalle completo del diseño original está
en el historial de planificación del proyecto.

**1. Capas por módulo (vertical slice), no capas horizontales globales.** Cada módulo de negocio
(`src/modules/<modulo>/`) contiene su propio `routes → controller → service → repository → validators`.
Se prefirió sobre Clean/Hexagonal completa (puertos, adaptadores, contenedor DI) por ser sobre-ingeniería
para el alcance de una tesis técnica: el patrón en capas por módulo ya demuestra separación de
responsabilidades y bajo acoplamiento de forma más simple y estándar en el ecosistema Express.

**2. `created_by`/`updated_by` como columnas escalares, no relaciones Prisma.** Si se modelaran como
relaciones completas, cada tabla necesitaría 2 relaciones nombradas hacia `Usuario` (creador/editor), y
`Usuario` terminaría con más de 10 campos de relación inversa solo para volver navegable el árbol de
auditoría — ruido que casi no se usa (cuando se necesita el nombre del creador, el Service hace una
consulta explícita). La integridad referencial se mantiene igual: la FK existe realmente en PostgreSQL,
agregada a mano en la migración porque Prisma no permite declarar una FK sin una relación asociada en el
schema.

**3. `movimientos_inventario` es append-only por diseño, no solo por convención.** El Service nunca
invoca `update`/`delete` sobre este modelo, y una **Prisma Client Extension**
(`src/extensions/immutable-ledger.extension.ts`) bloquea esas operaciones explícitamente aunque alguien
las invoque por error — defensa en profundidad. Las correcciones se registran como una nueva fila de tipo
`AJUSTE` que referencia (vía auto-relación `movimiento_origen_id`) a la fila que corrige.

**4. `CHECK` constraints vía SQL crudo en la migración.** Prisma ORM no tiene un atributo nativo
`@@check` en el lenguaje de schema (ver [issue #3388](https://github.com/prisma/prisma/issues/3388), aún
abierto). Se generaron con `prisma migrate dev --create-only` y se agregaron a mano al `migration.sql`
antes de aplicar.

**5. Auditoría automática vía Prisma Client Extensions, no `$use` middleware.** `prisma.$use()` está
deprecado desde Prisma 5; el mecanismo vigente es `$extends` (`src/extensions/audit.extension.ts`),
interceptando el componente `query` para todos los modelos. Se detectó una limitación real: las
extensiones de query no garantizan visibilidad completa dentro de transacciones interactivas
(`$transaction`). Por eso se usan **dos mecanismos complementarios**:
   - CRUD simple (`Usuario`, `Categoria`, `Producto`): auditado automáticamente por la extensión, que
     también completa `created_by`/`updated_by` (y en el caso de `StockActual`, solo esto último — no
     genera su propia fila de `audit_log`, porque el movimiento que la origina ya la documenta).
   - Movimientos de inventario (ruta crítica): el `AuditLog` se inserta **explícitamente dentro del mismo
     `$transaction`** que crea el movimiento y actualiza el stock (`movimientos.repository.ts`), sin
     depender del comportamiento de la extensión bajo transacciones.

**6. Prisma ORM 7 (generador `prisma-client`, sin motor Rust).** El generador clásico `prisma-client-js`
está deprecado desde Prisma 7 en favor de `prisma-client`, que ya no depende del motor de consultas
escrito en Rust y requiere un **driver adapter explícito** (`@prisma/adapter-pg`) incluso para Node.js
estándar (no solo para entornos edge/serverless, como en versiones anteriores). El cliente generado vive
en `src/generated/prisma/` (no en `node_modules`), y se regenera con `npx prisma generate` — por eso está
en `.gitignore`.

**7. IDs UUID generados en el cliente, no en PostgreSQL.** `String @id @default(uuid())` evita depender
de extensiones nativas de Postgres (`pgcrypto`/`uuid-ossp`), simplificando el setup de la base de datos.

## Roles y permisos

| Rol | Puede |
|---|---|
| `ADMIN` | Todo lo de SUPERVISOR + registrar nuevos usuarios |
| `SUPERVISOR` | Crear/editar/dar de baja categorías y productos, registrar movimientos, ver reportes |
| `OPERADOR` | Leer categorías/productos, registrar movimientos, ver alertas/reportes/predicción |

Lectura (`GET`) de categorías, productos, movimientos, alertas, predicción y reportes está disponible
para cualquier usuario autenticado, independientemente del rol.

## Estructura de carpetas

```
SGI/
├── prisma/
│   ├── schema.prisma           # modelo de datos completo
│   ├── seed.ts                 # datos de ejemplo (usuarios, categorias, productos, movimientos)
│   ├── checks.sql               # referencia de CHECKs y FKs manuales
│   └── migrations/
├── src/
│   ├── config/                 # env.ts (Zod), logger.ts (pino)
│   ├── lib/                    # prisma.ts, jwt.ts, errors.ts, async-context.ts, granularidad.ts
│   ├── extensions/             # Prisma Client Extensions (auditoria, inmutabilidad)
│   ├── modules/                # un modulo por dominio de negocio (routes/controller/service/...)
│   │   ├── auth/  usuarios/  categorias/  productos/  movimientos/
│   │   └── alertas/  prediccion/  reportes/
│   ├── middlewares/            # auth, roles, validacion, logging, manejo de errores
│   ├── routes/                 # ensamblado de todos los routers bajo /api
│   ├── docs/                   # documento OpenAPI
│   ├── generated/prisma/       # cliente Prisma generado (gitignored)
│   ├── app.ts                  # ensambla Express (sin listen)
│   └── server.ts                # listen() + apagado ordenado
├── tests/
│   ├── unit/                   # formulas puras del modulo predictivo
│   ├── integration/            # endpoints HTTP contra PostgreSQL real
│   └── helpers/                # build-app.ts, test-db.ts, auth-helper.ts
├── .env.example
└── package.json
```
