import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { usuariosController } from "./UsuariosController";

export const usuariosRouter = Router();

usuariosRouter.use(authMiddleware, requireRole("ADMIN"));

usuariosRouter.get("/", usuariosController.listar);
// Registro de usuarios: solo ADMIN puede crear cuentas (requisito de negocio).
usuariosRouter.post("/", usuariosController.crear);
