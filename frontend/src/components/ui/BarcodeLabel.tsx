import { Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from './Button';
import styles from './BarcodeLabel.module.css';

interface BarcodeLabelProps {
  sku: string;
  nombre: string;
}

/**
 * Etiqueta imprimible con codigo de barras Code128 del SKU. jsbarcode dibuja
 * sobre un <canvas>; para imprimir se abre una ventana aparte con solo la
 * etiqueta (evita que el CSS de la app -- sidebar, cards, etc. -- interfiera
 * con el area imprimible).
 */
export function BarcodeLabel({ sku, nombre }: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import('jsbarcode').then(({ default: JsBarcode }) => {
      if (!canvasRef.current) return;
      JsBarcode(canvasRef.current, sku, {
        format: 'CODE128',
        width: 2,
        height: 60,
        fontSize: 14,
        margin: 8,
        background: '#ffffff',
        lineColor: '#16231d',
      });
    });
  }, [sku]);

  function imprimir() {
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    if (!dataUrl) return;
    const ventana = window.open('', '_blank', 'width=400,height=300');
    if (!ventana) return;
    ventana.document.write(`
      <html>
        <head><title>Etiqueta ${sku}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
          <img src="${dataUrl}" alt="Codigo de barras ${sku}" />
          <p style="font-size:13px;color:#333;margin-top:4px;">${nombre}</p>
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  }

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <Button type="button" variant="secondary" size="sm" onClick={imprimir}>
        <Printer size={14} aria-hidden="true" /> Imprimir etiqueta
      </Button>
    </div>
  );
}
