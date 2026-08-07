import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { reportesController } from "./reportes.controller";

export const reportesRouter = Router();

reportesRouter.use(authMiddleware);
reportesRouter.get("/existencias", reportesController.existencias);
reportesRouter.get("/rotacion", reportesController.rotacion);
reportesRouter.get("/movimientos-por-periodo", reportesController.movimientosPorPeriodo);
