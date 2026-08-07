import type { Request, Response } from "express";
import { contentTypeExport, generarExport, nombreArchivoExport, type TablaExport } from "../reportes/ReportesExport";
import { productosService } from "./ProductosService";
import {
  actualizarProductoSchema,
  crearProductoSchema,
  exportarProductosQuerySchema,
  idParamSchema,
  importarProductosSchema,
  listarProductosQuerySchema,
} from "./ProductosValidators";

export const productosController = {
  // Paginado SOLO si el caller manda "page" en el query string: selects que
  // necesitan el catalogo completo (ej. la linea de detalle de una compra o
  // venta) siguen pidiendo /productos tal cual, sin romperse.
  async listar(req: Request, res: Response): Promise<void> {
    if (req.query.page !== undefined) {
      const query = listarProductosQuerySchema.parse(req.query);
      const resultado = await productosService.listarPaginado(query);
      res.status(200).json(resultado);
      return;
    }
    const productos = await productosService.listar();
    res.status(200).json({ data: productos });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const producto = await productosService.obtener(id);
    res.status(200).json({ data: producto });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearProductoSchema.parse(req.body);
    const producto = await productosService.crear(input);
    res.status(201).json({ data: producto });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarProductoSchema.parse(req.body);
    const producto = await productosService.actualizar(id, input);
    res.status(200).json({ data: producto });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await productosService.eliminar(id);
    res.status(204).send();
  },

  async importarMasivo(req: Request, res: Response): Promise<void> {
    const { filas } = importarProductosSchema.parse(req.body);
    const resultado = await productosService.importarMasivo(filas);
    res.status(200).json({ data: resultado });
  },

  async exportar(req: Request, res: Response): Promise<void> {
    const { formato } = exportarProductosQuerySchema.parse(req.query);
    const productos = await productosService.listar();

    const tabla: TablaExport = {
      titulo: "Catalogo de productos",
      columnas: [
        { header: "SKU", key: "sku", ancho: 16 },
        { header: "Producto", key: "nombre", ancho: 32 },
        { header: "Categoria", key: "categoria", ancho: 20 },
        { header: "Marca", key: "marca", ancho: 18 },
        { header: "Unidad", key: "unidad", ancho: 12 },
        { header: "Precio compra", key: "precioCompra", ancho: 16 },
        { header: "Precio venta", key: "precioVenta", ancho: 16 },
        { header: "Stock minimo", key: "stockMinimo", ancho: 14 },
        { header: "Stock actual", key: "stockActual", ancho: 14 },
        { header: "Estado", key: "estado", ancho: 12 },
      ],
      filas: productos.map((p) => ({
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria.nombre,
        marca: p.marca.nombre,
        unidad: p.unidadMedida.abreviatura,
        precioCompra: Number(p.precioCompra),
        precioVenta: Number(p.precioVenta),
        stockMinimo: p.stockMinimo,
        stockActual: p.stocks.reduce((suma, s) => suma + s.cantidad, 0),
        estado: p.activo ? "Activo" : "Inactivo",
      })),
    };

    const buffer = await generarExport(tabla, formato);
    res.setHeader("Content-Type", contentTypeExport(formato));
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivoExport("productos", formato)}"`);
    res.status(200).send(buffer);
  },
};
