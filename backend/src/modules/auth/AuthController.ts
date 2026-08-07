import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { loginSchema, refrescarTokenSchema } from "./auth.validators";

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const resultado = await authService.login(input);
    res.status(200).json({ data: resultado });
  },

  async refrescar(req: Request, res: Response): Promise<void> {
    const input = refrescarTokenSchema.parse(req.body);
    const resultado = await authService.refrescar(input.refreshToken);
    res.status(200).json({ data: resultado });
  },
};
