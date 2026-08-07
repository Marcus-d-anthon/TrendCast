import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
});

export const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    descripcion: z.string().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaInput = z.infer<typeof actualizarCategoriaSchema>;
