import { Router } from "express";
import { limitadorAuth } from "../../middlewares/RateLimitMiddleware";
import { authController } from "./AuthController";

export const authRouter = Router();

authRouter.post("/login", limitadorAuth, authController.login);
authRouter.post("/refresh", limitadorAuth, authController.refrescar);
