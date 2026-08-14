const EMPRESA_VISTA_KEY = 'sgi.empresaVista';

// Solo tiene efecto para SUPERUSUARIO (el backend ignora este header para
// cualquier otro rol, ver AuthMiddleware.ts) -- pero es seguro guardarlo
// para cualquier usuario, simplemente no hace nada si el rol no aplica.
export function getEmpresaVista(): string | null {
  return localStorage.getItem(EMPRESA_VISTA_KEY);
}

export function setEmpresaVista(id: string | null): void {
  if (id) {
    localStorage.setItem(EMPRESA_VISTA_KEY, id);
  } else {
    localStorage.removeItem(EMPRESA_VISTA_KEY);
  }
}

// Unico punto de cambio de empresa (Topbar y AdminPage lo comparten): guarda
// la eleccion y recarga toda la app -- ver EmpresaVistaSelect.tsx para el
// porque de la recarga en vez de invalidar cachés a mano.
export function cambiarEmpresaVista(id: string | null): void {
  setEmpresaVista(id);
  window.location.reload();
}
