import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requirePermission } from "../../middlewares/PermissionMiddleware";
import { marcasController } from "./MarcasController";

export const marcasRouter = Router();

// Lectura: cualquier usuario autenticado (se necesita para elegir marca al
// registrar productos). Escritura: gobernada por los permisos "productos.*"
// (una marca es un sub-catalogo de producto, no amerita su propio permiso).
marcasRouter.use(authMiddleware);

marcasRouter.get("/", marcasController.listar);
marcasRouter.get("/:id", marcasController.obtener);
marcasRouter.post("/", requirePermission("productos.crear"), marcasController.crear);
marcasRouter.put("/:id", requirePermission("productos.editar"), marcasController.actualizar);
marcasRouter.delete("/:id", requirePermission("productos.eliminar"), marcasController.eliminar);
