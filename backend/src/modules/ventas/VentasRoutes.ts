import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { ventasController } from "./VentasController";

export const ventasRouter = Router();

ventasRouter.use(authMiddleware);

ventasRouter.get("/", requirePermission("ventas.ver"), ventasController.listar);
ventasRouter.get("/:id", requirePermission("ventas.ver"), ventasController.obtener);
ventasRouter.post("/", requirePermission("ventas.crear"), ventasController.crear);
ventasRouter.post("/:id/confirmar", requirePermission("ventas.editar"), ventasController.confirmar);
ventasRouter.post("/:id/anular", requirePermission("ventas.editar"), ventasController.anular);
