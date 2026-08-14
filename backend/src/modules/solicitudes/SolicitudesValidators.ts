import { z } from "zod";

export const crearSolicitudSchema = z.object({
  tipo: z.enum(["REABASTECIMIENTO", "VENTA_ESPECIAL"]),
  productoId: z.uuid(),
  almacenId: z.uuid(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a cero"),
  comentario: z.string().optional(),
});

export const listarSolicitudesQuerySchema = z.object({
  estado: z.enum(["PENDIENTE", "APROBADA", "RECHAZADA", "EFECTUADA"]).optional(),
});

export const rechazarSolicitudSchema = z.object({
  motivo: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres"),
});

export const idParamSchema = z.object({
  id: z.uuid(),
});

export type CrearSolicitudInput = z.infer<typeof crearSolicitudSchema>;
export type ListarSolicitudesQuery = z.infer<typeof listarSolicitudesQuerySchema>;
export type RechazarSolicitudInput = z.infer<typeof rechazarSolicitudSchema>;
