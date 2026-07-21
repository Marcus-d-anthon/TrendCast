import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";
import { unidadesMedidaController } from "./unidades-medida.controller";

export const unidadesMedidaRouter = Router();

unidadesMedidaRouter.use(authMiddleware);

unidadesMedidaRouter.get("/", unidadesMedidaController.listar);
unidadesMedidaRouter.get("/:id", unidadesMedidaController.obtener);
unidadesMedidaRouter.post("/", requirePermission("productos.crear"), unidadesMedidaController.crear);
unidadesMedidaRouter.put("/:id", requirePermission("productos.editar"), unidadesMedidaController.actualizar);
unidadesMedidaRouter.delete("/:id", requirePermission("productos.eliminar"), unidadesMedidaController.eliminar);
