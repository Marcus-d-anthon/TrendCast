import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

// Segunda empresa, deliberadamente ficticia y de un rubro distinto al de
// Tianshi (nutricion/salud) -- una distribuidora de tecnologia -- para que
// el contraste sea obvio de un vistazo al usar el selector de empresa del
// Super Admin (ver plan "Multi-tenant real para el Super Admin"). Se corre
// UNA VEZ, a mano, solo contra sgi_dev: `npx tsx scripts/seed-empresa-demo.ts`.
// Idempotente por RUC: si la empresa ya existe, no duplica nada.

const RUC_DEMO = "1791234567001";
const PASSWORD_SEED = "Seed12345!";
const SALT_ROUNDS = 12;
const MESES_HISTORIA = 4;

interface MovimientoGenerado {
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  fecha: Date;
  saldoResultante: number;
}

// Version condensada del generador de tendencias de prisma/seed.ts: alcanza
// con un historial simple (entrada mensual + un par de salidas) y, para un
// producto puntual, forzar el saldo final por debajo de su stock minimo
// para que Alertas tenga algo real que mostrar.
function generarHistorial(bajoMinimo: boolean, stockMinimo: number): { movimientos: MovimientoGenerado[]; stockFinal: number } {
  const ahora = new Date();
  const movimientos: MovimientoGenerado[] = [];
  let stock = 0;

  for (let mesesAtras = MESES_HISTORIA - 1; mesesAtras >= 0; mesesAtras--) {
    const fechaMes = new Date(ahora.getFullYear(), ahora.getMonth() - mesesAtras, 1);

    const entrada = 20 + Math.floor(Math.random() * 15);
    stock += entrada;
    movimientos.push({
      tipo: "ENTRADA",
      cantidad: entrada,
      fecha: new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 3, 9, 0),
      saldoResultante: stock,
    });

    const numSalidas = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < numSalidas; s++) {
      const cantidad = Math.min(stock, 3 + Math.floor(Math.random() * 6));
      if (cantidad <= 0) continue;
      stock -= cantidad;
      const dia = 5 + Math.floor(Math.random() * 20);
      movimientos.push({
        tipo: "SALIDA",
        cantidad,
        fecha: new Date(fechaMes.getFullYear(), fechaMes.getMonth(), dia, 10 + s, 30),
        saldoResultante: stock,
      });
    }
  }

  if (bajoMinimo) {
    const objetivo = Math.max(0, stockMinimo - 2);
    const exceso = stock - objetivo;
    if (exceso > 0) {
      stock -= exceso;
      movimientos.push({ tipo: "SALIDA", cantidad: exceso, fecha: new Date(), saldoResultante: stock });
    }
  }

  movimientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return { movimientos, stockFinal: stock };
}

async function main() {
  const existente = await prisma.empresa.findUnique({ where: { ruc: RUC_DEMO } });
  if (existente) {
    console.log(`Ya existe una empresa demo con RUC ${RUC_DEMO} (${existente.razonSocial}) -- nada que hacer.`);
    return;
  }

  console.log("Sembrando empresa demo (ANDINA TECH DISTRIBUCIONES S.A.)...\n");

  const empresa = await prisma.empresa.create({
    data: { ruc: RUC_DEMO, razonSocial: "ANDINA TECH DISTRIBUCIONES S.A.", nombreComercial: "Andina Tech" },
  });

  const passwordHash = await bcrypt.hash(PASSWORD_SEED, SALT_ROUNDS);

  const admin = await prisma.usuario.create({
    data: { email: "admin@andinatech.com", passwordHash, nombre: "Administradora Andina Tech", rol: "ADMIN", empresaId: empresa.id },
  });
  const vendedor = await prisma.usuario.create({
    data: {
      email: "ventas@andinatech.com",
      passwordHash,
      nombre: "Ejecutivo de Ventas Andina Tech",
      rol: "VENTAS",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`Usuarios creados (contrasena "${PASSWORD_SEED}"): ${admin.email}, ${vendedor.email}\n`);

  const marcasData = ["Andina Tech Pro", "Andina Tech Basic"];
  const marcas = [];
  for (const nombre of marcasData) {
    marcas.push(await prisma.marca.create({ data: { nombre, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id } }));
  }

  const unidadesData = [
    { nombre: "Unidad", abreviatura: "und" },
    { nombre: "Caja", abreviatura: "caja" },
  ];
  const unidades: Record<string, { id: string }> = {};
  for (const data of unidadesData) {
    unidades[data.abreviatura] = await prisma.unidadMedida.create({
      data: { ...data, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
    });
  }

  const almacen = await prisma.almacen.create({
    data: { nombre: "Bodega Central Quito", direccion: "Av. Eloy Alfaro y Amazonas, Quito", empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id },
  });

  const categoriasData = [
    { nombre: "Componentes de PC", descripcion: "Procesadores, memorias, tarjetas madre y almacenamiento" },
    { nombre: "Periféricos", descripcion: "Teclados, mouse, monitores y accesorios de escritorio" },
    { nombre: "Redes y Conectividad", descripcion: "Routers, switches y equipos de red" },
  ];
  const categorias = [];
  for (const data of categoriasData) {
    categorias.push(await prisma.categoria.create({ data: { ...data, empresaId: empresa.id, createdBy: admin.id, updatedBy: admin.id } }));
  }
  console.log(`Categorias creadas: ${categorias.map((c) => c.nombre).join(", ")}\n`);

  const productosData: Array<{
    sku: string;
    nombre: string;
    unidad: keyof typeof unidades;
    precioVenta: number;
    stockMinimo: number;
    categoria: number;
    bajoMinimo?: boolean;
  }> = [
    { sku: "AT-CPU-001", nombre: "Procesador Ryzen 5 8-Core", unidad: "und", precioVenta: 285.0, stockMinimo: 5, categoria: 0 },
    { sku: "AT-RAM-001", nombre: "Memoria RAM DDR5 16GB", unidad: "und", precioVenta: 68.0, stockMinimo: 15, categoria: 0 },
    { sku: "AT-SSD-001", nombre: "SSD NVMe 1TB", unidad: "und", precioVenta: 74.5, stockMinimo: 10, categoria: 0, bajoMinimo: true },
    { sku: "AT-MB-001", nombre: "Tarjeta Madre ATX AM5", unidad: "und", precioVenta: 145.0, stockMinimo: 6, categoria: 0 },
    { sku: "AT-PER-001", nombre: "Teclado Mecánico RGB", unidad: "und", precioVenta: 42.0, stockMinimo: 12, categoria: 1 },
    { sku: "AT-PER-002", nombre: "Monitor 27\" 144Hz", unidad: "und", precioVenta: 210.0, stockMinimo: 6, categoria: 1 },
    { sku: "AT-RED-001", nombre: "Router WiFi 6 Dual Band", unidad: "caja", precioVenta: 95.0, stockMinimo: 8, categoria: 2 },
    { sku: "AT-RED-002", nombre: "Switch 8 Puertos Gigabit", unidad: "caja", precioVenta: 38.0, stockMinimo: 10, categoria: 2, bajoMinimo: true },
  ];

  const productos = [];
  for (const [indice, data] of productosData.entries()) {
    const marca = marcas[indice % marcas.length];
    const producto = await prisma.producto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        precioCompra: Math.round(data.precioVenta * 0.7 * 100) / 100,
        precioVenta: data.precioVenta,
        stockMinimo: data.stockMinimo,
        empresaId: empresa.id,
        categoriaId: categorias[data.categoria].id,
        marcaId: marca.id,
        unidadMedidaId: unidades[data.unidad].id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });
    productos.push(producto);

    await prisma.stock.create({ data: { productoId: producto.id, almacenId: almacen.id, cantidad: 0, createdBy: admin.id, updatedBy: admin.id } });

    const { movimientos, stockFinal } = generarHistorial(data.bajoMinimo ?? false, data.stockMinimo);
    for (const mov of movimientos) {
      await prisma.movimientoInventario.create({
        data: {
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          saldoResultante: mov.saldoResultante,
          referencia: mov.tipo === "ENTRADA" ? "Reabastecimiento programado" : "Venta a distribuidor",
          productoId: producto.id,
          almacenId: almacen.id,
          usuarioId: vendedor.id,
          fecha: mov.fecha,
        },
      });
    }

    await prisma.stock.update({
      where: { productoId_almacenId: { productoId: producto.id, almacenId: almacen.id } },
      data: { cantidad: stockFinal },
    });

    console.log(`  ${data.sku} (${data.nombre}): ${movimientos.length} movimientos, stock final ${stockFinal} (minimo ${data.stockMinimo})`);
  }
  console.log();

  // ── Proveedor + Compra confirmada, Cliente + Venta confirmada: para que
  // Compras/Ventas tengan al menos un documento real que listar ──
  const proveedor = await prisma.proveedor.create({
    data: {
      tipoDocumento: "RUC",
      numeroDocumento: "1790011223001",
      razonSocial: "Importadora Componentes del Pacífico S.A.",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  const cliente = await prisma.cliente.create({
    data: {
      tipoDocumento: "RUC",
      numeroDocumento: "1790099887001",
      nombre: "Soluciones Informáticas del Valle Cía. Ltda.",
      empresaId: empresa.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const productoCompra = productos[0];
  const cantidadCompra = 10;
  const precioCompra = Number(productoCompra.precioCompra);
  const compra = await prisma.compra.create({
    data: {
      numero: "COM-DEMO-0001",
      estado: "CONFIRMADA",
      empresaId: empresa.id,
      proveedorId: proveedor.id,
      almacenId: almacen.id,
      usuarioId: admin.id,
      subtotal: cantidadCompra * precioCompra,
      impuesto: Math.round(cantidadCompra * precioCompra * 0.15 * 100) / 100,
      total: Math.round(cantidadCompra * precioCompra * 1.15 * 100) / 100,
      detalle: { create: [{ productoId: productoCompra.id, cantidad: cantidadCompra, precioUnitario: precioCompra, subtotal: cantidadCompra * precioCompra }] },
    },
  });
  console.log(`Compra de ejemplo creada: ${compra.numero}`);

  const productoVenta = productos[1];
  const cantidadVenta = 5;
  const precioVenta = Number(productoVenta.precioVenta);
  const venta = await prisma.venta.create({
    data: {
      numero: "VEN-DEMO-0001",
      estado: "CONFIRMADA",
      empresaId: empresa.id,
      clienteId: cliente.id,
      almacenId: almacen.id,
      usuarioId: vendedor.id,
      subtotal: cantidadVenta * precioVenta,
      impuesto: Math.round(cantidadVenta * precioVenta * 0.15 * 100) / 100,
      total: Math.round(cantidadVenta * precioVenta * 1.15 * 100) / 100,
      detalle: { create: [{ productoId: productoVenta.id, cantidad: cantidadVenta, precioUnitario: precioVenta, subtotal: cantidadVenta * precioVenta }] },
    },
  });
  console.log(`Venta de ejemplo creada: ${venta.numero}\n`);

  console.log("Empresa demo sembrada correctamente.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
