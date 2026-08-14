import { createHash, randomInt } from "node:crypto";

const CANTIDAD_CODIGOS = 8;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusion al transcribir

// Mismo principio que refresh-token.ts: solo se persiste el hash (sha256),
// el codigo en claro se devuelve una unica vez al generarlos.
function generarUnCodigo(): string {
  const mitad = (): string =>
    Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `${mitad()}-${mitad()}`;
}

export function generarCodigosRecuperacion(): string[] {
  return Array.from({ length: CANTIDAD_CODIGOS }, generarUnCodigo);
}

export function hashCodigoRecuperacion(codigo: string): string {
  return createHash("sha256").update(codigo.toUpperCase()).digest("hex");
}
