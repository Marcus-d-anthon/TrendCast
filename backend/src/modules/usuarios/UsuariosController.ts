import type { Request, Response } from "express";
import { usuariosService } from "./UsuariosService";
import { crearUsuarioSchema } from "./UsuariosValidators";

export const usuariosController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const usuarios = await usuariosService.listar();
    res.status(200).json({ data: usuarios });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearUsuarioSchema.parse(req.body);
    const usuario = await usuariosService.crear(input);
    res.status(201).json({ data: usuario });
  },
};
