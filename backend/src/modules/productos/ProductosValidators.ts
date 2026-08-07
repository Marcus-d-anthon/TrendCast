import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const crearProductoSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  categoriaId: z.uuid(),
  marcaId: z.uuid(),
  unidadMedidaId: z.uuid(),
  precioCompra: z.number().nonnegative("El precio de compra no puede ser negativo"),
  precioVenta: z.number().nonnegative("El precio de venta no puede ser negativo"),
  stockMinimo: z.number().int().nonnegative().default(0),
  requiereLote: z.boolean().default(false),
});

// El SKU no es editable: es el identificador de negocio del producto. Si se
// cometio un error de tipeo, se da de baja logica y se crea un producto
// nuevo, preservando la trazabilidad de movimientos existentes.
export const actualizarProductoSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    descripcion: z.string().optional(),
    categoriaId: z.uuid().optional(),
    marcaId: z.uuid().optional(),
    unidadMedidaId: z.uuid().optional(),
    precioCompra: z.number().nonnegative().optional(),
    precioVenta: z.number().nonnegative().optional(),
    stockMinimo: z.number().int().nonnegative().optional(),
    requiereLote: z.boolean().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe incluir al menos un campo para actualizar",
  });

export const importarProductosSchema = z.object({
  filas: z.array(crearProductoSchema).min(1, "El archivo no tiene filas para importar").max(500, "Máximo 500 filas por importación"),
});

export const exportarProductosQuerySchema = z.object({
  formato: z.enum(["csv", "excel", "pdf"]),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
export type ImportarProductosInput = z.infer<typeof importarProductosSchema>;
