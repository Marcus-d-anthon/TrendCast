import { useEffect, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './Modal';
import styles from './BarcodeScannerModal.module.css';

interface BarcodeScannerModalProps {
  onScan: (codigo: string) => void;
  onClose: () => void;
}

const ELEMENT_ID = 'barcode-scanner-viewport';

/**
 * Escaneo de codigo de barras/QR via camara. Usa html5-qrcode con import
 * dinamico: es una libreria pesada y de uso opcional, no tiene sentido
 * cargarla en el bundle principal para todos los usuarios que nunca escanean.
 * El SKU del producto ES el valor codificado (ver BarcodeLabel.tsx), asi que
 * escanear equivale a buscar por SKU exacto.
 */
export function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelado = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelado) return;
      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 120 } },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {
            // Errores por-frame (ningun codigo en el cuadro actual): se ignoran a proposito, son constantes durante el enfoque.
          },
        )
        .catch(() => {
          setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
        });
    });

    return () => {
      cancelado = true;
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, [onScan]);

  return (
    <Modal title="Escanear código de barras" onClose={onClose}>
      <p className={styles.hint}>Apunta la cámara al código de barras del producto (codifica el SKU).</p>
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div id={ELEMENT_ID} className={styles.viewport} />
      )}
    </Modal>
  );
}
