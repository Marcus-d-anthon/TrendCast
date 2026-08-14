import { obtenerEmpresaActiva } from "../../lib/async-context";
import { prisma } from "../../lib/prisma";

// Panel ligero del Super Admin. El SUPERUSUARIO no "pertenece" a ninguna
// empresa en el sentido de negocio (es la unica cuenta cross-tenant), asi
// que se excluye de todo conteo/listado por-empresa -- aunque su fila tenga
// un empresaId real en la base (columna NOT NULL, sin migrar), tratarlo como
// parte del padron de esa empresa es exactamente la confusion que se busca
// evitar aqui.
export const adminRepository = {
  listarEmpresas() {
    return prisma.empresa.findMany({
      orderBy: { razonSocial: "asc" },
      include: {
        _count: {
          select: {
            usuarios: { where: { rol: { not: "SUPERUSUARIO" } } },
            productos: true,
            almacenes: true,
          },
        },
      },
    });
  },

  // Escopado por empresa activa: el selector de empresa del Topbar (solo
  // visible para SUPERUSUARIO) debe reflejarse aqui igual que en el resto de
  // la app -- antes esta lista ignoraba el filtro y mezclaba usuarios de
  // todas las empresas sin importar cual estuviera seleccionada.
  listarUsuarios() {
    const empresaId = obtenerEmpresaActiva();
    return prisma.usuario.findMany({
      where: { deletedAt: null, empresaId, rol: { not: "SUPERUSUARIO" } },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: { select: { id: true, razonSocial: true } },
      },
    });
  },
};
