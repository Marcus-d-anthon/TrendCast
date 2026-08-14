import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { erroresController } from "./ErroresController";

export const erroresRouter = Router();

// Rastro tecnico de excepciones -- solo Super Admin (mismo criterio que
// /admin y /auditoria): un administrador comun no necesita ver stacktraces
// del servidor, eso es soporte/infraestructura, no gestion del negocio.
erroresRouter.use(authMiddleware, requireRole("SUPERUSUARIO"));

erroresRouter.get("/", erroresController.listar);
