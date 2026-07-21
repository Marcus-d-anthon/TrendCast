import { sembrarPermisos } from "../../src/lib/permisos-matriz";
import { env } from "../../src/config/env";
import { prisma } from "../../src/lib/prisma";

// Barrera de seguridad: nunca truncar si por algun motivo el entorno de
// pruebas termino apuntando a la base de datos de desarrollo.
if (!env.DATABASE_URL.includes("sgi_test")) {
  throw new Error(
    "tests/helpers/test-db.ts solo debe usarse contra la base de datos de pruebas (sgi_test). " +
      "Verifica que NODE_ENV=test y que .env.test este configurado correctamente."
  );
}

// permisos/roles_permisos nunca se truncan (son estaticos) y se siembran UNA
// sola vez por proceso aqui mismo -- limpiarBaseDeDatos() la llama TODO
// archivo de prueba, a diferencia de asegurarFixturesBase() (solo la llaman
// los tests que necesitan empresa/almacen/marca/unidad). Sin esto, cualquier
// ruta protegida por requirePermission (incluido ADMIN) rechazaria todo:
// la tabla roles_permisos solo se siembra hoy via prisma/seed.ts, que nunca
// corre contra sgi_test.
let permisosSembrados = false;

// Solo "empresas", "permisos" y "roles_permisos" quedan fuera del TRUNCATE:
// no tienen columnas created_by/updated_by (no arrastran FK hacia usuarios)
// y ningun test los modifica, asi que son verdaderamente estaticos.
//
// Marcas/unidades_medida/almacenes/categorias SI se truncan junto con
// usuarios en el mismo TRUNCATE CASCADE: los tests las crean de verdad via
// la API (con created_by apuntando al usuario admin de ESE test), no solo
// via la fixture inicial -- dejarlas sin truncar deja filas con created_by
// huerfano que rompen el DELETE/TRUNCATE de usuarios del siguiente test.
// Por eso tests/helpers/fixtures.ts NO cachea sus IDs entre llamadas: los
// vuelve a crear (upsert) despues de cada limpieza.
export async function limpiarBaseDeDatos(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "notificaciones", "alertas", "detalle_ventas", "ventas", "detalle_compras", "compras", ' +
      '"audit_log", "movimientos_inventario", "lotes", "stock", "productos", "clientes", "proveedores", ' +
      '"refresh_tokens", "categorias", "marcas", "unidades_medida", "almacenes", "usuarios" RESTART IDENTITY CASCADE'
  );

  if (!permisosSembrados) {
    await sembrarPermisos();
    permisosSembrados = true;
  }
}
