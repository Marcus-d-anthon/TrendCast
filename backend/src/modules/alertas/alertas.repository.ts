import { obtenerEmpresaId } from "../../lib/empresa";
import { prisma } from "../../lib/prisma";
import type { TipoAlerta } from "../../generated/prisma/enums";

export const alertasRepository = {
  async listarProductosConStockTotal() {
    const productos = await prisma.producto.findMany({
      where: { deletedAt: null, activo: true },
      include: { categoria: true, stocks: true },
      orderBy: { nombre: "asc" },
    });

    // La cantidad se suma entre todos los almacenes (vision agregada a nivel
    // de empresa, no por almacen individual).
    return productos.map((producto) => ({
      ...producto,
      stockTotal: producto.stocks.reduce((suma, s) => suma + s.cantidad, 0),
    }));
  },

  listarNoResueltas() {
    return prisma.alerta.findMany({ where: { resuelta: false }, orderBy: { fecha: "desc" } });
  },

  buscarPorId(id: string) {
    return prisma.alerta.findUnique({ where: { id } });
  },

  buscarNoResueltaPorEntidad(tipo: TipoAlerta, entidad: string, registroId: string) {
    return prisma.alerta.findFirst({ where: { tipo, entidad, registroId, resuelta: false } });
  },

  // Idempotente: si ya existe una alerta sin resolver para el mismo
  // (tipo, entidad, registroId), no crea una duplicada. Devuelve tambien si
  // fue realmente nueva, para que el servicio solo dispare notificaciones
  // la primera vez (no en cada sincronizacion mientras la condicion persiste).
  async crearSiNoExiste(
    tipo: TipoAlerta,
    entidad: string,
    registroId: string,
    mensaje: string
  ): Promise<{ alerta: Awaited<ReturnType<typeof prisma.alerta.create>>; esNueva: boolean }> {
    const existente = await this.buscarNoResueltaPorEntidad(tipo, entidad, registroId);
    if (existente) {
      return { alerta: existente, esNueva: false };
    }
    const empresaId = await obtenerEmpresaId();
    const alerta = await prisma.alerta.create({ data: { tipo, entidad, registroId, mensaje, empresaId } });
    return { alerta, esNueva: true };
  },

  async resolverPorEntidadYTipo(tipo: TipoAlerta, entidad: string, registroId: string): Promise<void> {
    await prisma.alerta.updateMany({
      where: { tipo, entidad, registroId, resuelta: false },
      data: { resuelta: true, resueltaEn: new Date() },
    });
  },

  resolverPorId(id: string) {
    return prisma.alerta.update({ where: { id }, data: { resuelta: true, resueltaEn: new Date() } });
  },
};
