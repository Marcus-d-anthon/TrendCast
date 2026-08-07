import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { reportesController } from "./ReportesController";

export const reportesRouter = Router();

reportesRouter.use(authMiddleware);
reportesRouter.get("/existencias", reportesController.existencias);
reportesRouter.get("/existencias/exportar", reportesController.existenciasExportar);
reportesRouter.get("/rotacion", reportesController.rotacion);
reportesRouter.get("/rotacion/exportar", reportesController.rotacionExportar);
reportesRouter.get("/movimientos-por-periodo", reportesController.movimientosPorPeriodo);
reportesRouter.get("/dashboard", reportesController.dashboardEjecutivo);
