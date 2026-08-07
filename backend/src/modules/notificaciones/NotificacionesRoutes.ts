import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { notificacionesController } from "./NotificacionesController";

export const notificacionesRouter = Router();

notificacionesRouter.use(authMiddleware);

notificacionesRouter.get("/", notificacionesController.listar);
notificacionesRouter.get("/no-leidas", notificacionesController.contarNoLeidas);
notificacionesRouter.patch("/:id/leida", notificacionesController.marcarLeida);
