import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearDevolucionSchema = z
  .object({
    tipo: z.enum(["CLIENTE", "PROVEEDOR"]),
    ventaId: z.uuid().optional(),
    compraId: z.uuid().optional(),
    motivo: z.string().trim().min(3, "El motivo es obligatorio"),
    detalle: z
      .array(
        z.object({
          productoId: z.uuid(),
          cantidad: z.number().int().positive("La cantidad debe ser mayor a cero"),
        })
      )
      .min(1, "La devolucion debe tener al menos una linea de detalle"),
  })
  .refine(
    (data) => (data.tipo === "CLIENTE" ? Boolean(data.ventaId) && !data.compraId : Boolean(data.compraId) && !data.ventaId),
    { message: "Una devolucion de cliente requiere ventaId, una de proveedor requiere compraId (nunca ambos)" }
  );

export const listarDevolucionesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  estado: z.enum(["BORRADOR", "CONFIRMADA", "ANULADA"]).optional(),
  tipo: z.enum(["CLIENTE", "PROVEEDOR"]).optional(),
  ventaId: z.uuid().optional(),
  compraId: z.uuid().optional(),
});

export type CrearDevolucionInput = z.infer<typeof crearDevolucionSchema>;
export type ListarDevolucionesQuery = z.infer<typeof listarDevolucionesQuerySchema>;
