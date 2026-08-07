import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearMarcaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
});

export const actualizarMarcaSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export type CrearMarcaInput = z.infer<typeof crearMarcaSchema>;
export type ActualizarMarcaInput = z.infer<typeof actualizarMarcaSchema>;
