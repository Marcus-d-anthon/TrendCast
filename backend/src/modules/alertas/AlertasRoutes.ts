import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { alertasController } from "./AlertasController";

export const alertasRouter = Router();

alertasRouter.use(authMiddleware);

alertasRouter.get("/", alertasController.listar);
alertasRouter.get("/persistidas", alertasController.listarPersistidas);
alertasRouter.patch("/:id/resolver", alertasController.resolver);
