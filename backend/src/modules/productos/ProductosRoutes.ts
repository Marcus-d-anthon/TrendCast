import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/roles.middleware";
import { productosController } from "./productos.controller";

export const productosRouter = Router();

productosRouter.use(authMiddleware);

productosRouter.get("/", productosController.listar);
productosRouter.get("/:id", productosController.obtener);
productosRouter.post("/", requireRole("ADMIN", "SUPERVISOR"), productosController.crear);
productosRouter.put("/:id", requireRole("ADMIN", "SUPERVISOR"), productosController.actualizar);
productosRouter.delete("/:id", requireRole("ADMIN", "SUPERVISOR"), productosController.eliminar);
