import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { unidadesMedidaController } from "./UnidadesMedidaController";

export const unidadesMedidaRouter = Router();

unidadesMedidaRouter.use(authMiddleware);

unidadesMedidaRouter.get("/", unidadesMedidaController.listar);
unidadesMedidaRouter.get("/:id", unidadesMedidaController.obtener);
unidadesMedidaRouter.post("/", requirePermission("productos.crear"), unidadesMedidaController.crear);
unidadesMedidaRouter.put("/:id", requirePermission("productos.editar"), unidadesMedidaController.actualizar);
unidadesMedidaRouter.delete("/:id", requirePermission("productos.eliminar"), unidadesMedidaController.eliminar);
