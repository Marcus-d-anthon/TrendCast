import { existsSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export interface ColumnaExport {
  header: string;
  key: string;
  ancho?: number;
}

export interface TablaExport {
  titulo: string;
  columnas: ColumnaExport[];
  filas: Record<string, unknown>[];
}

export type FormatoExport = "csv" | "excel" | "pdf";

const CONTENT_TYPE: Record<FormatoExport, string> = {
  csv: "text/csv; charset=utf-8",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const EXTENSION: Record<FormatoExport, string> = { csv: "csv", excel: "xlsx", pdf: "pdf" };

// Paleta de marca TrendCast (ver frontend/src/styles/tokens.css) reproducida
// en hex plano porque pdfkit/exceljs no leen custom properties CSS.
const MARCA = {
  indigo900: "#241E5C",
  indigo700: "#4338CA",
  indigo100: "#E8E5FC",
  tinta: "#1C1B2E",
  piedra: "#625E77",
  borde: "#E3E1F5",
  bandaAlterna: "#F6F5FC",
};

const LOGO_PATH = path.join(__dirname, "../../assets/logo-lockup.png");

export function nombreArchivoExport(base: string, formato: FormatoExport): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${EXTENSION[formato]}`;
}

export function contentTypeExport(formato: FormatoExport): string {
  return CONTENT_TYPE[formato];
}

function formatearCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number") return valor.toLocaleString("es-EC", { maximumFractionDigits: 2 });
  return String(valor);
}

export function generarCsv(tabla: TablaExport): Buffer {
  const encabezado = tabla.columnas.map((c) => `"${c.header}"`).join(",");
  const filas = tabla.filas.map((fila) =>
    tabla.columnas.map((c) => `"${formatearCelda(fila[c.key]).replace(/"/g, '""')}"`).join(","),
  );
  return Buffer.from(["﻿" + encabezado, ...filas].join("\n"), "utf-8");
}

export async function generarExcel(tabla: TablaExport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TrendCast";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(tabla.titulo.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  // Franja de marca: logo + titulo, ocupando las primeras filas antes de la
  // tabla de datos (mismo patron visual que el PDF).
  hoja.mergeCells("A1:B3");
  if (existsSync(LOGO_PATH)) {
    const imageId = workbook.addImage({ filename: LOGO_PATH, extension: "png" });
    hoja.addImage(imageId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 200, height: 55 } });
  }
  hoja.getCell(`C1`).value = tabla.titulo;
  hoja.getCell(`C1`).font = { bold: true, size: 14, color: { argb: `FF${MARCA.indigo900.slice(1)}` } };
  hoja.getCell(`C2`).value = `Generado el ${new Date().toLocaleString("es-EC")}`;
  hoja.getCell(`C2`).font = { size: 9, italic: true, color: { argb: `FF${MARCA.piedra.slice(1)}` } };
  hoja.getRow(1).height = 34;
  hoja.getRow(3).height = 8;

  const filaEncabezado = 4;
  tabla.columnas.forEach((columna, i) => {
    const celda = hoja.getRow(filaEncabezado).getCell(i + 1);
    celda.value = columna.header;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${MARCA.indigo700.slice(1)}` } };
    celda.alignment = { vertical: "middle" };
    hoja.getColumn(i + 1).width = columna.ancho ?? 22;
  });
  hoja.getRow(filaEncabezado).height = 20;

  tabla.filas.forEach((fila, indiceFila) => {
    const filaExcel = hoja.getRow(filaEncabezado + 1 + indiceFila);
    tabla.columnas.forEach((columna, i) => {
      const celda = filaExcel.getCell(i + 1);
      celda.value = fila[columna.key] as ExcelJS.CellValue;
      if (indiceFila % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${MARCA.bandaAlterna.slice(1)}` } };
      }
      celda.border = { bottom: { style: "thin", color: { argb: `FF${MARCA.borde.slice(1)}` } } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generarPdf(tabla: TablaExport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Anchos proporcionales por columna (antes se dividia el ancho en partes
    // iguales sin importar cuanto texto tenia cada columna, lo que apretaba
    // "Producto"/"Categoria" y desperdiciaba espacio en columnas cortas como
    // "SKU" o "Estado").
    const sumaAnchos = tabla.columnas.reduce((suma, c) => suma + (c.ancho ?? 22), 0);
    const anchosColumna = tabla.columnas.map((c) => ((c.ancho ?? 22) / sumaAnchos) * anchoDisponible);
    const posicionesColumna = anchosColumna.reduce<number[]>((acc, ancho, i) => {
      acc.push(i === 0 ? doc.page.margins.left : acc[i - 1] + anchosColumna[i - 1]);
      return acc;
    }, []);

    const ALTURA_FILA_MINIMA = 16;

    function dibujarEncabezadoPagina() {
      if (existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, doc.page.margins.left, doc.page.margins.top, { width: 108 });
      }
      doc
        .fontSize(15)
        .fillColor(MARCA.indigo900)
        .text(tabla.titulo, doc.page.margins.left + 122, doc.page.margins.top + 2);
      doc
        .fontSize(8)
        .fillColor(MARCA.piedra)
        .text(`Generado el ${new Date().toLocaleString("es-EC")}`, doc.page.margins.left + 122, doc.page.margins.top + 22);
      doc
        .moveTo(doc.page.margins.left, doc.page.margins.top + 42)
        .lineTo(doc.page.width - doc.page.margins.right, doc.page.margins.top + 42)
        .strokeColor(MARCA.indigo700)
        .lineWidth(1.5)
        .stroke();
      return doc.page.margins.top + 54;
    }

    const FONT_SIZE = 9;

    function alturaFila(valores: string[]): number {
      doc.font("Helvetica").fontSize(FONT_SIZE);
      const alturas = valores.map((valor, i) => doc.heightOfString(valor, { width: anchosColumna[i] - 6 }));
      return Math.max(ALTURA_FILA_MINIMA, ...alturas.map((h) => h + 6));
    }

    function dibujarFila(valores: string[], y: number, altura: number, opciones: { negrita?: boolean; banda?: boolean } = {}) {
      if (opciones.banda) {
        doc.rect(doc.page.margins.left, y - 3, anchoDisponible, altura).fill(MARCA.bandaAlterna);
      }
      doc.font(opciones.negrita ? "Helvetica-Bold" : "Helvetica").fontSize(FONT_SIZE).fillColor(opciones.negrita ? "#FFFFFF" : MARCA.tinta);
      valores.forEach((valor, i) => {
        doc.text(valor, posicionesColumna[i] + 4, y, { width: anchosColumna[i] - 8 });
      });
    }

    function dibujarEncabezadoTabla(y: number) {
      const encabezados = tabla.columnas.map((c) => c.header);
      const altura = alturaFila(encabezados);
      doc.rect(doc.page.margins.left, y - 3, anchoDisponible, altura).fill(MARCA.indigo700);
      dibujarFila(encabezados, y, altura, { negrita: true });
      return y + altura + 4;
    }

    let y = dibujarEncabezadoPagina();
    y = dibujarEncabezadoTabla(y);

    tabla.filas.forEach((fila, indice) => {
      const valores = tabla.columnas.map((c) => formatearCelda(fila[c.key]));
      const altura = alturaFila(valores);

      if (y + altura > doc.page.height - doc.page.margins.bottom) {
        doc.addPage({ margin: 40, size: "A4", layout: "landscape" });
        y = dibujarEncabezadoPagina();
        y = dibujarEncabezadoTabla(y);
      }
      dibujarFila(valores, y, altura, { banda: indice % 2 === 1 });
      y += altura + 3;
    });

    // Pie de pagina con numeracion, agregado al final sobre todas las
    // paginas ya renderizadas (bufferPages: true permite volver atras).
    // IMPORTANTE: debe quedar DENTRO del margen inferior, nunca debajo -- un
    // y por debajo de `page.height - margins.bottom` hace que pdfkit crea
    // que el texto no cabe y agregue una pagina en blanco extra solo para el
    // pie de pagina (el bug original que dejaba una hoja "huerfana" al final).
    const totalPaginas = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPaginas; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor(MARCA.piedra)
        .text(`TrendCast · Página ${i + 1} de ${totalPaginas}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 12, {
          width: anchoDisponible,
          align: "center",
        });
    }

    doc.end();
  });
}

export async function generarExport(tabla: TablaExport, formato: FormatoExport): Promise<Buffer> {
  if (formato === "csv") return generarCsv(tabla);
  if (formato === "excel") return generarExcel(tabla);
  return generarPdf(tabla);
}
