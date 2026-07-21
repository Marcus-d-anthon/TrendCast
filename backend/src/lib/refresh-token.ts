import { createHash, randomBytes } from "node:crypto";
import { env } from "../config/env";

// Refresh token opaco (no JWT): un secreto aleatorio de 256 bits que el
// cliente guarda, del que solo se persiste el hash SHA-256 en la base de
// datos (tabla refresh_tokens). Esto permite revocacion real -- un JWT de
// refresh firmado seria valido hasta expirar sin forma de invalidarlo antes.
export function generarRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function calcularExpiracionRefreshToken(): Date {
  const ahora = new Date();
  ahora.setDate(ahora.getDate() + env.REFRESH_TOKEN_TTL_DIAS);
  return ahora;
}
