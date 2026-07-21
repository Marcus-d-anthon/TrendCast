import { z } from "zod";
import { TipoDocumento } from "../../generated/prisma/enums";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearProveedorSchema = z.object({
  tipoDocumento: z.enum(TipoDocumento),
  numeroDocumento: z.string().min(1, "El numero de documento es obligatorio"),
  razonSocial: z.string().min(1, "La razon social es obligatoria"),
  nombreComercial: z.string().optional(),
  email: z.email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export const actualizarProveedorSchema = z
  .object({
    tipoDocumento: z.enum(TipoDocumento).optional(),
    numeroDocumento: z.string().min(1).optional(),
    razonSocial: z.string().min(1).optional(),
    nombreComercial: z.string().optional(),
    email: z.email().optional(),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;
