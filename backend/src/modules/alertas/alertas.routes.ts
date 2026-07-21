import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { alertasController } from "./alertas.controller";

export const alertasRouter = Router();

alertasRouter.use(authMiddleware);

alertasRouter.get("/", alertasController.listar);
alertasRouter.get("/persistidas", alertasController.listarPersistidas);
alertasRouter.patch("/:id/resolver", alertasController.resolver);
