import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { almacenesController } from "./AlmacenesController";

export const almacenesRouter = Router();

almacenesRouter.use(authMiddleware);

almacenesRouter.get("/", almacenesController.listar);
// Ruta estatica antes de "/:id" por convencion, aunque no colisiona (metodos
// distintos). Transferir stock es una operacion de inventario, no de
// administracion de almacenes: se gobierna por "inventario.crear" (el mismo
// permiso que registrar un movimiento normal), no por los permisos de
// almacenes.*.
almacenesRouter.post("/transferencias", requirePermission("inventario.crear"), almacenesController.transferir);
almacenesRouter.get("/:id", almacenesController.obtener);
almacenesRouter.post("/", requirePermission("almacenes.crear"), almacenesController.crear);
almacenesRouter.put("/:id", requirePermission("almacenes.editar"), almacenesController.actualizar);
almacenesRouter.delete("/:id", requirePermission("almacenes.eliminar"), almacenesController.eliminar);
