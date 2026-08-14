import { Router } from "express";
import { authMiddleware } from "../../middlewares/AuthMiddleware";
import {
  limitador2faConfigurar,
  limitador2faVerificar,
  limitadorLogin,
  limitadorRefresh,
} from "../../middlewares/RateLimitMiddleware";
import { authController } from "./AuthController";

export const authRouter = Router();

authRouter.post("/login", limitadorLogin, authController.login);
authRouter.post("/refresh", limitadorRefresh, authController.refrescar);

// 2FA: requiere sesion (authMiddleware). Cada endpoint usa el limitador que
// corresponde a su superficie real (ver RateLimitMiddleware.ts) -- verificar
// codigos comparte balde con la proteccion anti-fuerza-bruta dedicada,
// configurar/desactivar usan uno mas permisivo porque no son vectores de
// adivinar.
authRouter.post("/2fa/configurar", authMiddleware, limitador2faConfigurar, authController.configurar2fa);
authRouter.post("/2fa/verificar", authMiddleware, limitador2faVerificar, authController.verificar2fa);
authRouter.post("/2fa/desactivar", authMiddleware, limitador2faConfigurar, authController.desactivar2fa);
