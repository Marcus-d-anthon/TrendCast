import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CrearProductoInput } from '../../api/endpoints/productos';
import { ApiError } from '../../api/http-client';
import type { Categoria, Marca, UnidadMedida } from '../../api/types/domain';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useCategorias } from '../../queries/useCategorias';
import { useMarcas } from '../../queries/useMarcas';
import { useImportarProductos } from '../../queries/useProductos';
import { useUnidadesMedida } from '../../queries/useUnidadesMedida';
import { formatNumber } from '../../utils/format';
import styles from './CargaMasivaProductosPage.module.css';

interface FilaPreview {
  numero: number;
  sku: string;
  nombre: string;
  input?: CrearProductoInput;
  error?: string;
}

const COLUMNAS_ESPERADAS = [
  'sku',
  'nombre',
  'categoria',
  'marca',
  'unidadMedida',
  'precioCompra',
  'precioVenta',
  'stockMinimo',
];

function normalizarEncabezado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function buscarPorNombre<T extends { nombre: string; id: string }>(lista: T[], nombre: string): T | undefined {
  const objetivo = normalizarEncabezado(nombre);
  return lista.find((item) => normalizarEncabezado(item.nombre) === objetivo);
}

function resolverFila(
  numero: number,
  fila: Record<string, string>,
  catalogos: { categorias: Categoria[]; marcas: Marca[]; unidadesMedida: UnidadMedida[] },
): FilaPreview {
  const sku = fila.sku?.trim() ?? '';
  const nombre = fila.nombre?.trim() ?? '';

  if (!sku) return { numero, sku: '—', nombre, error: 'Falta el SKU' };
  if (!nombre) return { numero, sku, nombre: '—', error: 'Falta el nombre' };

  const categoria = buscarPorNombre(catalogos.categorias, fila.categoria ?? '');
  if (!categoria) return { numero, sku, nombre, error: `Categoría "${fila.categoria ?? ''}" no existe` };

  const marca = buscarPorNombre(catalogos.marcas, fila.marca ?? '');
  if (!marca) return { numero, sku, nombre, error: `Marca "${fila.marca ?? ''}" no existe` };

  const unidad =
    buscarPorNombre(catalogos.unidadesMedida, fila.unidadmedida ?? '') ??
    catalogos.unidadesMedida.find((u) => normalizarEncabezado(u.abreviatura) === normalizarEncabezado(fila.unidadmedida ?? ''));
  if (!unidad) return { numero, sku, nombre, error: `Unidad de medida "${fila.unidadmedida ?? ''}" no existe` };

  const precioCompra = Number(fila.preciocompra);
  const precioVenta = Number(fila.precioventa);
  if (!Number.isFinite(precioCompra) || precioCompra < 0) return { numero, sku, nombre, error: 'Precio de compra inválido: debe ser un número' };
  if (!Number.isFinite(precioVenta) || precioVenta < 0) return { numero, sku, nombre, error: 'Precio de venta inválido: debe ser un número' };

  const stockMinimoTexto = fila.stockminimo?.trim() ?? '';
  let stockMinimo = 0;
  if (stockMinimoTexto) {
    stockMinimo = Number(stockMinimoTexto);
    if (!Number.isFinite(stockMinimo) || stockMinimo < 0 || !Number.isInteger(stockMinimo)) {
      return { numero, sku, nombre, error: 'Stock mínimo inválido: debe ser un número entero' };
    }
  }

  return {
    numero,
    sku,
    nombre,
    input: {
      sku,
      nombre,
      categoriaId: categoria.id,
      marcaId: marca.id,
      unidadMedidaId: unidad.id,
      precioCompra,
      precioVenta,
      stockMinimo,
    },
  };
}

async function parsearArchivo(archivo: File): Promise<Record<string, string>[]> {
  const esCsv = archivo.name.toLowerCase().endsWith('.csv');

  if (esCsv) {
    const texto = await archivo.text();
    const [lineaEncabezado, ...lineas] = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const encabezados = lineaEncabezado.split(',').map((h) => normalizarEncabezado(h.replace(/"/g, '')));
    return lineas.map((linea) => {
      const valores = linea.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const fila: Record<string, string> = {};
      encabezados.forEach((h, i) => (fila[h] = valores[i] ?? ''));
      return fila;
    });
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await archivo.arrayBuffer());
  const hoja = workbook.worksheets[0];
  const filas: Record<string, string>[] = [];
  let encabezados: string[] = [];
  hoja.eachRow((row, numeroFila) => {
    const valores = (row.values as unknown[]).slice(1).map((v) => (v === null || v === undefined ? '' : String(v)));
    if (numeroFila === 1) {
      encabezados = valores.map((v) => normalizarEncabezado(v));
      return;
    }
    const fila: Record<string, string> = {};
    encabezados.forEach((h, i) => (fila[h] = valores[i] ?? ''));
    filas.push(fila);
  });
  return filas;
}

const ENCABEZADOS_PLANTILLA: Record<string, string> = {
  sku: 'sku',
  nombre: 'nombre',
  categoria: 'categoria',
  marca: 'marca',
  unidadMedida: 'unidadMedida',
  precioCompra: 'precioCompra',
  precioVenta: 'precioVenta',
  stockMinimo: 'stockMinimo',
};

// Filas hasta donde se aplica el dropdown de validacion en la plantilla:
// generoso a proposito (no se sabe cuantas filas va a llenar el usuario).
const FILAS_VALIDACION = 500;

// Letra de columna de cada campo en la hoja principal, en el mismo orden que
// COLUMNAS_ESPERADAS -- se usa para anclar los data validations de Excel.
const COLUMNA_LETRA: Record<string, string> = { categoria: 'C', marca: 'D', unidadMedida: 'E' };

async function descargarPlantilla(catalogos: { categorias: Categoria[]; marcas: Marca[]; unidadesMedida: UnidadMedida[] }) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet('Plantilla');

  hoja.columns = COLUMNAS_ESPERADAS.map((clave) => ({ header: ENCABEZADOS_PLANTILLA[clave], key: clave, width: 20 }));
  hoja.getRow(1).font = { bold: true };

  const ejemplo = {
    sku: 'SKU-EJEMPLO-001',
    nombre: 'Producto de ejemplo',
    categoria: catalogos.categorias[0]?.nombre ?? '',
    marca: catalogos.marcas[0]?.nombre ?? '',
    unidadMedida: catalogos.unidadesMedida[0]?.nombre ?? '',
    precioCompra: 5,
    precioVenta: 9,
    stockMinimo: 10,
  };
  hoja.addRow(ejemplo);
  hoja.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };

  // Hoja oculta con el catalogo vigente (categorias/marcas/unidades): las
  // columnas categoria/marca/unidadMedida de la plantilla quedan como un
  // dropdown real de Excel que apunta a estas listas, en vez de texto libre
  // -- asi quien llena el archivo solo puede elegir valores que ya existen.
  const hojaListas = workbook.addWorksheet('Listas', { state: 'hidden' });
  const listas: [string, { nombre: string }[]][] = [
    ['A', catalogos.categorias],
    ['B', catalogos.marcas],
    ['C', catalogos.unidadesMedida],
  ];
  listas.forEach(([col, items]) => {
    items.forEach((item, i) => {
      hojaListas.getCell(`${col}${i + 1}`).value = item.nombre;
    });
  });

  const rangosLista: Record<string, string> = {
    categoria: `Listas!$A$1:$A$${Math.max(1, catalogos.categorias.length)}`,
    marca: `Listas!$B$1:$B$${Math.max(1, catalogos.marcas.length)}`,
    unidadMedida: `Listas!$C$1:$C$${Math.max(1, catalogos.unidadesMedida.length)}`,
  };
  (['categoria', 'marca', 'unidadMedida'] as const).forEach((clave) => {
    const col = COLUMNA_LETRA[clave];
    for (let fila = 2; fila <= FILAS_VALIDACION; fila++) {
      hoja.getCell(`${col}${fila}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [rangosLista[clave]],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Valor no válido',
        error: 'Selecciona un valor de la lista: solo se aceptan los que ya existen en el sistema.',
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla-carga-masiva-productos.xlsx';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export function CargaMasivaProductosPage() {
  const navigate = useNavigate();
  const categorias = useCategorias();
  const marcas = useMarcas();
  const unidadesMedida = useUnidadesMedida();
  const importar = useImportarProductos();

  const [preview, setPreview] = useState<FilaPreview[] | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ creados: number; errores: number } | null>(null);

  const catalogosListos = categorias.data && marcas.data && unidadesMedida.data;
  const validas = preview?.filter((f) => f.input) ?? [];
  const invalidas = preview?.filter((f) => f.error) ?? [];

  async function manejarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo || !catalogosListos) return;

    setProcesando(true);
    setResultado(null);
    try {
      const filas = await parsearArchivo(archivo);
      const catalogos = { categorias: categorias.data!, marcas: marcas.data!, unidadesMedida: unidadesMedida.data! };
      setPreview(filas.map((fila, i) => resolverFila(i + 2, fila, catalogos)));
    } catch {
      toast.error('No se pudo leer el archivo. Verifica que sea un .csv o .xlsx válido.');
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarImportacion() {
    if (validas.length === 0) return;
    try {
      const res = await importar.mutateAsync(validas.map((f) => f.input!));
      setResultado({ creados: res.creados, errores: res.errores.length });
      if (res.errores.length === 0) {
        toast.success(`${res.creados} productos importados`);
      } else {
        toast.error(`${res.creados} importados, ${res.errores.length} con error`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo completar la importación');
    }
  }

  return (
    <div>
      <button type="button" className={styles.volver} onClick={() => navigate('/productos')}>
        <ArrowLeft size={16} aria-hidden="true" /> Volver a productos
      </button>

      <h1 className={styles.titulo}>Carga masiva de productos</h1>

      <Card className={styles.sectionGap}>
        <p className={styles.hint}>
          Sube un archivo <code>.csv</code> o <code>.xlsx</code> con columnas: <code>{COLUMNAS_ESPERADAS.join(', ')}</code>.
          La categoría, marca y unidad de medida se buscan por nombre (o abreviatura, para la unidad) contra el catálogo
          actual del sistema — solo se aceptan valores que ya existan, así se evita que datos incorrectos lleguen al
          inventario. La plantilla descargable trae esas tres columnas con una lista desplegable de Excel ya cargada
          con los valores vigentes.
        </p>
        <Button type="button" variant="secondary" onClick={() => descargarPlantilla({ categorias: categorias.data ?? [], marcas: marcas.data ?? [], unidadesMedida: unidadesMedida.data ?? [] })}>
          <Download size={16} aria-hidden="true" /> Descargar plantilla vacía
        </Button>
      </Card>

      <Card className={styles.sectionGap}>
        {!preview && (
          <label className={styles.dropzone}>
            <Upload size={24} aria-hidden="true" />
            <span>{procesando ? 'Leyendo archivo…' : 'Selecciona un archivo .csv o .xlsx'}</span>
            <input type="file" accept=".csv,.xlsx" onChange={manejarArchivo} disabled={procesando || !catalogosListos} hidden />
          </label>
        )}

        {preview && !resultado && (
          <>
            <div className={styles.summaryRow}>
              <Badge variant="success">
                <CheckCircle2 size={14} aria-hidden="true" /> {validas.length} listas para importar
              </Badge>
              {invalidas.length > 0 && (
                <Badge variant="danger">
                  <AlertTriangle size={14} aria-hidden="true" /> {invalidas.length} con error
                </Badge>
              )}
            </div>

            <div className={`${tableStyles.tableWrap} ${styles.previewTable}`}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((fila) => (
                    <tr key={fila.numero} className={fila.error ? styles.filaError : undefined}>
                      <td className={tableStyles.mono}>{fila.numero}</td>
                      <td className={tableStyles.mono}>{fila.sku}</td>
                      <td>{fila.nombre}</td>
                      <td className={fila.error ? styles.cellError : styles.cellOk}>{fila.error ?? 'Válida'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setPreview(null)}>
                Elegir otro archivo
              </Button>
              <Button type="button" disabled={validas.length === 0 || importar.isPending} onClick={confirmarImportacion}>
                {importar.isPending ? 'Importando…' : `Importar ${formatNumber(validas.length)} productos`}
              </Button>
            </div>
          </>
        )}

        {resultado && (
          <div className={styles.resultado}>
            <p>
              <strong>{resultado.creados}</strong> productos creados
              {resultado.errores > 0 && (
                <>
                  {' '}
                  · <strong>{resultado.errores}</strong> con error
                </>
              )}
              .
            </p>
            <div className={styles.actions} style={{ marginTop: 0 }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/productos')}>
                Volver a productos
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setResultado(null);
                }}
              >
                Cargar otro archivo
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
