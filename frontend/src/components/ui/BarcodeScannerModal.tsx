import { ScanBarcode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import styles from './BarcodeScannerModal.module.css';

interface BarcodeScannerModalProps {
  onScan: (codigo: string) => void;
  onClose: () => void;
}

/**
 * Lectura via lector de codigo de barras USB/HID, no camara: en un
 * escritorio de bodega/mostrador el dispositivo real es un lector que se
 * conecta como teclado y "escribe" el codigo seguido de Enter -- no hay
 * camara del navegador que usar como en un celular. El input queda
 * enfocado todo el tiempo que el modal esta abierto; cualquier tecla que no
 * sea la del lector (un usuario tipeando a mano) funciona igual de bien.
 */
export function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  const [valor, setValor] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function manejarEnvio() {
    const codigo = valor.trim();
    if (codigo) onScan(codigo);
  }

  return (
    <Modal title="Escanear código de barras" onClose={onClose}>
      <p className={styles.hint}>
        Apunta el lector al código de barras del producto (codifica el SKU) y dispara la lectura; también puedes
        escribir el código a mano y presionar Enter.
      </p>
      <div className={styles.inputWrap}>
        <ScanBarcode size={20} className={styles.icon} aria-hidden="true" />
        <input
          ref={inputRef}
          className={styles.input}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              manejarEnvio();
            }
          }}
          placeholder="Esperando lectura…"
          aria-label="Código escaneado"
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}
