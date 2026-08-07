import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearUnidadMedidaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  abreviatura: z.string().min(1, "La abreviatura es obligatoria"),
});

export const actualizarUnidadMedidaSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    abreviatura: z.string().min(1).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export type CrearUnidadMedidaInput = z.infer<typeof crearUnidadMedidaSchema>;
export type ActualizarUnidadMedidaInput = z.infer<typeof actualizarUnidadMedidaSchema>;
