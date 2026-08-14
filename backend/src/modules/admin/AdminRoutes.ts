import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { requireRole } from "../../middlewares/RolesMiddleware";
import { adminController } from "./AdminController";

export const adminRouter = Router();

// Panel del Super Admin: gateado por ROL, no por la matriz de permisos --
// ver todas las empresas no es una accion "modulo.accion" mas, es un eje
// distinto (cross-tenant) que solo tiene sentido para un unico rol.
adminRouter.use(authMiddleware, requireRole("SUPERUSUARIO"));

adminRouter.get("/empresas", adminController.listarEmpresas);
adminRouter.get("/usuarios", adminController.listarUsuarios);
