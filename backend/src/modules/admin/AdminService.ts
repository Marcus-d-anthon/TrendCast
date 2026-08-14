import { adminRepository } from "./AdminRepository";

export const adminService = {
  listarEmpresas() {
    return adminRepository.listarEmpresas();
  },

  listarUsuarios() {
    return adminRepository.listarUsuarios();
  },
};
