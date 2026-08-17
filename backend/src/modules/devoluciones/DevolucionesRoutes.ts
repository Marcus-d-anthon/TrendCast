import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { devolucionesController } from "./DevolucionesController";

export const devolucionesRouter = Router();

devolucionesRouter.use(authMiddleware);

devolucionesRouter.get("/", requirePermission("devoluciones.ver"), devolucionesController.listar);
devolucionesRouter.get("/:id", requirePermission("devoluciones.ver"), devolucionesController.obtener);
devolucionesRouter.post("/", requirePermission("devoluciones.crear"), devolucionesController.crear);
devolucionesRouter.post("/:id/confirmar", requirePermission("devoluciones.editar"), devolucionesController.confirmar);
