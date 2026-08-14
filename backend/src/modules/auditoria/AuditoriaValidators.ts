import { z } from "zod";

export const listarAuditoriaQuerySchema = z.object({
  entidad: z.string().min(1),
  registroId: z.uuid(),
});

export type ListarAuditoriaQuery = z.infer<typeof listarAuditoriaQuerySchema>;
