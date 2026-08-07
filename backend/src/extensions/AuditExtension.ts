import { Prisma } from "../generated/prisma/client";
import { getUsuarioActual } from "../lib/async-context";

// Modelos con columnas created_by/updated_by que se completan automaticamente
// (incluye Stock y Lote: tablas de negocio mutables con esas columnas,
// aunque no generan su propia fila de audit_log -- ver mas abajo).
const MODELOS_CON_COLUMNAS_AUDITORIA = new Set([
  "Usuario",
  "Categoria",
  "Producto",
  "Stock",
  "Lote",
  "Marca",
  "UnidadMedida",
  "Almacen",
  "Cliente",
  "Proveedor",
]);

// Subconjunto que ademas genera una fila en audit_log. AuditLog queda fuera
// para no auto-referenciarse. Stock y Lote quedan fuera porque su cambio ya
// queda documentado por la fila de audit_log del MovimientoInventario que lo
// origina (una entrada duplicada no aportaria informacion nueva).
// MovimientoInventario, Compra y Venta tambien quedan fuera a proposito: su
// AuditLog se escribe explicitamente dentro de la misma transaccion que la
// operacion (ver movimientos.repository, compras.repository, ventas.repository),
// porque las extensiones de query no garantizan visibilidad completa dentro
// de transacciones interactivas ($transaction) — es una limitacion
// documentada de Prisma Client Extensions.
const MODELOS_CON_AUDIT_LOG = new Set([
  "Usuario",
  "Categoria",
  "Producto",
  "Marca",
  "UnidadMedida",
  "Almacen",
  "Cliente",
  "Proveedor",
]);
const OPERACIONES_ESCRITURA = new Set(["create", "update", "updateMany"]);

type Delegate = {
  findUnique(args: { where: unknown }): Promise<unknown>;
};

export const auditExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: "audit-log",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Se castea query a una firma generica: al desestructurar el union
          // discriminado por "model" sin narrowing inmediato, TS no logra
          // resolver un tipo invocable comun entre todas las variantes.
          const ejecutarQuery = query as (args: unknown) => Promise<unknown>;

          if (!model) {
            return ejecutarQuery(args);
          }

          const usuarioId = getUsuarioActual()?.id ?? null;

          // Completa created_by/updated_by automaticamente (mismo espiritu que
          // audit_log: que sea imposible olvidarlo en un service). El llamador
          // puede sobrescribirlo pasando el campo explicitamente en data.
          if (MODELOS_CON_COLUMNAS_AUDITORIA.has(model) && args && typeof args === "object" && "data" in args) {
            const data = (args as { data: Record<string, unknown> }).data;
            if (operation === "create" && data.createdBy === undefined) {
              data.createdBy = usuarioId;
            }
            if ((operation === "create" || operation === "update" || operation === "updateMany") && data.updatedBy === undefined) {
              data.updatedBy = usuarioId;
            }
          }

          if (!MODELOS_CON_AUDIT_LOG.has(model) || !OPERACIONES_ESCRITURA.has(operation)) {
            return ejecutarQuery(args);
          }

          const nombreDelegate = model.charAt(0).toLowerCase() + model.slice(1);
          const delegate = (client as unknown as Record<string, Delegate>)[nombreDelegate];

          let valorAnterior: unknown = null;
          if (operation === "update" && args && typeof args === "object" && "where" in args) {
            valorAnterior = await delegate.findUnique({ where: (args as { where: unknown }).where });
          }

          const resultado = await ejecutarQuery(args);

          const datosEscritos =
            operation !== "updateMany" && args && typeof args === "object" && "data" in args
              ? (args as { data: Record<string, unknown> }).data
              : undefined;

          const esSoftDelete =
            operation === "update" &&
            datosEscritos?.deletedAt != null &&
            (valorAnterior as { deletedAt: unknown } | null)?.deletedAt == null;

          const registroId =
            operation !== "updateMany" && resultado && typeof resultado === "object" && "id" in resultado
              ? (resultado as { id: string }).id
              : null;

          if (registroId === null) {
            // updateMany no expone id de una fila concreta; se omite el detalle
            // por-fila (limitacion aceptada, el caso de uso del sistema no
            // depende de updateMany masivos sobre estos modelos).
            return resultado;
          }

          await client.auditLog.create({
            data: {
              entidad: model,
              registroId,
              accion: operation === "create" ? "CREATE" : esSoftDelete ? "SOFT_DELETE" : "UPDATE",
              valorAnterior: valorAnterior as unknown as Prisma.InputJsonValue,
              valorNuevo: resultado as unknown as Prisma.InputJsonValue,
              usuarioId,
            },
          });

          return resultado;
        },
      },
    },
  })
);
