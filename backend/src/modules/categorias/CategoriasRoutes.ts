import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { categoriasController } from "./CategoriasController";

export const categoriasRouter = Router();

// Lectura: cualquier usuario autenticado (los operadores necesitan ver
// categorias para registrar movimientos). Escritura: solo ADMIN/SUPERVISOR.
categoriasRouter.use(authMiddleware);

categoriasRouter.get("/", categoriasController.listar);
categoriasRouter.get("/:id", categoriasController.obtener);
categoriasRouter.post("/", requireRole("ADMIN", "SUPERVISOR"), categoriasController.crear);
categoriasRouter.put("/:id", requireRole("ADMIN", "SUPERVISOR"), categoriasController.actualizar);
categoriasRouter.delete("/:id", requireRole("ADMIN", "SUPERVISOR"), categoriasController.eliminar);
