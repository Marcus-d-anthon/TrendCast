import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "La contrasena es obligatoria"),
  // Solo se exige cuando la cuenta tiene 2FA habilitado -- ver AuthService.login.
  // Acepta tanto un codigo TOTP de 6 digitos como uno de recuperacion (formato XXXX-XXXX).
  codigoTotp: z.string().min(1).optional(),
});

export const refrescarTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken es obligatorio"),
});

export const verificar2faSchema = z.object({
  codigo: z.string().length(6, "El codigo debe tener 6 digitos"),
});

export const desactivar2faSchema = z.object({
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefrescarTokenInput = z.infer<typeof refrescarTokenSchema>;
export type Verificar2faInput = z.infer<typeof verificar2faSchema>;
export type Desactivar2faInput = z.infer<typeof desactivar2faSchema>;
