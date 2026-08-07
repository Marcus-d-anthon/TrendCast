import type { Request, Response } from "express";
import { authService } from "./AuthService";
import { loginSchema, refrescarTokenSchema } from "./AuthValidators";

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const resultado = await authService.login(input, { ip: req.ip ?? null, userAgent: req.get("user-agent") ?? null });
    res.status(200).json({ data: resultado });
  },

  async refrescar(req: Request, res: Response): Promise<void> {
    const input = refrescarTokenSchema.parse(req.body);
    const resultado = await authService.refrescar(input.refreshToken);
    res.status(200).json({ data: resultado });
  },
};
