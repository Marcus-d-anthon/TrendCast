import { AsyncLocalStorage } from "node:async_hooks";

export interface UsuarioActual {
  // string | null (no solo string): los tests que crean usuarios llamando
  // directo a la capa de servicio (sin pasar por HTTP/AuthMiddleware, ver
  // tests/helpers/empresa-context.ts) no tienen un actor real que registrar
  // como autor de auditoria -- null preserva el mismo comportamiento que
  // tenian antes de que existiera este contexto (createdBy/usuarioId queda
  // NULL, nunca un id inventado que violaria la FK created_by).
  id: string | null;
  rol: string;
  empresaId: string;
}

const storage = new AsyncLocalStorage<UsuarioActual>();

// Propaga el usuario autenticado del request actual sin pasarlo como
// parametro por todas las capas. AuthMiddleware.ts llama runWithUsuarioActual
// al validar el JWT; las extensiones de Prisma leen getUsuarioActual() para
// saber quien esta haciendo cada mutacion.
export function runWithUsuarioActual<T>(usuario: UsuarioActual, fn: () => T): T {
  return storage.run(usuario, fn);
}

export function getUsuarioActual(): UsuarioActual | undefined {
  return storage.getStore();
}

// Fuente unica de la "empresa activa" del request: para casi todos los roles
// es simplemente su propia empresa; para SUPERUSUARIO puede ser otra si
// mando el header X-Empresa-Vista (resuelto y validado en AuthMiddleware.ts,
// nunca confiado a ciegas aqui). La usan tanto lecturas (agregar
// `where: { empresaId }`) como escrituras (reemplaza al viejo
// obtenerEmpresaId() de lib/empresa.ts, que no distinguia entre requests).
export function obtenerEmpresaActiva(): string {
  const actual = getUsuarioActual();
  if (!actual) {
    throw new Error("obtenerEmpresaActiva() llamado fuera de una request autenticada");
  }
  return actual.empresaId;
}
