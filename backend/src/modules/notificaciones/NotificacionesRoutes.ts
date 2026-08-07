import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { notificacionesController } from "./notificaciones.controller";

export const notificacionesRouter = Router();

notificacionesRouter.use(authMiddleware);

notificacionesRouter.get("/", notificacionesController.listar);
notificacionesRouter.get("/no-leidas", notificacionesController.contarNoLeidas);
notificacionesRouter.patch("/:id/leida", notificacionesController.marcarLeida);
