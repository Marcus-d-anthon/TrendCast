import { runWithUsuarioActual } from "../../src/lib/async-context";
import { prisma } from "../../src/lib/prisma";

// Mismo RUC que asegurarFixturesBase() en fixtures.ts (misma empresa de
// pruebas), pero SOLO la empresa -- a proposito no se reusa
// asegurarFixturesBase() aqui, porque esa funcion tambien crea marca/
// almacen/unidad de medida como efecto secundario, y este helper se llama
// desde crearUsuarioYObtenerToken() en CADA test que pide un token (para
// cualquier rol). Crear esas filas de catalogo de mas rompia tests que
// cuentan cuantas marcas/unidades existen (ver marcas.test.ts,
// unidades-medida.test.ts) y sumaba upserts innecesarios en cada llamada.
const RUC_EMPRESA_PRUEBAS = "TEST-0000000001";

async function asegurarEmpresaDePruebas(): Promise<string> {
  const empresa = await prisma.empresa.upsert({
    where: { ruc: RUC_EMPRESA_PRUEBAS },
    update: {},
    create: { ruc: RUC_EMPRESA_PRUEBAS, razonSocial: "Empresa de Pruebas" },
  });
  return empresa.id;
}

// Los tests que crean usuarios llamando directo a la capa de servicio (sin
// pasar por HTTP/AuthMiddleware, ej. auth-helper.ts y auth.test.ts) no
// tienen el AsyncLocalStorage que AuthMiddleware.ts arma por request -- pero
// UsuariosRepository.crear ahora depende de obtenerEmpresaActiva() para
// resolver la empresa. Este helper reproduce ese contexto minimo.
export async function conEmpresaDePruebas<T>(fn: () => Promise<T>): Promise<T> {
  const empresaId = await asegurarEmpresaDePruebas();
  // id: null (no un id inventado) -- ver el comentario en UsuarioActual.
  return runWithUsuarioActual({ id: null, rol: "ADMIN", empresaId }, fn);
}
