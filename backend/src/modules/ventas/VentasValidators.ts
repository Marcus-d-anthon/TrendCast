import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearVentaSchema = z.object({
  clienteId: z.uuid(),
  almacenId: z.uuid(),
  detalle: z
    .array(
      z.object({
        productoId: z.uuid(),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a cero"),
        precioUnitario: z.number().nonnegative("El precio no puede ser negativo"),
      })
    )
    .min(1, "La venta debe tener al menos una linea de detalle"),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
