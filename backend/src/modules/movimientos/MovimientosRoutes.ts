import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { movimientosController } from "./MovimientosController";

export const movimientosRouter = Router();

// Cualquier usuario autenticado puede registrar y consultar movimientos: la
// trazabilidad no depende de restringir por rol, sino de que el libro
// inmutable siempre queda con el usuario que registro cada linea.
movimientosRouter.use(authMiddleware);

movimientosRouter.get("/", movimientosController.listar);
movimientosRouter.post("/", movimientosController.registrar);
