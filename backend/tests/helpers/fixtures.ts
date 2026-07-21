import { prisma } from "../../src/lib/prisma";

// Fixtures de catalogo minimas que el esquema exige hoy para crear un
// producto (empresa, almacen, marca, unidad de medida). A diferencia de una
// version anterior, NO se cachean entre llamadas: marcas/unidades_medida/
// almacenes se truncan en cada test (los tests las crean de verdad via la
// API, no solo esta fixture), asi que hay que recrearlas (upsert, barato e
// idempotente) despues de cada limpiarBaseDeDatos() para que los IDs
// devueltos sigan siendo validos contra el estado actual de la base.
//
// El sembrado de permisos/roles_permisos vive en limpiarBaseDeDatos()
// (tests/helpers/test-db.ts), no aqui: esa funcion la llaman TODOS los
// archivos de prueba, mientras que esta solo la llaman los que necesitan
// empresa/almacen/marca/unidad para crear un producto.
export interface FixturesBase {
  empresaId: string;
  almacenId: string;
  marcaId: string;
  unidadMedidaId: string;
}

export async function asegurarFixturesBase(): Promise<FixturesBase> {
  const empresa = await prisma.empresa.upsert({
    where: { ruc: "TEST-0000000001" },
    update: {},
    create: { ruc: "TEST-0000000001", razonSocial: "Empresa de Pruebas" },
  });
  const almacen = await prisma.almacen.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Almacen Principal" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Almacen Principal" },
  });
  const marca = await prisma.marca.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Marca Generica" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Marca Generica" },
  });
  const unidadMedida = await prisma.unidadMedida.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Unidad" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Unidad", abreviatura: "und" },
  });

  return { empresaId: empresa.id, almacenId: almacen.id, marcaId: marca.id, unidadMedidaId: unidadMedida.id };
}
