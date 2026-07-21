import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearAlmacenSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  direccion: z.string().optional(),
});

export const actualizarAlmacenSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    direccion: z.string().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export const transferenciaSchema = z
  .object({
    productoId: z.uuid(),
    almacenOrigenId: z.uuid(),
    almacenDestinoId: z.uuid(),
    cantidad: z.number().int().positive("La cantidad debe ser mayor a cero"),
    motivo: z.string().optional(),
  })
  .refine((data) => data.almacenOrigenId !== data.almacenDestinoId, {
    message: "El almacen de origen y destino no pueden ser el mismo",
    path: ["almacenDestinoId"],
  });

export type CrearAlmacenInput = z.infer<typeof crearAlmacenSchema>;
export type ActualizarAlmacenInput = z.infer<typeof actualizarAlmacenSchema>;
export type TransferenciaInput = z.infer<typeof transferenciaSchema>;
