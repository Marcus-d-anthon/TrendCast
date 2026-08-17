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
  "solicitudes",
  "devoluciones",
];
export const ACCIONES_PERMISOS = ["ver", "crear", "editar", "eliminar"] as const;

// Codigos de permiso que no encajan en el patron generico "modulo.accion" de
// ACCIONES_PERMISOS (no existe un "productos.aprobar"): se siembran a mano en
// sembrarPermisos() antes del loop que arma permisoIds, y solo se referencian
// aqui por su codigo -- el rol que los recibe se declara mas abajo en
// MATRIZ_PERMISOS_POR_ROL como cualquier otro permiso.
export const ACCIONES_PERMISOS_AD_HOC = [
  { codigo: "solicitudes.aprobar", modulo: "solicitudes", accion: "aprobar" },
  { codigo: "solicitudes.efectuar", modulo: "solicitudes", accion: "efectuar" },
] as const;

// ADMIN y SUPERUSUARIO tienen todos los permisos (se asignan aparte, no
// aqui); el resto se define explicitamente segun su funcion real en la
// empresa.
export const MATRIZ_PERMISOS_POR_ROL: Record<Exclude<RolUsuario, "ADMIN" | "SUPERUSUARIO">, string[]> = {
  SUPERVISOR: [
    ...MODULOS_PERMISOS.filter((m) => m !== "usuarios").flatMap((m) => ["ver", "crear", "editar"].map((a) => `${m}.${a}`)),
    // Supervisor efectua las solicitudes ya aprobadas por Gerencia -- ver
    // punto 2 del plan de cierre del flujo de Solicitudes.
    "solicitudes.efectuar",
  ],
  // Bodega solicita (reabastecimiento/venta especial) y Gerencia aprueba /
  // Supervisor efectua -- flujo completo ya cerrado, ver punto 2 del plan.
  // Categorias/Alertas/Prediccion siguen abiertas a nivel de API (lectura
  // para cualquier autenticado, ver CategoriasRoutes.ts) pero se ocultan
  // para este rol solo a nivel de navegacion/ruta en el frontend (ver
  // nav-items.ts, RequireRole).
  BODEGA: ["inventario.ver", "inventario.crear", "productos.ver", "almacenes.ver", "solicitudes.ver", "solicitudes.crear"],
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
    // Registrar devoluciones de sus propias ventas ya confirmadas.
    "devoluciones.ver",
    "devoluciones.crear",
  ],
  GERENCIA: [
    ...MODULOS_PERMISOS.filter((m) => m !== "usuarios").map((m) => `${m}.ver`),
    // Gerencia aprueba/rechaza las solicitudes que Bodega crea -- ver punto
    // 2 del plan de cierre del flujo de Solicitudes.
    "solicitudes.aprobar",
  ],
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

  for (const { codigo, modulo, accion } of ACCIONES_PERMISOS_AD_HOC) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo },
      update: {},
      create: { codigo, modulo, accion, descripcion: `${accion} sobre ${modulo}` },
    });
    permisoIds.set(codigo, permiso.id);
  }

  for (const permisoId of permisoIds.values()) {
    for (const rolConTodo of ["ADMIN", "SUPERUSUARIO"] as const) {
      await prisma.rolPermiso.upsert({
        where: { rol_permisoId: { rol: rolConTodo, permisoId } },
        update: {},
        create: { rol: rolConTodo, permisoId },
      });
    }
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
