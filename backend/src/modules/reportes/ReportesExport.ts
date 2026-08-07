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
  workbook.creator = "SGI TIANSHI ECUADOR";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(tabla.titulo.slice(0, 31));
  hoja.columns = tabla.columnas.map((c) => ({ header: c.header, key: c.key, width: c.ancho ?? 22 }));
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E4B3A" } };
  hoja.getRow(1).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  hoja.addRows(tabla.filas);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generarPdf(tabla: TablaExport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).fillColor("#1E4B3A").text(tabla.titulo, { align: "left" });
    doc
      .fontSize(9)
      .fillColor("#55645B")
      .text(`SGI TIANSHI ECUADOR - Generado el ${new Date().toLocaleString("es-EC")}`, { align: "left" });
    doc.moveDown();

    const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const anchoColumna = anchoDisponible / tabla.columnas.length;

    function dibujarFila(valores: string[], y: number, negrita: boolean) {
      doc.font(negrita ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor("#16231D");
      valores.forEach((valor, i) => {
        doc.text(valor, doc.page.margins.left + i * anchoColumna, y, { width: anchoColumna - 4 });
      });
    }

    let y = doc.y;
    dibujarFila(
      tabla.columnas.map((c) => c.header),
      y,
      true,
    );
    y += 16;
    doc
      .moveTo(doc.page.margins.left, y - 2)
      .lineTo(doc.page.width - doc.page.margins.right, y - 2)
      .strokeColor("#DCE3DC")
      .stroke();

    for (const fila of tabla.filas) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage({ margin: 40, size: "A4", layout: "landscape" });
        y = doc.page.margins.top;
      }
      dibujarFila(
        tabla.columnas.map((c) => formatearCelda(fila[c.key])),
        y,
        false,
      );
      y += 14;
    }

    doc.end();
  });
}

export async function generarExport(tabla: TablaExport, formato: FormatoExport): Promise<Buffer> {
  if (formato === "csv") return generarCsv(tabla);
  if (formato === "excel") return generarExcel(tabla);
  return generarPdf(tabla);
}
