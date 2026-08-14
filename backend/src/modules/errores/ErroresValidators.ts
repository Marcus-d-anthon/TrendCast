import { z } from "zod";

export const listarErroresQuerySchema = z.object({
  busqueda: z.string().trim().min(1).optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export type ListarErroresQuery = z.infer<typeof listarErroresQuerySchema>;
