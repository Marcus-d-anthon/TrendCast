import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { solicitudesController } from "./SolicitudesController";

export const solicitudesRouter = Router();

solicitudesRouter.use(authMiddleware);

solicitudesRouter.get("/", requirePermission("solicitudes.ver"), solicitudesController.listar);
solicitudesRouter.post("/", requirePermission("solicitudes.crear"), solicitudesController.crear);
solicitudesRouter.patch("/:id/aprobar", requirePermission("solicitudes.aprobar"), solicitudesController.aprobar);
solicitudesRouter.patch("/:id/rechazar", requirePermission("solicitudes.aprobar"), solicitudesController.rechazar);
solicitudesRouter.patch("/:id/efectuar", requirePermission("solicitudes.efectuar"), solicitudesController.efectuar);
