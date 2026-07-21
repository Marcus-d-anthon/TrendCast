import { z } from "zod";
import { TipoDocumento } from "../../generated/prisma/enums";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearClienteSchema = z.object({
  tipoDocumento: z.enum(TipoDocumento),
  numeroDocumento: z.string().min(1, "El numero de documento es obligatorio"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export const actualizarClienteSchema = z
  .object({
    tipoDocumento: z.enum(TipoDocumento).optional(),
    numeroDocumento: z.string().min(1).optional(),
    nombre: z.string().min(1).optional(),
    email: z.email().optional(),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
