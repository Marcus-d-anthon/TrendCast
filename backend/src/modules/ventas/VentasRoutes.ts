import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";
import { ventasController } from "./ventas.controller";

export const ventasRouter = Router();

ventasRouter.use(authMiddleware);

ventasRouter.get("/", requirePermission("ventas.ver"), ventasController.listar);
ventasRouter.get("/:id", requirePermission("ventas.ver"), ventasController.obtener);
ventasRouter.post("/", requirePermission("ventas.crear"), ventasController.crear);
ventasRouter.post("/:id/confirmar", requirePermission("ventas.editar"), ventasController.confirmar);
ventasRouter.post("/:id/anular", requirePermission("ventas.editar"), ventasController.anular);
