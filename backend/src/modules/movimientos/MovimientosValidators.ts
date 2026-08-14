import { z } from "zod";
import { TipoMovimiento } from "../../generated/prisma/enums";

export const idParamSchema = z.object({
  id: z.uuid(),
});

// TRANSFERENCIA queda fuera a proposito: tiene su propio endpoint dedicado
// (POST /almacenes/transferencias) que crea las dos filas enlazadas
// (origen/destino) de forma atomica -- permitirla aqui abriria la puerta a
// una transferencia "coja", con un solo lado registrado.
export const registrarMovimientoSchema = z
  .object({
    productoId: z.uuid(),
    almacenId: z.uuid(),
    tipo: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
    cantidad: z.number().int().positive("La cantidad debe ser mayor a cero"),
    referencia: z.string().optional(),
    motivo: z.string().optional(),
    // Solo aplica (y es obligatorio) cuando tipo === "AJUSTE": referencia el
    // movimiento original que se esta corrigiendo.
    movimientoOrigenId: z.uuid().optional(),
  })
  .refine((data) => data.tipo !== "AJUSTE" || Boolean(data.movimientoOrigenId), {
    message: "Un AJUSTE debe referenciar el movimiento original que corrige (movimientoOrigenId)",
    path: ["movimientoOrigenId"],
  })
  .refine((data) => data.tipo === "AJUSTE" || !data.movimientoOrigenId, {
    message: "movimientoOrigenId solo aplica a movimientos de tipo AJUSTE",
    path: ["movimientoOrigenId"],
  });

export const listarMovimientosQuerySchema = z.object({
  productoId: z.uuid().optional(),
  almacenId: z.uuid().optional(),
  tipo: z.enum(TipoMovimiento).optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>;
export type ListarMovimientosQuery = z.infer<typeof listarMovimientosQuerySchema>;
