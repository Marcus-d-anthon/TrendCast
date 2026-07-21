import { Router } from "express";
import { limitadorAuth } from "../../middlewares/rate-limit.middleware";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", limitadorAuth, authController.login);
authRouter.post("/refresh", limitadorAuth, authController.refrescar);
