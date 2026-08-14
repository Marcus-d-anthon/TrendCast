import type { Request, Response } from "express";
import { authService } from "./AuthService";
import { desactivar2faSchema, loginSchema, refrescarTokenSchema, verificar2faSchema } from "./AuthValidators";

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

  async configurar2fa(req: Request, res: Response): Promise<void> {
    const resultado = await authService.configurar2fa(req.usuario!.id);
    res.status(200).json({ data: resultado });
  },

  async verificar2fa(req: Request, res: Response): Promise<void> {
    const { codigo } = verificar2faSchema.parse(req.body);
    const resultado = await authService.verificar2fa(req.usuario!.id, codigo);
    res.status(200).json({ data: resultado });
  },

  async desactivar2fa(req: Request, res: Response): Promise<void> {
    const { password } = desactivar2faSchema.parse(req.body);
    await authService.desactivar2fa(req.usuario!.id, password);
    res.status(204).send();
  },
};
