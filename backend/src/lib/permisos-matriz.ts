import { prisma } from "./prisma";
import type { RolUsuario } from "../generated/prisma/enums";

// Matriz de permisos compartida entre el seed real (prisma/seed.ts) y las
// fixtures de pruebas de integracion (tests/helpers/fixtures.ts). Vivir en un
// solo lugar evita que ambos se desincronicen -- si el seed de pruebas
// tuviera su propia copia de esta matriz, un cambio aqui podria dejar las
// pruebas verificando un comportamiento que ya no es el real.
export const MODULOS_PERMISOS = [
  "inventario",
  "productos",
  "compras",
  "ventas",
  "clientes",
  "proveedores",
  "almacenes",
  "reportes",
  "usuarios",
];
export const ACCIONES_PERMISOS = ["ver", "crear", "editar", "eliminar"] as const;

// ADMIN tiene todos los permisos (se asigna aparte, no aqui); el resto se
// define explicitamente segun su funcion real en la empresa.
export const MATRIZ_PERMISOS_POR_ROL: Record<Exclude<RolUsuario, "ADMIN">, string[]> = {
  SUPERVISOR: MODULOS_PERMISOS.filter((m) => m !== "usuarios").flatMap((m) => ["ver", "crear", "editar"].map((a) => `${m}.${a}`)),
  BODEGA: ["inventario.ver", "inventario.crear", "productos.ver", "almacenes.ver", "reportes.ver"],
  VENTAS: [
    "ventas.ver",
    "ventas.crear",
    "ventas.editar",
    "clientes.ver",
    "clientes.crear",
    "clientes.editar",
    "productos.ver",
    "inventario.ver",
    "reportes.ver",
  ],
  GERENCIA: MODULOS_PERMISOS.filter((m) => m !== "usuarios").map((m) => `${m}.ver`),
};

// Lee la matriz roles_permisos ya sembrada (no MATRIZ_PERMISOS_POR_ROL
// directamente): asi el frontend siempre ve el permiso real vigente en la
// base de datos, incluso si en el futuro se edita fila por fila desde un
// panel de administracion en vez de solo por el seed.
export async function obtenerCodigosPermisoDeRol(rol: RolUsuario): Promise<string[]> {
  const filas = await prisma.rolPermiso.findMany({
    where: { rol },
    include: { permiso: true },
  });
  return filas.map((fila) => fila.permiso.codigo);
}

// Idempotente (upsert): segura de llamar tanto en un seed que corre una vez
// como en un helper de pruebas que se invoca antes de cada test.
export async function sembrarPermisos(): Promise<void> {
  const permisoIds = new Map<string, string>();

  for (const modulo of MODULOS_PERMISOS) {
    for (const accion of ACCIONES_PERMISOS) {
      const codigo = `${modulo}.${accion}`;
      const permiso = await prisma.permiso.upsert({
        where: { codigo },
        update: {},
        create: { codigo, modulo, accion, descripcion: `${accion} sobre ${modulo}` },
      });
      permisoIds.set(codigo, permiso.id);
    }
  }

  for (const permisoId of permisoIds.values()) {
    await prisma.rolPermiso.upsert({
      where: { rol_permisoId: { rol: "ADMIN", permisoId } },
      update: {},
      create: { rol: "ADMIN", permisoId },
    });
  }

  for (const [rol, codigos] of Object.entries(MATRIZ_PERMISOS_POR_ROL)) {
    for (const codigo of codigos) {
      const permisoId = permisoIds.get(codigo)!;
      await prisma.rolPermiso.upsert({
        where: { rol_permisoId: { rol: rol as RolUsuario, permisoId } },
        update: {},
        create: { rol: rol as RolUsuario, permisoId },
      });
    }
  }
}
