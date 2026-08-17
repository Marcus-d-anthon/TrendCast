import type { Request, Response } from "express";
import { devolucionesService } from "./DevolucionesService";
import { crearDevolucionSchema, idParamSchema, listarDevolucionesQuerySchema } from "./DevolucionesValidators";

export const devolucionesController = {
  async listar(req: Request, res: Response): Promise<void> {
    const query = listarDevolucionesQuerySchema.parse(req.query);

    // GET /devoluciones?ventaId=... o ?compraId=...: usado por
    // VentaDetailPage/CompraDetailPage para listar las devoluciones de un
    // documento especifico, sin paginar (siempre son pocas).
    if (query.ventaId || query.compraId) {
      const devoluciones = await devolucionesService.listar({ ventaId: query.ventaId, compraId: query.compraId });
      res.status(200).json({ data: devoluciones });
      return;
    }

    const resultado = await devolucionesService.listarPaginado(query);
    res.status(200).json(resultado);
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const devolucion = await devolucionesService.obtener(id);
    res.status(200).json({ data: devolucion });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearDevolucionSchema.parse(req.body);
    const devolucion = await devolucionesService.crear(req.usuario!.id, input);
    res.status(201).json({ data: devolucion });
  },

  async confirmar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const devolucion = await devolucionesService.confirmar(id, req.usuario!.id);
    res.status(200).json({ data: devolucion });
  },
};
