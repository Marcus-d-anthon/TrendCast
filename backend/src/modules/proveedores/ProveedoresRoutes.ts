import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";
import { proveedoresController } from "./proveedores.controller";

export const proveedoresRouter = Router();

proveedoresRouter.use(authMiddleware);

proveedoresRouter.get("/", proveedoresController.listar);
proveedoresRouter.get("/:id", proveedoresController.obtener);
proveedoresRouter.post("/", requirePermission("proveedores.crear"), proveedoresController.crear);
proveedoresRouter.put("/:id", requirePermission("proveedores.editar"), proveedoresController.actualizar);
proveedoresRouter.delete("/:id", requirePermission("proveedores.eliminar"), proveedoresController.eliminar);
