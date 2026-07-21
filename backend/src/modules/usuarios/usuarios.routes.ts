import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/roles.middleware";
import { usuariosController } from "./usuarios.controller";

export const usuariosRouter = Router();

usuariosRouter.use(authMiddleware, requireRole("ADMIN"));

usuariosRouter.get("/", usuariosController.listar);
// Registro de usuarios: solo ADMIN puede crear cuentas (requisito de negocio).
usuariosRouter.post("/", usuariosController.crear);
