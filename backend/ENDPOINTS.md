# Referencia rápida de endpoints

Documentación interactiva completa (OpenAPI 3.0 + Swagger UI) en `GET /docs` con el servidor corriendo.
Este archivo es un resumen escaneable; el detalle de request/response está en Swagger.

Todos los endpoints, salvo `POST /api/auth/login` y `POST /api/auth/refresh`, requieren header
`Authorization: Bearer <token>`. El JWT de acceso dura poco (15 min por defecto); la sesión prolongada la
sostiene el refresh token devuelto por login (7 días, rota en cada uso vía `/api/auth/refresh`).

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Login, devuelve JWT de acceso + refresh token + `usuario.permisos` (códigos "modulo.accion" de la matriz roles_permisos) |
| POST | `/api/auth/refresh` | público (requiere refresh token vigente) | Renueva el JWT de acceso, rota el refresh token, re-emite `usuario.permisos` |
| GET | `/api/usuarios` | ADMIN | Listar usuarios activos (sin `passwordHash`) |
| POST | `/api/usuarios` | ADMIN | Registrar un nuevo usuario |
| GET | `/api/categorias` | autenticado | Listar categorías activas |
| POST | `/api/categorias` | ADMIN, SUPERVISOR | Crear categoría |
| GET | `/api/categorias/:id` | autenticado | Obtener categoría |
| PUT | `/api/categorias/:id` | ADMIN, SUPERVISOR | Actualizar categoría |
| DELETE | `/api/categorias/:id` | ADMIN, SUPERVISOR | Baja lógica (soft delete) |
| GET | `/api/marcas` | autenticado | Listar marcas activas |
| POST | `/api/marcas` | ADMIN, SUPERVISOR | Crear marca |
| GET/PUT/DELETE | `/api/marcas/:id` | autenticado / ADMIN, SUPERVISOR | Obtener / actualizar / baja lógica |
| GET | `/api/unidades-medida` | autenticado | Listar unidades de medida activas |
| POST | `/api/unidades-medida` | ADMIN, SUPERVISOR | Crear unidad de medida |
| GET/PUT/DELETE | `/api/unidades-medida/:id` | autenticado / ADMIN, SUPERVISOR | Obtener / actualizar / baja lógica |
| GET | `/api/almacenes` | autenticado | Listar almacenes activos |
| POST | `/api/almacenes` | ADMIN, SUPERVISOR | Crear almacén (+ `Stock` en cero para cada producto activo, misma transacción) |
| GET/PUT/DELETE | `/api/almacenes/:id` | autenticado / ADMIN, SUPERVISOR | Obtener / actualizar / baja lógica |
| GET | `/api/clientes` | autenticado | Listar clientes activos |
| POST | `/api/clientes` | ADMIN, SUPERVISOR, VENTAS | Crear cliente |
| GET/PUT/DELETE | `/api/clientes/:id` | autenticado / ADMIN, SUPERVISOR, VENTAS | Obtener / actualizar / baja lógica |
| GET | `/api/proveedores` | autenticado | Listar proveedores activos |
| POST | `/api/proveedores` | ADMIN, SUPERVISOR | Crear proveedor |
| GET/PUT/DELETE | `/api/proveedores/:id` | autenticado / ADMIN, SUPERVISOR | Obtener / actualizar / baja lógica |
| POST | `/api/almacenes/transferencias` | permiso `inventario.crear` | Transferir stock entre dos almacenes (transaccional, dos movimientos TRANSFERENCIA enlazados) |
| GET | `/api/compras` | ADMIN, SUPERVISOR, GERENCIA (ver) | Listar compras (con proveedor, almacén y detalle) |
| POST | `/api/compras` | ADMIN, SUPERVISOR | Crear compra en `BORRADOR` (totales calculados: subtotal + IVA 15%) |
| GET | `/api/compras/:id` | ADMIN, SUPERVISOR, GERENCIA (ver) | Obtener compra |
| POST | `/api/compras/:id/confirmar` | ADMIN, SUPERVISOR | Confirmar: genera un movimiento ENTRADA real por línea (transaccional) |
| POST | `/api/compras/:id/anular` | ADMIN, SUPERVISOR | Anular (solo si sigue en `BORRADOR`) |
| GET | `/api/ventas` | ADMIN, SUPERVISOR, VENTAS, GERENCIA (ver) | Listar ventas (con cliente, almacén y detalle) |
| POST | `/api/ventas` | ADMIN, SUPERVISOR, VENTAS | Crear venta en `BORRADOR` (totales calculados: subtotal + IVA 15%) |
| GET | `/api/ventas/:id` | ADMIN, SUPERVISOR, VENTAS, GERENCIA (ver) | Obtener venta |
| POST | `/api/ventas/:id/confirmar` | ADMIN, SUPERVISOR, VENTAS | Confirmar: genera un movimiento SALIDA real por línea, valida stock suficiente (transaccional) |
| POST | `/api/ventas/:id/anular` | ADMIN, SUPERVISOR, VENTAS | Anular (solo si sigue en `BORRADOR`) |
| GET | `/api/productos` | autenticado | Listar productos activos (con categoría, marca, unidad y stock por almacén) |
| POST | `/api/productos` | ADMIN, SUPERVISOR | Crear producto (+ `Stock` en cada almacén activo, misma transacción) |
| GET | `/api/productos/:id` | autenticado | Obtener producto |
| PUT | `/api/productos/:id` | ADMIN, SUPERVISOR | Actualizar producto (SKU no editable) |
| DELETE | `/api/productos/:id` | ADMIN, SUPERVISOR | Baja lógica (soft delete) |
| GET | `/api/productos/exportar?formato=csv\|excel\|pdf` | autenticado | Descarga el catálogo completo en el formato pedido |
| POST | `/api/productos/importar` | ADMIN, SUPERVISOR | Importación masiva (hasta 500 filas); cada fila se procesa de forma independiente y se reportan errores fila por fila |
| GET | `/api/movimientos` | autenticado | Consultar el libro (filtros: `productoId`, `almacenId`, `tipo`, `desde`, `hasta`) |
| POST | `/api/movimientos` | autenticado | Registrar ENTRADA / SALIDA / AJUSTE en un almacén (transaccional) |
| GET | `/api/alertas` | autenticado | Productos en o bajo su stock mínimo (sincroniza `Alerta` antes de responder) |
| GET | `/api/alertas/persistidas` | autenticado | Las 5 alertas persistidas sin resolver (`STOCK_BAJO`, `AGOTADO`, `POR_VENCER`, `COMPRA_PENDIENTE`, `VENTA_ANULADA`) |
| PATCH | `/api/alertas/:id/resolver` | autenticado | Marcar una alerta como resuelta manualmente |
| GET | `/api/notificaciones` | autenticado | Notificaciones internas del usuario autenticado |
| GET | `/api/notificaciones/no-leidas` | autenticado | Conteo de notificaciones sin leer (`{ total }`) |
| PATCH | `/api/notificaciones/:id/leida` | autenticado (dueño) | Marcar una notificación propia como leída |
| GET | `/api/prediccion/:productoId` | autenticado | Proyección de demanda (SMA + regresión lineal) + recomendación de reabastecimiento |
| GET | `/api/reportes/existencias` | autenticado | Resumen de existencias y valor de inventario |
| GET | `/api/reportes/existencias/exportar?formato=csv\|excel\|pdf` | autenticado | Descarga el reporte de existencias en el formato pedido |
| GET | `/api/reportes/rotacion` | autenticado | Entradas vs. salidas por producto en un rango de fechas |
| GET | `/api/reportes/rotacion/exportar?formato=csv\|excel\|pdf` | autenticado | Descarga el reporte de rotación en el formato pedido |
| GET | `/api/reportes/movimientos-por-periodo` | autenticado | Totales de movimientos agrupados por período y tipo |
| GET | `/api/reportes/dashboard` | autenticado | KPIs ejecutivos: valor de inventario, margen bruto promedio, rotación (90 días) y curva ABC |

## Formato de respuesta

Éxito: `{ "data": ... }`. Error: `{ "error": { "message": "...", "details": ... } }` (nunca incluye
stack traces).

Códigos de error comunes: `400` datos inválidos (Zod), `401` sin token / token inválido, `403` rol
insuficiente, `404` no encontrado, `409` conflicto (duplicado, stock insuficiente, movimiento inmutable).
