import { z } from "zod";
import { RolUsuario } from "../../generated/prisma/enums";

export const crearUsuarioSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  rol: z.enum(RolUsuario).default("BODEGA"),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
