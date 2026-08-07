import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { productosController } from "./ProductosController";

export const productosRouter = Router();

productosRouter.use(authMiddleware);

productosRouter.get("/", productosController.listar);
productosRouter.get("/exportar", productosController.exportar);
productosRouter.post("/importar", requireRole("ADMIN", "SUPERVISOR"), productosController.importarMasivo);
productosRouter.get("/:id", productosController.obtener);
productosRouter.post("/", requireRole("ADMIN", "SUPERVISOR"), productosController.crear);
productosRouter.put("/:id", requireRole("ADMIN", "SUPERVISOR"), productosController.actualizar);
productosRouter.delete("/:id", requireRole("ADMIN", "SUPERVISOR"), productosController.eliminar);
