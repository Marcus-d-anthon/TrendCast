import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { sembrarPermisos } from "../src/lib/permisos-matriz";

const SALT_ROUNDS = 12;
const MESES_HISTORIA = 6;
const PASSWORD_SEED = "Seed12345!";

type Tendencia = "creciente" | "decreciente" | "estable";

interface MovimientoGenerado {
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  fecha: Date;
  saldoResultante: number;
}

// Demanda mensual base segun la tendencia del producto: sirve para que el
// modulo predictivo tenga series con pendiente distinta de cero que mostrar
// (regresion lineal creciente/decreciente) ademas de series planas (SMA).
function demandaBaseSegunTendencia(tendencia: Tendencia, indiceMes: number, totalMeses: number): number {
  const base = 20;
  const progreso = totalMeses > 1 ? indiceMes / (totalMeses - 1) : 0;

  if (tendencia === "creciente") {
    return Math.round(base * (0.6 + progreso * 0.9));
  }
  if (tendencia === "decreciente") {
    return Math.round(base * (1.5 - progreso * 0.9));
  }
  return Math.max(1, base + Math.round((Math.random() - 0.5) * 6));
}

function fechaAleatoriaEnMes(anio: number, mes: number): Date {
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const dia = 1 + Math.floor(Math.random() * diasDelMes);
  const hora = 8 + Math.floor(Math.random() * 9);
  const minuto = Math.floor(Math.random() * 60);
  return new Date(anio, mes, dia, hora, minuto);
}

// Genera un historial de ENTRADA (reabastecimiento a inicio de mes) y SALIDA
// (varias ventas repartidas en el mes) para MESES_HISTORIA meses, sin dejar
// nunca el stock negativo. Devuelve los movimientos en orden cronologico y
// el stock final resultante.
function generarHistorialProducto(tendencia: Tendencia): { movimientos: MovimientoGenerado[]; stockFinal: number } {
  const ahora = new Date();
  const movimientos: MovimientoGenerado[] = [];
  let stock = 0;

  for (let mesesAtras = MESES_HISTORIA - 1; mesesAtras >= 0; mesesAtras--) {
    const indiceMes = MESES_HISTORIA - 1 - mesesAtras;
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth() - mesesAtras;
    const fechaMes = new Date(anio, mes, 1);

    const demandaMes = demandaBaseSegunTendencia(tendencia, indiceMes, MESES_HISTORIA);

    const cantidadEntrada = Math.max(1, Math.round(demandaMes * 1.3));
    stock += cantidadEntrada;
    movimientos.push({
      tipo: "ENTRADA",
      cantidad: cantidadEntrada,
      fecha: new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 2, 9, 0),
      saldoResultante: stock,
    });

    const numSalidas = 2 + Math.floor(Math.random() * 3);
    let demandaRestante = demandaMes;
    for (let s = 0; s < numSalidas; s++) {
      const esUltima = s === numSalidas - 1;
      const partesRestantes = numSalidas - s;
      let cantidad = esUltima
        ? demandaRestante
        : Math.max(1, Math.round((demandaRestante / partesRestantes) * (0.7 + Math.random() * 0.6)));
      cantidad = Math.max(0, Math.min(cantidad, stock));
      if (cantidad <= 0) {
        continue;
      }

      stock -= cantidad;
      demandaRestante -= cantidad;
      movimientos.push({
        tipo: "SALIDA",
        cantidad,
        fecha: fechaAleatoriaEnMes(fechaMes.getFullYear(), fechaMes.getMonth()),
        saldoResultante: stock,
      });
    }
  }

  movimientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return { movimientos, stockFinal: stock };
}

async function main() {
  console.log("Sembrando datos de SGI (TIANSHI ECUADOR S.A.)...\n");

  // ── Empresa (multi-tenant listo, una sola empresa activa) ──
  const empresa = await prisma.empresa.create({
    data: { ruc: "1790000000001", razonSocial: "TIANSHI ECUADOR S.A.", nombreComercial: "TIANSHI Ecuador" },
  });

  // ── Usuarios y roles ──
  const passwordHash = await bcrypt.hash(PASSWORD_SEED, SALT_ROUNDS);

  const admin = await prisma.usuario.create({
    data: { email: "admin@tiansiecuador.com", passwordHash, nombre: "Administrador General", rol: "ADMIN", empresaId: empresa.id },
  });
  const supervisor = await prisma.usuario.create({
    data: {
      email: "supervisor@tiansiecuador.com",
      passwordHash,
      nombre: "Supervisora de Bodega",
      rol: "SUPERVISOR",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  const bodega = [
    await prisma.usuario.create({
      data: {
        email: "bodega1@tiansiecuador.com",
        passwordHash,
        nombre: "Operador de Bodega 1",
        rol: "BODEGA",
        empresaId: empresa.id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    await prisma.usuario.create({
      data: {
        email: "bodega2@tiansiecuador.com",
        passwordHash,
        nombre: "Operador de Bodega 2",
        rol: "BODEGA",
        empresaId: empresa.id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ];
  const vendedor = await prisma.usuario.create({
    data: {
      email: "ventas@tiansiecuador.com",
      passwordHash,
      nombre: "Ejecutiva de Ventas",
      rol: "VENTAS",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  const gerente = await prisma.usuario.create({
    data: {
      email: "gerencia@tiansiecuador.com",
      passwordHash,
      nombre: "Gerente General",
      rol: "GERENCIA",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`Usuarios creados (contrasena para todos: "${PASSWORD_SEED}"):`);
  console.log(`  ADMIN:      admin@tiansiecuador.com`);
  console.log(`  SUPERVISOR: supervisor@tiansiecuador.com`);
  console.log(`  BODEGA:     bodega1@tiansiecuador.com, bodega2@tiansiecuador.com`);
  console.log(`  VENTAS:     ventas@tiansiecuador.com`);
  console.log(`  GERENCIA:   gerencia@tiansiecuador.com\n`);

  // ── Permisos granulares por rol (matriz compartida con las pruebas de
  // integracion, ver src/lib/permisos-matriz.ts) ──
  await sembrarPermisos();
  console.log("Permisos sembrados: 36 permisos, matriz aplicada a los 5 roles.\n");

  // ── Catalogos ──
  const marcasData = ["Tianshi Nutrition", "Tianshi Care", "Tianshi Labs"];
  const marcas = [];
  for (const nombre of marcasData) {
    marcas.push(await prisma.marca.create({ data: { nombre, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id } }));
  }

  const unidadesData = [
    { nombre: "Unidad", abreviatura: "und" },
    { nombre: "Frasco", abreviatura: "frs" },
    { nombre: "Caja", abreviatura: "caja" },
    { nombre: "Bolsa", abreviatura: "bol" },
  ];
  const unidades: Record<string, { id: string }> = {};
  for (const data of unidadesData) {
    unidades[data.abreviatura] = await prisma.unidadMedida.create({
      data: { ...data, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
    });
  }

  const almacenPrincipal = await prisma.almacen.create({
    data: { nombre: "Bodega Principal Quito", direccion: "Av. Amazonas y Naciones Unidas, Quito", empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
  });
  const almacenGuayaquil = await prisma.almacen.create({
    data: { nombre: "Bodega Guayaquil", direccion: "Av. Francisco de Orellana, Guayaquil", empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
  });
  console.log(`Almacenes creados: ${almacenPrincipal.nombre}, ${almacenGuayaquil.nombre}\n`);

  const categoriasData = [
    { nombre: "Suplementos Nutricionales", descripcion: "Vitaminas, minerales y complementos alimenticios" },
    { nombre: "Cuidado Personal", descripcion: "Productos de higiene y cuidado corporal" },
    { nombre: "Bebidas Funcionales", descripcion: "Tes e infusiones con fines nutricionales" },
    { nombre: "Equipos y Accesorios", descripcion: "Dispositivos y accesorios para bienestar" },
  ];
  const categorias = [];
  for (const data of categoriasData) {
    categorias.push(
      await prisma.categoria.create({ data: { ...data, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id } })
    );
  }
  console.log(`Categorias creadas: ${categorias.map((c) => c.nombre).join(", ")}\n`);

  // ── Productos (precio_compra estimado como 65% del precio de venta:
  // dato ilustrativo, no un margen real medido de la empresa) ──
  const productosData: Array<{
    sku: string;
    nombre: string;
    unidad: keyof typeof unidades;
    precioVenta: number;
    stockMinimo: number;
    categoria: number;
    tendencia: Tendencia;
    requiereLote?: boolean;
  }> = [
    { sku: "TS-NUT-001", nombre: "Calcio Zinc Vitamina D", unidad: "frs", precioVenta: 28.5, stockMinimo: 15, categoria: 0, tendencia: "creciente", requiereLote: true },
    { sku: "TS-NUT-002", nombre: "Colageno Marino Hidrolizado", unidad: "frs", precioVenta: 34.9, stockMinimo: 10, categoria: 0, tendencia: "creciente" },
    { sku: "TS-NUT-003", nombre: "Omega 3 Aceite de Pescado", unidad: "frs", precioVenta: 22.0, stockMinimo: 20, categoria: 0, tendencia: "estable", requiereLote: true },
    { sku: "TS-NUT-004", nombre: "Multivitaminico Adulto", unidad: "frs", precioVenta: 19.5, stockMinimo: 25, categoria: 0, tendencia: "estable" },
    { sku: "TS-NUT-005", nombre: "Proteina Vegetal en Polvo", unidad: "bol", precioVenta: 45.0, stockMinimo: 8, categoria: 0, tendencia: "creciente" },
    { sku: "TS-CP-001", nombre: "Jabon Herbal Antibacterial", unidad: "und", precioVenta: 4.5, stockMinimo: 40, categoria: 1, tendencia: "estable" },
    { sku: "TS-CP-002", nombre: "Crema Facial Antioxidante", unidad: "und", precioVenta: 26.0, stockMinimo: 12, categoria: 1, tendencia: "decreciente" },
    { sku: "TS-CP-003", nombre: "Shampoo Herbal Fortalecedor", unidad: "und", precioVenta: 15.0, stockMinimo: 20, categoria: 1, tendencia: "estable" },
    { sku: "TS-CP-004", nombre: "Pasta Dental Herbal", unidad: "und", precioVenta: 6.0, stockMinimo: 30, categoria: 1, tendencia: "estable" },
    { sku: "TS-BEB-001", nombre: "Te Antilipidico", unidad: "caja", precioVenta: 18.0, stockMinimo: 15, categoria: 2, tendencia: "creciente" },
    { sku: "TS-BEB-002", nombre: "Te Digestivo Herbal", unidad: "caja", precioVenta: 16.5, stockMinimo: 15, categoria: 2, tendencia: "estable" },
    { sku: "TS-BEB-003", nombre: "Infusion Relajante Nocturna", unidad: "caja", precioVenta: 14.0, stockMinimo: 12, categoria: 2, tendencia: "decreciente" },
    { sku: "TS-EQ-001", nombre: "Cepillo de Masaje Corporal", unidad: "und", precioVenta: 12.0, stockMinimo: 10, categoria: 3, tendencia: "estable" },
    { sku: "TS-EQ-002", nombre: "Faja Reductora Termica", unidad: "und", precioVenta: 32.0, stockMinimo: 8, categoria: 3, tendencia: "creciente" },
    { sku: "TS-EQ-003", nombre: "Balanza Digital de Bioimpedancia", unidad: "und", precioVenta: 55.0, stockMinimo: 5, categoria: 3, tendencia: "estable" },
  ];

  const productos = [];
  for (const [indice, data] of productosData.entries()) {
    const marca = marcas[indice % marcas.length];
    const producto = await prisma.producto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        precioCompra: Math.round(data.precioVenta * 0.65 * 100) / 100,
        precioVenta: data.precioVenta,
        stockMinimo: data.stockMinimo,
        requiereLote: data.requiereLote ?? false,
        empresaId: empresa.id,
        categoriaId: categorias[data.categoria].id,
        marcaId: marca.id,
        unidadMedidaId: unidades[data.unidad].id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });
    productos.push(producto);

    // Fila de stock en ambos almacenes (Guayaquil arranca en 0, se llena solo
    // via la transferencia de ejemplo mas abajo para un producto puntual).
    await prisma.stock.create({ data: { productoId: producto.id, almacenId: almacenPrincipal.id, cantidad: 0, createdBy: admin.id, updatedBy: admin.id } });
    await prisma.stock.create({ data: { productoId: producto.id, almacenId: almacenGuayaquil.id, cantidad: 0, createdBy: admin.id, updatedBy: admin.id } });

    const { movimientos, stockFinal } = generarHistorialProducto(data.tendencia);

    const movimientosCreados = [];
    for (const mov of movimientos) {
      const usuario = bodega[Math.floor(Math.random() * bodega.length)];
      const creado = await prisma.movimientoInventario.create({
        data: {
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          saldoResultante: mov.saldoResultante,
          referencia: mov.tipo === "ENTRADA" ? "Reabastecimiento programado" : "Venta a distribuidor",
          productoId: producto.id,
          almacenId: almacenPrincipal.id,
          usuarioId: usuario.id,
          fecha: mov.fecha,
        },
      });
      movimientosCreados.push(creado);
    }

    // Ejemplo ilustrativo del tercer tipo de movimiento (AJUSTE) sobre el
    // primer producto: demuestra la correccion via nueva fila que referencia
    // al movimiento original, sin editar ni borrar nada del libro.
    if (indice === 0) {
      const primeraEntrada = movimientosCreados.find((m) => m.tipo === "ENTRADA");
      if (primeraEntrada) {
        await prisma.movimientoInventario.create({
          data: {
            tipo: "AJUSTE",
            cantidad: Math.max(1, primeraEntrada.saldoResultante - 2),
            saldoResultante: Math.max(1, primeraEntrada.saldoResultante - 2),
            motivo: "Correccion por conteo fisico: se contaron 2 unidades menos de lo registrado",
            movimientoOrigenId: primeraEntrada.id,
            productoId: producto.id,
            almacenId: almacenPrincipal.id,
            usuarioId: supervisor.id,
            fecha: new Date(primeraEntrada.fecha.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    await prisma.stock.update({
      where: { productoId_almacenId: { productoId: producto.id, almacenId: almacenPrincipal.id } },
      data: { cantidad: stockFinal },
    });

    console.log(
      `  ${data.sku} (${data.nombre}): ${movimientosCreados.length} movimientos, ${MESES_HISTORIA} meses, stock final ${stockFinal} en ${almacenPrincipal.nombre} (minimo ${data.stockMinimo})`
    );
  }
  console.log();

  // ── Ejemplo de TRANSFERENCIA entre almacenes ──
  const productoTransferido = productos[2]; // Omega 3 (requiere lote)
  const stockOrigenAntes = await prisma.stock.findUniqueOrThrow({
    where: { productoId_almacenId: { productoId: productoTransferido.id, almacenId: almacenPrincipal.id } },
  });
  const cantidadTransferida = Math.min(10, stockOrigenAntes.cantidad);
  if (cantidadTransferida > 0) {
    const salidaOrigen = await prisma.movimientoInventario.create({
      data: {
        tipo: "TRANSFERENCIA",
        cantidad: cantidadTransferida,
        saldoResultante: stockOrigenAntes.cantidad - cantidadTransferida,
        motivo: `Transferencia a ${almacenGuayaquil.nombre}`,
        productoId: productoTransferido.id,
        almacenId: almacenPrincipal.id,
        usuarioId: supervisor.id,
      },
    });
    await prisma.movimientoInventario.create({
      data: {
        tipo: "TRANSFERENCIA",
        cantidad: cantidadTransferida,
        saldoResultante: cantidadTransferida,
        motivo: `Transferencia recibida desde ${almacenPrincipal.nombre}`,
        movimientoOrigenId: salidaOrigen.id,
        productoId: productoTransferido.id,
        almacenId: almacenGuayaquil.id,
        usuarioId: supervisor.id,
      },
    });
    await prisma.stock.update({
      where: { productoId_almacenId: { productoId: productoTransferido.id, almacenId: almacenPrincipal.id } },
      data: { cantidad: stockOrigenAntes.cantidad - cantidadTransferida },
    });
    await prisma.stock.update({
      where: { productoId_almacenId: { productoId: productoTransferido.id, almacenId: almacenGuayaquil.id } },
      data: { cantidad: cantidadTransferida },
    });
    console.log(`Transferencia de ejemplo: ${cantidadTransferida}u de ${productoTransferido.sku} de ${almacenPrincipal.nombre} a ${almacenGuayaquil.nombre}\n`);
  }

  // ── Lotes (solo productos con requiere_lote = true) ──
  const productosConLote = productos.filter((_p, i) => productosData[i].requiereLote);
  const hoy = new Date();
  await prisma.lote.create({
    data: {
      productoId: productosConLote[0].id,
      almacenId: almacenPrincipal.id,
      numeroLote: "L-2026-014",
      fechaVencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()), // vence en ~1 mes
      cantidad: 12,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  await prisma.lote.create({
    data: {
      productoId: productosConLote[1].id,
      almacenId: almacenPrincipal.id,
      numeroLote: "L-2026-031",
      fechaVencimiento: new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate()), // vence en ~1 anio
      cantidad: 25,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log("Lotes de ejemplo creados (uno proximo a vencer, uno con vigencia amplia).\n");

  // ── Proveedores ──
  const proveedoresData = [
    { razonSocial: "Distribuidora Andina Wellness S.A.", numeroDocumento: "1790111111001", email: "ventas@andinawellness.ec", telefono: "022345678" },
    { razonSocial: "Importadora Salud Natural Cia. Ltda.", numeroDocumento: "1790222222001", email: "contacto@saludnatural.ec", telefono: "042345678" },
  ];
  const proveedores = [];
  for (const data of proveedoresData) {
    proveedores.push(
      await prisma.proveedor.create({
        data: { ...data, tipoDocumento: "RUC", empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
      })
    );
  }

  // ── Clientes ──
  const clientesData = [
    { nombre: "Farmacia Cruz del Sur", tipoDocumento: "RUC" as const, numeroDocumento: "1790333333001", email: "compras@cruzdelsur.ec" },
    { nombre: "Maria Fernanda Lopez", tipoDocumento: "CEDULA" as const, numeroDocumento: "1712345678", email: "mflopez@example.com" },
    { nombre: "Bienestar Total Distribuciones", tipoDocumento: "RUC" as const, numeroDocumento: "1790444444001", email: "pedidos@bienestartotal.ec" },
  ];
  const clientes = [];
  for (const data of clientesData) {
    clientes.push(await prisma.cliente.create({ data: { ...data, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id } }));
  }
  console.log(`Proveedores y clientes de ejemplo creados.\n`);

  // ── Compra confirmada: genera movimientos ENTRADA reales ligados a compra_id ──
  const productosCompra = [productos[3], productos[4]]; // Multivitaminico, Proteina Vegetal
  const cantidadesCompra = [30, 20];
  let subtotalCompra = 0;
  const detalleCompraData = productosCompra.map((p, i) => {
    const cantidad = cantidadesCompra[i];
    const precioUnitario = Number(p.precioCompra);
    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
    subtotalCompra += subtotal;
    return { productoId: p.id, cantidad, precioUnitario, subtotal };
  });
  const impuestoCompra = Math.round(subtotalCompra * 0.15 * 100) / 100;
  const compraConfirmada = await prisma.compra.create({
    data: {
      numero: "COM-2026-0001",
      estado: "CONFIRMADA",
      empresaId: empresa.id,
      proveedorId: proveedores[0].id,
      almacenId: almacenPrincipal.id,
      usuarioId: supervisor.id,
      subtotal: subtotalCompra,
      impuesto: impuestoCompra,
      total: subtotalCompra + impuestoCompra,
      detalle: { create: detalleCompraData },
    },
  });
  for (const linea of detalleCompraData) {
    const stockActual = await prisma.stock.findUniqueOrThrow({
      where: { productoId_almacenId: { productoId: linea.productoId, almacenId: almacenPrincipal.id } },
    });
    const saldoResultante = stockActual.cantidad + linea.cantidad;
    await prisma.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        cantidad: linea.cantidad,
        saldoResultante,
        referencia: compraConfirmada.numero,
        motivo: "Recepcion de compra confirmada",
        productoId: linea.productoId,
        almacenId: almacenPrincipal.id,
        usuarioId: supervisor.id,
        compraId: compraConfirmada.id,
      },
    });
    await prisma.stock.update({
      where: { productoId_almacenId: { productoId: linea.productoId, almacenId: almacenPrincipal.id } },
      data: { cantidad: saldoResultante },
    });
  }
  console.log(`Compra confirmada de ejemplo: ${compraConfirmada.numero} (${detalleCompraData.length} lineas, genero movimientos ENTRADA reales)\n`);

  // Compra en BORRADOR (para la alerta COMPRA_PENDIENTE)
  const compraBorrador = await prisma.compra.create({
    data: {
      numero: "COM-2026-0002",
      estado: "BORRADOR",
      empresaId: empresa.id,
      proveedorId: proveedores[1].id,
      almacenId: almacenPrincipal.id,
      usuarioId: supervisor.id,
      subtotal: 150,
      impuesto: 22.5,
      total: 172.5,
      detalle: { create: [{ productoId: productos[6].id, cantidad: 25, precioUnitario: 6, subtotal: 150 }] },
    },
  });

  // ── Venta confirmada: genera movimientos SALIDA reales, empuja Jabon
  // Herbal Antibacterial (bajo stock por diseno del historial original)
  // por debajo del minimo para que la alerta STOCK_BAJO sea real ──
  const productoJabon = productos[5]; // TS-CP-001
  const stockJabonAntes = await prisma.stock.findUniqueOrThrow({
    where: { productoId_almacenId: { productoId: productoJabon.id, almacenId: almacenPrincipal.id } },
  });
  const cantidadVentaJabon = Math.max(1, Math.min(5, stockJabonAntes.cantidad));
  const precioVentaJabon = Number(productoJabon.precioVenta);
  const subtotalVenta = Math.round(cantidadVentaJabon * precioVentaJabon * 100) / 100;
  const impuestoVenta = Math.round(subtotalVenta * 0.15 * 100) / 100;
  const ventaConfirmada = await prisma.venta.create({
    data: {
      numero: "VEN-2026-0001",
      estado: "CONFIRMADA",
      empresaId: empresa.id,
      clienteId: clientes[0].id,
      almacenId: almacenPrincipal.id,
      usuarioId: vendedor.id,
      subtotal: subtotalVenta,
      impuesto: impuestoVenta,
      total: subtotalVenta + impuestoVenta,
      detalle: { create: [{ productoId: productoJabon.id, cantidad: cantidadVentaJabon, precioUnitario: precioVentaJabon, subtotal: subtotalVenta }] },
    },
  });
  const saldoTrasVenta = stockJabonAntes.cantidad - cantidadVentaJabon;
  await prisma.movimientoInventario.create({
    data: {
      tipo: "SALIDA",
      cantidad: cantidadVentaJabon,
      saldoResultante: saldoTrasVenta,
      referencia: ventaConfirmada.numero,
      motivo: "Despacho de venta confirmada",
      productoId: productoJabon.id,
      almacenId: almacenPrincipal.id,
      usuarioId: vendedor.id,
      ventaId: ventaConfirmada.id,
    },
  });
  await prisma.stock.update({
    where: { productoId_almacenId: { productoId: productoJabon.id, almacenId: almacenPrincipal.id } },
    data: { cantidad: saldoTrasVenta },
  });
  console.log(`Venta confirmada de ejemplo: ${ventaConfirmada.numero} (genero movimiento SALIDA real, saldo resultante ${saldoTrasVenta})\n`);

  // Venta ANULADA (para la alerta VENTA_ANULADA) -- no genera movimientos,
  // igual que una venta anulada antes de confirmarse en el sistema real.
  const ventaAnulada = await prisma.venta.create({
    data: {
      numero: "VEN-2026-0002",
      estado: "ANULADA",
      empresaId: empresa.id,
      clienteId: clientes[1].id,
      almacenId: almacenPrincipal.id,
      usuarioId: vendedor.id,
      subtotal: 45,
      impuesto: 6.75,
      total: 51.75,
      detalle: { create: [{ productoId: productos[9].id, cantidad: 3, precioUnitario: 15, subtotal: 45 }] },
    },
  });

  // ── Alertas persistidas ──
  const stocksFinales = await prisma.stock.findMany({ where: { almacenId: almacenPrincipal.id }, include: { producto: true } });
  let alertasCreadas = 0;
  for (const stock of stocksFinales) {
    if (stock.cantidad <= 0) {
      await prisma.alerta.create({
        data: {
          tipo: "AGOTADO",
          entidad: "Producto",
          registroId: stock.productoId,
          mensaje: `${stock.producto.nombre} esta agotado en ${almacenPrincipal.nombre}`,
          empresaId: empresa.id,
        },
      });
      alertasCreadas++;
    } else if (stock.cantidad <= stock.producto.stockMinimo) {
      await prisma.alerta.create({
        data: {
          tipo: "STOCK_BAJO",
          entidad: "Producto",
          registroId: stock.productoId,
          mensaje: `${stock.producto.nombre} tiene ${stock.cantidad} unidades, por debajo del minimo (${stock.producto.stockMinimo})`,
          empresaId: empresa.id,
        },
      });
      alertasCreadas++;
    }
  }

  const loteProximoAVencer = await prisma.lote.findFirstOrThrow({ where: { productoId: productosConLote[0].id } });
  await prisma.alerta.create({
    data: {
      tipo: "POR_VENCER",
      entidad: "Lote",
      registroId: loteProximoAVencer.id,
      mensaje: `El lote ${loteProximoAVencer.numeroLote} de ${productosConLote[0].nombre} vence el ${loteProximoAVencer.fechaVencimiento.toISOString().slice(0, 10)}`,
      empresaId: empresa.id,
    },
  });
  await prisma.alerta.create({
    data: {
      tipo: "COMPRA_PENDIENTE",
      entidad: "Compra",
      registroId: compraBorrador.id,
      mensaje: `La compra ${compraBorrador.numero} sigue en borrador, pendiente de confirmar`,
      empresaId: empresa.id,
    },
  });
  await prisma.alerta.create({
    data: {
      tipo: "VENTA_ANULADA",
      entidad: "Venta",
      registroId: ventaAnulada.id,
      mensaje: `La venta ${ventaAnulada.numero} fue anulada`,
      empresaId: empresa.id,
    },
  });
  console.log(`Alertas persistidas: ${alertasCreadas} de stock + 3 de ejemplo (vencimiento, compra pendiente, venta anulada)\n`);

  // ── Notificaciones internas ──
  await prisma.notificacion.create({
    data: { usuarioId: admin.id, titulo: "Compra pendiente de confirmar", mensaje: `${compraBorrador.numero} espera confirmacion`, canal: "SISTEMA" },
  });
  await prisma.notificacion.create({
    data: { usuarioId: gerente.id, titulo: "Producto agotandose", mensaje: `${productoJabon.nombre} esta por debajo del stock minimo`, canal: "SISTEMA" },
  });
  console.log("Notificaciones internas de ejemplo creadas.\n");

  console.log("Seed completado.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
