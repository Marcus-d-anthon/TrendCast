import { enviarCorreo } from "../../lib/mailer";
import { NotFoundError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { notificacionesRepository } from "../notificaciones/NotificacionesRepository";
import { alertasRepository } from "./AlertasRepository";

// Una alerta POR_VENCER se genera cuando a un lote le quedan 30 dias o menos
// para su fecha de vencimiento.
const DIAS_ALERTA_VENCIMIENTO = 30;

interface ProductoParaEvaluar {
  id: string;
  nombre: string;
  stockMinimo: number;
  stockTotal: number;
}

// Toda alerta genuinamente nueva se notifica a ADMIN y SUPERVISOR: una
// notificacion interna (siempre) y, si hay SMTP configurado, un correo real
// (best-effort -- ver src/lib/mailer.ts). No se notifica en sincronizaciones
// repetidas mientras la misma condicion sigue abierta.
async function notificarAlertaNueva(titulo: string, mensaje: string): Promise<void> {
  const destinatarios = await prisma.usuario.findMany({
    where: { rol: { in: ["ADMIN", "SUPERVISOR"] }, activo: true, deletedAt: null },
  });

  for (const usuario of destinatarios) {
    await notificacionesRepository.crear(usuario.id, titulo, mensaje, "SISTEMA");
    await enviarCorreo({ to: usuario.email, subject: `SGI: ${titulo}`, html: `<p>${mensaje}</p>` });
  }
}

// Compartida entre la sincronizacion completa (sincronizarStock) y la
// evaluacion puntual tras un evento concreto (evaluarProducto, llamada por
// ejemplo despues de confirmar una venta): un producto agotado o bajo minimo
// genera/mantiene su alerta; uno que se recupero por encima del minimo
// resuelve cualquier alerta previa de los otros dos tipos.
async function evaluarStockProducto(producto: ProductoParaEvaluar): Promise<void> {
  if (producto.stockTotal <= 0) {
    const { esNueva } = await alertasRepository.crearSiNoExiste(
      "AGOTADO",
      "Producto",
      producto.id,
      `${producto.nombre} esta agotado`
    );
    if (esNueva) {
      await notificarAlertaNueva("Producto agotado", `${producto.nombre} esta agotado`);
    }
    await alertasRepository.resolverPorEntidadYTipo("STOCK_BAJO", "Producto", producto.id);
  } else if (producto.stockTotal <= producto.stockMinimo) {
    const mensaje = `${producto.nombre} tiene ${producto.stockTotal} unidades, por debajo del minimo (${producto.stockMinimo})`;
    const { esNueva } = await alertasRepository.crearSiNoExiste("STOCK_BAJO", "Producto", producto.id, mensaje);
    if (esNueva) {
      await notificarAlertaNueva("Stock bajo el minimo", mensaje);
    }
    await alertasRepository.resolverPorEntidadYTipo("AGOTADO", "Producto", producto.id);
  } else {
    await alertasRepository.resolverPorEntidadYTipo("STOCK_BAJO", "Producto", producto.id);
    await alertasRepository.resolverPorEntidadYTipo("AGOTADO", "Producto", producto.id);
  }
}

export const alertasService = {
  // Mantiene el formato de respuesta original (ya usado por el frontend y
  // por reportes): lista de productos en o bajo su minimo. Antes se
  // calculaba solo al vuelo; ahora, ademas, sincroniza la tabla Alerta antes
  // de responder, para que quede un registro persistido y resoluble.
  async listar() {
    await this.sincronizar();

    const productos = await alertasRepository.listarProductosConStockTotal();
    return productos
      .filter((producto) => producto.stockTotal <= producto.stockMinimo)
      .map((producto) => ({
        productoId: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        categoria: producto.categoria.nombre,
        stockActual: producto.stockTotal,
        stockMinimo: producto.stockMinimo,
        unidadesFaltantes: Math.max(0, producto.stockMinimo - producto.stockTotal),
      }));
  },

  // Las 5 alertas persistidas (STOCK_BAJO, AGOTADO, POR_VENCER,
  // COMPRA_PENDIENTE, VENTA_ANULADA), no solo la vista de stock bajo.
  async listarPersistidas() {
    await this.sincronizar();
    return alertasRepository.listarNoResueltas();
  },

  async sincronizar(): Promise<void> {
    await this.sincronizarStock();
    await this.sincronizarVencimientos();
    await this.sincronizarComprasPendientes();
  },

  async sincronizarStock(): Promise<void> {
    const productos = await alertasRepository.listarProductosConStockTotal();
    for (const producto of productos) {
      await evaluarStockProducto(producto);
    }
  },

  // Evaluacion puntual de un solo producto: se llama justo despues de un
  // evento que puede cambiar su stock (confirmar una venta, por ejemplo),
  // para que la alerta quede al dia sin esperar a la siguiente sincronizacion
  // completa.
  async evaluarProducto(productoId: string): Promise<void> {
    const producto = await prisma.producto.findFirst({
      where: { id: productoId, deletedAt: null },
      include: { stocks: true },
    });
    if (!producto) {
      return;
    }
    const stockTotal = producto.stocks.reduce((suma, s) => suma + s.cantidad, 0);
    await evaluarStockProducto({ id: producto.id, nombre: producto.nombre, stockMinimo: producto.stockMinimo, stockTotal });
  },

  async sincronizarVencimientos(): Promise<void> {
    const limite = new Date();
    limite.setDate(limite.getDate() + DIAS_ALERTA_VENCIMIENTO);

    const lotes = await prisma.lote.findMany({
      where: { fechaVencimiento: { lte: limite }, cantidad: { gt: 0 } },
      include: { producto: true },
    });
    for (const lote of lotes) {
      const mensaje = `El lote ${lote.numeroLote} de ${lote.producto.nombre} vence el ${lote.fechaVencimiento.toISOString().slice(0, 10)}`;
      const { esNueva } = await alertasRepository.crearSiNoExiste("POR_VENCER", "Lote", lote.id, mensaje);
      if (esNueva) {
        await notificarAlertaNueva("Lote proximo a vencer", mensaje);
      }
    }
  },

  async sincronizarComprasPendientes(): Promise<void> {
    const pendientes = await prisma.compra.findMany({ where: { estado: "BORRADOR" } });
    for (const compra of pendientes) {
      const mensaje = `La compra ${compra.numero} sigue en borrador, pendiente de confirmar`;
      const { esNueva } = await alertasRepository.crearSiNoExiste("COMPRA_PENDIENTE", "Compra", compra.id, mensaje);
      if (esNueva) {
        await notificarAlertaNueva("Compra pendiente de confirmar", mensaje);
      }
    }

    // Una compra que ya se confirmo o anulo deja de estar pendiente: se
    // resuelve su alerta si seguia abierta.
    const activas = await prisma.alerta.findMany({ where: { tipo: "COMPRA_PENDIENTE", resuelta: false } });
    for (const alerta of activas) {
      const compra = await prisma.compra.findUnique({ where: { id: alerta.registroId } });
      if (!compra || compra.estado !== "BORRADOR") {
        await alertasRepository.resolverPorId(alerta.id);
      }
    }
  },

  // Evento, no sincronizacion: se llama explicitamente desde
  // ventas.service.anular justo cuando la venta cambia de estado.
  async generarVentaAnulada(ventaId: string, numero: string): Promise<void> {
    const mensaje = `La venta ${numero} fue anulada`;
    const { esNueva } = await alertasRepository.crearSiNoExiste("VENTA_ANULADA", "Venta", ventaId, mensaje);
    if (esNueva) {
      await notificarAlertaNueva("Venta anulada", mensaje);
    }
  },

  async resolver(id: string) {
    const alerta = await alertasRepository.buscarPorId(id);
    if (!alerta) {
      throw new NotFoundError("Alerta no encontrada");
    }
    return alertasRepository.resolverPorId(id);
  },
};
