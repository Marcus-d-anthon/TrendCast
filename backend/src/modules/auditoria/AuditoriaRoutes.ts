import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { auditoriaController } from "./AuditoriaController";

export const auditoriaRouter = Router();

// Panel de supervision transversal (mismo criterio que /admin): gateado por
// ROL, no por la matriz de permisos -- ver el historial de auditoria de un
// registro es una funcion de supervision, no una accion "modulo.accion".
auditoriaRouter.use(authMiddleware, requireRole("ADMIN", "SUPERVISOR", "SUPERUSUARIO"));

auditoriaRouter.get("/", auditoriaController.listar);
