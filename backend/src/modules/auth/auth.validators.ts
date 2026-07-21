import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export const refrescarTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken es obligatorio"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefrescarTokenInput = z.infer<typeof refrescarTokenSchema>;
