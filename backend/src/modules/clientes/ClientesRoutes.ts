import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { clientesController } from "./ClientesController";

export const clientesRouter = Router();

// Lectura: cualquier autenticado. Escritura: gobernada por permisos
// "clientes.*" -- el rol VENTAS los tiene (crear/editar) por ser quien da de
// alta clientes en el dia a dia; "eliminar" queda reservado a ADMIN (ningun
// otro rol lo tiene en la matriz sembrada).
clientesRouter.use(authMiddleware);

clientesRouter.get("/", clientesController.listar);
clientesRouter.get("/:id", clientesController.obtener);
clientesRouter.post("/", requirePermission("clientes.crear"), clientesController.crear);
clientesRouter.put("/:id", requirePermission("clientes.editar"), clientesController.actualizar);
clientesRouter.delete("/:id", requirePermission("clientes.eliminar"), clientesController.eliminar);
