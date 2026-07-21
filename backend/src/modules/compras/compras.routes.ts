import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";
import { comprasController } from "./compras.controller";

export const comprasRouter = Router();

comprasRouter.use(authMiddleware);

comprasRouter.get("/", requirePermission("compras.ver"), comprasController.listar);
comprasRouter.get("/:id", requirePermission("compras.ver"), comprasController.obtener);
comprasRouter.post("/", requirePermission("compras.crear"), comprasController.crear);
comprasRouter.post("/:id/confirmar", requirePermission("compras.editar"), comprasController.confirmar);
comprasRouter.post("/:id/anular", requirePermission("compras.editar"), comprasController.anular);
