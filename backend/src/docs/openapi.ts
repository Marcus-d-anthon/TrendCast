// Documento OpenAPI 3.0 escrito a mano (en vez de swagger-jsdoc + comentarios
// dispersos en cada archivo de rutas): para el tamano de este proyecto es mas
// facil de mantener tener una unica fuente de verdad aqui que perseguir
// anotaciones JSDoc en 8 modulos distintos. Se sirve via swagger-ui-express
// en GET /docs (ver src/app.ts).

const errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        message: { type: "string" },
        details: {},
      },
    },
  },
} as const;

function respuestaError(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  };
}

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SGI - Sistema de Gestion de Inventarios con Analisis Predictivo",
    version: "1.0.0",
    description:
      "API del backend de gestion de inventarios de TIANSHI ECUADOR S.A. Incluye auditoria automatica de " +
      "toda mutacion (audit_log), un libro de movimientos de inventario inmutable (append-only) y un " +
      "modulo predictivo basado en promedio movil simple y regresion lineal por minimos cuadrados.",
  },
  servers: [{ url: "/api", description: "Prefijo base de la API" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: errorSchema,
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          nombre: { type: "string" },
          rol: { type: "string", enum: ["ADMIN", "SUPERVISOR", "BODEGA", "VENTAS", "GERENCIA"] },
          activo: { type: "boolean" },
        },
      },
      Categoria: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nombre: { type: "string" },
          descripcion: { type: "string", nullable: true },
          activo: { type: "boolean" },
        },
      },
      Producto: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sku: { type: "string" },
          nombre: { type: "string" },
          descripcion: { type: "string", nullable: true },
          unidadMedida: { type: "string" },
          precioUnitario: { type: "number" },
          stockMinimo: { type: "integer" },
          activo: { type: "boolean" },
          categoriaId: { type: "string", format: "uuid" },
          stockActual: {
            type: "object",
            nullable: true,
            properties: { cantidad: { type: "integer" } },
          },
        },
      },
      MovimientoInventario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tipo: { type: "string", enum: ["ENTRADA", "SALIDA", "AJUSTE"] },
          cantidad: { type: "integer", minimum: 1 },
          saldoResultante: { type: "integer", minimum: 0 },
          referencia: { type: "string", nullable: true },
          motivo: { type: "string", nullable: true },
          productoId: { type: "string", format: "uuid" },
          usuarioId: { type: "string", format: "uuid" },
          movimientoOrigenId: { type: "string", format: "uuid", nullable: true },
          fecha: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      NoAutenticado: respuestaError("Token ausente o invalido"),
      NoAutorizado: respuestaError("El rol del usuario autenticado no alcanza para esta accion"),
      NoEncontrado: respuestaError("El recurso solicitado no existe (o fue dado de baja logica)"),
      Conflicto: respuestaError("Conflicto con el estado actual: duplicado, stock insuficiente, etc."),
      DatosInvalidos: respuestaError("Error de validacion de los datos de entrada (Zod)"),
    },
  },
  tags: [
    { name: "Auth", description: "Autenticacion" },
    { name: "Usuarios", description: "Gestion de usuarios (solo ADMIN)" },
    { name: "Categorias", description: "Categorias de producto" },
    { name: "Productos", description: "Catalogo de productos" },
    { name: "Movimientos", description: "Libro de movimientos de inventario (append-only)" },
    { name: "Alertas", description: "Alertas de stock minimo" },
    { name: "Prediccion", description: "Proyeccion de demanda (SMA + regresion lineal)" },
    { name: "Reportes", description: "Reportes numericos para graficar" },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion y obtener un JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", description: "JWT de acceso, vida corta (15 min por defecto)" },
                        refreshToken: { type: "string", description: "Token opaco de larga duracion, usar en /auth/refresh" },
                        usuario: { $ref: "#/components/schemas/Usuario" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Renovar el JWT de acceso usando un refresh token vigente",
        description: "Rota el refresh token: el usado se revoca y se emite uno nuevo junto al JWT de acceso.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tokens renovados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string" },
                        refreshToken: { type: "string" },
                        usuario: { $ref: "#/components/schemas/Usuario" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
    },

    "/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar usuarios activos",
        description: "Solo ADMIN. No incluye el hash de la contraseña.",
        responses: {
          200: { description: "Listado de usuarios", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Usuario" } } } } } } },
          401: { $ref: "#/components/responses/NoAutenticado" },
          403: { $ref: "#/components/responses/NoAutorizado" },
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Registrar un nuevo usuario",
        description: "Solo ADMIN puede registrar usuarios.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nombre"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  nombre: { type: "string" },
                  rol: { type: "string", enum: ["ADMIN", "SUPERVISOR", "BODEGA", "VENTAS", "GERENCIA"], default: "BODEGA" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario creado",
            content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Usuario" } } } } },
          },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          409: { $ref: "#/components/responses/Conflicto" },
        },
      },
    },

    "/categorias": {
      get: {
        tags: ["Categorias"],
        summary: "Listar categorias activas",
        responses: {
          200: { description: "Listado de categorias", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Categoria" } } } } } } },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
      post: {
        tags: ["Categorias"],
        summary: "Crear una categoria",
        description: "Requiere rol ADMIN o SUPERVISOR.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["nombre"], properties: { nombre: { type: "string" }, descripcion: { type: "string" } } } } },
        },
        responses: {
          201: { description: "Categoria creada" },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          409: { $ref: "#/components/responses/Conflicto" },
        },
      },
    },
    "/categorias/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Categorias"],
        summary: "Obtener una categoria por id",
        responses: { 200: { description: "OK" }, 401: { $ref: "#/components/responses/NoAutenticado" }, 404: { $ref: "#/components/responses/NoEncontrado" } },
      },
      put: {
        tags: ["Categorias"],
        summary: "Actualizar una categoria",
        description: "Requiere rol ADMIN o SUPERVISOR.",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { nombre: { type: "string" }, descripcion: { type: "string" }, activo: { type: "boolean" } } } } },
        },
        responses: {
          200: { description: "Actualizada" },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
          409: { $ref: "#/components/responses/Conflicto" },
        },
      },
      delete: {
        tags: ["Categorias"],
        summary: "Dar de baja logica una categoria (soft delete)",
        description: "Requiere rol ADMIN o SUPERVISOR. Nunca borra el registro fisicamente.",
        responses: {
          204: { description: "Eliminada (soft delete)" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
        },
      },
    },

    "/productos": {
      get: {
        tags: ["Productos"],
        summary: "Listar productos activos (incluye categoria y stock actual)",
        responses: {
          200: { description: "Listado de productos", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Producto" } } } } } } },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
      post: {
        tags: ["Productos"],
        summary: "Crear un producto",
        description: "Requiere rol ADMIN o SUPERVISOR. Crea el producto y su fila de stock_actual (cantidad 0) en una sola transaccion.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sku", "nombre", "unidadMedida", "precioUnitario", "categoriaId"],
                properties: {
                  sku: { type: "string" },
                  nombre: { type: "string" },
                  descripcion: { type: "string" },
                  unidadMedida: { type: "string" },
                  precioUnitario: { type: "number", minimum: 0 },
                  stockMinimo: { type: "integer", minimum: 0, default: 0 },
                  categoriaId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Producto creado" },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
          409: { $ref: "#/components/responses/Conflicto" },
        },
      },
    },
    "/productos/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Productos"],
        summary: "Obtener un producto por id",
        responses: { 200: { description: "OK" }, 404: { $ref: "#/components/responses/NoEncontrado" } },
      },
      put: {
        tags: ["Productos"],
        summary: "Actualizar un producto",
        description: "Requiere rol ADMIN o SUPERVISOR. El SKU no es editable.",
        responses: {
          200: { description: "Actualizado" },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
        },
      },
      delete: {
        tags: ["Productos"],
        summary: "Dar de baja logica un producto (soft delete)",
        description: "Requiere rol ADMIN o SUPERVISOR.",
        responses: {
          204: { description: "Eliminado (soft delete)" },
          403: { $ref: "#/components/responses/NoAutorizado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
        },
      },
    },

    "/movimientos": {
      get: {
        tags: ["Movimientos"],
        summary: "Consultar el libro de movimientos",
        parameters: [
          { name: "productoId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "tipo", in: "query", schema: { type: "string", enum: ["ENTRADA", "SALIDA", "AJUSTE"] } },
          { name: "desde", in: "query", schema: { type: "string", format: "date" } },
          { name: "hasta", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "Listado de movimientos", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/MovimientoInventario" } } } } } } },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
      post: {
        tags: ["Movimientos"],
        summary: "Registrar un movimiento de inventario",
        description:
          "Cualquier usuario autenticado puede registrar movimientos (el usuario queda registrado en el " +
          "libro para trazabilidad). ENTRADA suma al stock, SALIDA resta (rechazada si dejaria el stock " +
          "negativo), AJUSTE fija el saldo absoluto y requiere movimientoOrigenId. Todo corre en una " +
          "transaccion atomica que tambien actualiza stock_actual y registra audit_log.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productoId", "tipo", "cantidad"],
                properties: {
                  productoId: { type: "string", format: "uuid" },
                  tipo: { type: "string", enum: ["ENTRADA", "SALIDA", "AJUSTE"] },
                  cantidad: { type: "integer", minimum: 1 },
                  referencia: { type: "string" },
                  motivo: { type: "string" },
                  movimientoOrigenId: { type: "string", format: "uuid", description: "Obligatorio si tipo=AJUSTE" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Movimiento registrado" },
          400: { $ref: "#/components/responses/DatosInvalidos" },
          401: { $ref: "#/components/responses/NoAutenticado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
          409: { $ref: "#/components/responses/Conflicto" },
        },
      },
    },

    "/alertas": {
      get: {
        tags: ["Alertas"],
        summary: "Listar productos en o por debajo de su stock minimo",
        responses: {
          200: { description: "Listado de alertas" },
          401: { $ref: "#/components/responses/NoAutenticado" },
        },
      },
    },

    "/prediccion/{productoId}": {
      get: {
        tags: ["Prediccion"],
        summary: "Proyectar demanda de un producto (promedio movil + regresion lineal)",
        parameters: [
          { name: "productoId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "periodos", in: "query", schema: { type: "integer", minimum: 1, maximum: 36, default: 6 } },
          { name: "granularidad", in: "query", schema: { type: "string", enum: ["diaria", "semanal", "mensual"], default: "mensual" } },
        ],
        responses: {
          200: { description: "Proyeccion de demanda y recomendacion de reabastecimiento" },
          401: { $ref: "#/components/responses/NoAutenticado" },
          404: { $ref: "#/components/responses/NoEncontrado" },
        },
      },
    },

    "/reportes/existencias": {
      get: {
        tags: ["Reportes"],
        summary: "Resumen de existencias actuales y valor de inventario",
        responses: { 200: { description: "OK" }, 401: { $ref: "#/components/responses/NoAutenticado" } },
      },
    },
    "/reportes/rotacion": {
      get: {
        tags: ["Reportes"],
        summary: "Entradas vs salidas por producto en un rango de fechas",
        parameters: [
          { name: "desde", in: "query", schema: { type: "string", format: "date" } },
          { name: "hasta", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "OK" }, 401: { $ref: "#/components/responses/NoAutenticado" } },
      },
    },
    "/reportes/movimientos-por-periodo": {
      get: {
        tags: ["Reportes"],
        summary: "Totales de movimientos agrupados por periodo y tipo",
        parameters: [
          { name: "desde", in: "query", schema: { type: "string", format: "date" } },
          { name: "hasta", in: "query", schema: { type: "string", format: "date" } },
          { name: "granularidad", in: "query", schema: { type: "string", enum: ["diaria", "semanal", "mensual"], default: "mensual" } },
        ],
        responses: { 200: { description: "OK" }, 401: { $ref: "#/components/responses/NoAutenticado" } },
      },
    },
  },
};
