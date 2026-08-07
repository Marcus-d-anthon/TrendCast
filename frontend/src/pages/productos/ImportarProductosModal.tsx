import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import type { CrearProductoInput } from '../../api/endpoints/productos';
import { ApiError } from '../../api/http-client';
import type { Categoria, Marca, UnidadMedida } from '../../api/types/domain';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useCategorias } from '../../queries/useCategorias';
import { useMarcas } from '../../queries/useMarcas';
import { useImportarProductos } from '../../queries/useProductos';
import { useUnidadesMedida } from '../../queries/useUnidadesMedida';
import { formatNumber } from '../../utils/format';
import styles from './ImportarProductosModal.module.css';

interface FilaPreview {
  numero: number;
  sku: string;
  nombre: string;
  input?: CrearProductoInput;
  error?: string;
}

const COLUMNAS_ESPERADAS = ['sku', 'nombre', 'categoria', 'marca', 'unidadMedida', 'precioCompra', 'precioVenta', 'stockMinimo'];

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

  const unidad = buscarPorNombre(catalogos.unidadesMedida, fila.unidadmedida ?? '') ?? catalogos.unidadesMedida.find(
    (u) => normalizarEncabezado(u.abreviatura) === normalizarEncabezado(fila.unidadmedida ?? ''),
  );
  if (!unidad) return { numero, sku, nombre, error: `Unidad de medida "${fila.unidadmedida ?? ''}" no existe` };

  const precioCompra = Number(fila.preciocompra);
  const precioVenta = Number(fila.precioventa);
  if (!Number.isFinite(precioCompra) || precioCompra < 0) return { numero, sku, nombre, error: 'Precio de compra inválido' };
  if (!Number.isFinite(precioVenta) || precioVenta < 0) return { numero, sku, nombre, error: 'Precio de venta inválido' };

  const stockMinimo = fila.stockminimo ? Number(fila.stockminimo) : 0;

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
      stockMinimo: Number.isFinite(stockMinimo) ? stockMinimo : 0,
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

interface ImportarProductosModalProps {
  onClose: () => void;
}

export function ImportarProductosModal({ onClose }: ImportarProductosModalProps) {
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
    <Modal title="Importar productos" onClose={onClose}>
      <p className={styles.hint}>
        Archivo CSV o Excel con columnas: <code>{COLUMNAS_ESPERADAS.join(', ')}</code>. La categoría, marca y unidad de
        medida se buscan por nombre (o abreviatura, para la unidad).
      </p>

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
            <span className={styles.summaryOk}>
              <CheckCircle2 size={14} aria-hidden="true" /> {validas.length} listas para importar
            </span>
            {invalidas.length > 0 && (
              <span className={styles.summaryError}>
                <AlertTriangle size={14} aria-hidden="true" /> {invalidas.length} con error
              </span>
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
                  <tr key={fila.numero}>
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
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      )}
    </Modal>
  );
}
