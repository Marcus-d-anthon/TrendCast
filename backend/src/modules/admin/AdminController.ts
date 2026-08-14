import type { Request, Response } from "express";
import { adminService } from "./AdminService";

export const adminController = {
  async listarEmpresas(_req: Request, res: Response): Promise<void> {
    const empresas = await adminService.listarEmpresas();
    res.status(200).json({ data: empresas });
  },

  async listarUsuarios(_req: Request, res: Response): Promise<void> {
    const usuarios = await adminService.listarUsuarios();
    res.status(200).json({ data: usuarios });
  },
};
