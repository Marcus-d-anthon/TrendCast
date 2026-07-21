import { AsyncLocalStorage } from "node:async_hooks";

export interface UsuarioActual {
  id: string;
  rol: string;
}

const storage = new AsyncLocalStorage<UsuarioActual>();

// Propaga el usuario autenticado del request actual sin pasarlo como
// parametro por todas las capas. auth.middleware.ts llama runWithUsuarioActual
// al validar el JWT; las extensiones de Prisma leen getUsuarioActual() para
// saber quien esta haciendo cada mutacion.
export function runWithUsuarioActual<T>(usuario: UsuarioActual, fn: () => T): T {
  return storage.run(usuario, fn);
}

export function getUsuarioActual(): UsuarioActual | undefined {
  return storage.getStore();
}
