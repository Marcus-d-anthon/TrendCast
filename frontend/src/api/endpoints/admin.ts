import { apiRequest } from '../http-client';

export interface AdminEmpresa {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  activo: boolean;
  createdAt: string;
  _count: { usuarios: number; productos: number; almacenes: number };
}

export interface AdminUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  empresa: { id: string; razonSocial: string };
}

export const adminApi = {
  listarEmpresas: () => apiRequest<AdminEmpresa[]>('/admin/empresas'),
  listarUsuarios: () => apiRequest<AdminUsuario[]>('/admin/usuarios'),
};
