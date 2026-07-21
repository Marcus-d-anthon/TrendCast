import { z } from "zod";

export const prediccionParamsSchema = z.object({
  productoId: z.uuid(),
});

export const prediccionQuerySchema = z.object({
  periodos: z.coerce.number().int().positive().max(36).default(6),
  granularidad: z.enum(["diaria", "semanal", "mensual"]).default("mensual"),
});

export type PrediccionQuery = z.infer<typeof prediccionQuerySchema>;
