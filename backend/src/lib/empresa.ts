import { prisma } from "./prisma";

// El sistema esta preparado para multi-tenant (empresa_id en las tablas de
// negocio) pero hoy opera con una unica empresa activa: no existe flujo de
// alta de nuevas empresas ni seleccion de tenant. Este helper resuelve esa
// empresa una sola vez y la cachea en memoria del proceso.
let empresaIdCache: string | null = null;

export async function obtenerEmpresaId(): Promise<string> {
  if (empresaIdCache) {
    return empresaIdCache;
  }
  const empresa = await prisma.empresa.findFirstOrThrow({ where: { activo: true }, orderBy: { createdAt: "asc" } });
  empresaIdCache = empresa.id;
  return empresaIdCache;
}
