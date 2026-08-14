import type { Request, Response } from "express";
import { ForbiddenError } from "../../lib/errors";
import { movimientosService } from "./MovimientosService";
import { listarMovimientosQuerySchema, registrarMovimientoSchema } from "./MovimientosValidators";

// Un usuario BODEGA queda atado a un unico almacen (Usuario.almacenId): sin
// importar que filtro mande el cliente, tanto para listar como para
// registrar se fuerza su propio almacen -- nunca puede ver ni escribir
// movimientos de un almacen que no es el suyo.
function almacenForzadoParaBodega(req: Request): string | undefined {
  if (req.usuario!.rol !== "BODEGA") return undefined;
  if (!req.usuario!.almacenId) {
    throw new ForbiddenError("Tu usuario no tiene un almacén asignado. Contacta a un administrador.");
  }
  return req.usuario!.almacenId;
}

export const movimientosController = {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros = listarMovimientosQuerySchema.parse(req.query);
    const almacenForzado = almacenForzadoParaBodega(req);
    if (almacenForzado) filtros.almacenId = almacenForzado;

    if (req.query.page !== undefined) {
      const resultado = await movimientosService.listarPaginado(filtros);
      res.status(200).json(resultado);
      return;
    }
    const movimientos = await movimientosService.listar(filtros);
    res.status(200).json({ data: movimientos });
  },

  async registrar(req: Request, res: Response): Promise<void> {
    const input = registrarMovimientoSchema.parse(req.body);
    const almacenForzado = almacenForzadoParaBodega(req);
    if (almacenForzado && input.almacenId !== almacenForzado) {
      throw new ForbiddenError("No puedes registrar movimientos fuera de tu almacén asignado");
    }
    const movimiento = await movimientosService.registrar(req.usuario!.id, input);
    res.status(201).json({ data: movimiento });
  },
};
