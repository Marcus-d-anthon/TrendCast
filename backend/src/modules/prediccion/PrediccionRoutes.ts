import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { prediccionController } from "./prediccion.controller";

export const prediccionRouter = Router();

prediccionRouter.use(authMiddleware);
prediccionRouter.get("/:productoId", prediccionController.generar);
