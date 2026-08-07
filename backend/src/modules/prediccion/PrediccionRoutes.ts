import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import { prediccionController } from "./PrediccionController";

export const prediccionRouter = Router();

prediccionRouter.use(authMiddleware);
prediccionRouter.get("/:productoId", prediccionController.generar);
