import { z } from "zod";

export const rangoFechasQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export const movimientosPorPeriodoQuerySchema = z.object({
  desde: z.coerce.date().default(() => new Date(0)),
  hasta: z.coerce.date().default(() => new Date()),
  granularidad: z.enum(["diaria", "semanal", "mensual"]).default("mensual"),
});

export type RangoFechasQuery = z.infer<typeof rangoFechasQuerySchema>;
export type MovimientosPorPeriodoQuery = z.infer<typeof movimientosPorPeriodoQuerySchema>;
