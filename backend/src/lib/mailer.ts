import nodemailer from "nodemailer";
import { logger } from "../config/logger";

export interface EnviarCorreoInput {
  to: string;
  subject: string;
  html: string;
}

let transportador: nodemailer.Transporter | null = null;
let transportadorInicializado = false;

// SMTP es opcional: si no hay SMTP_HOST configurado, el correo simplemente
// no se envia (se registra en el log) en vez de fallar. No se fabrica un
// envio exitoso falso -- es honesto que sin credenciales SMTP reales no hay
// correo real que enviar.
function obtenerTransportador(): nodemailer.Transporter | null {
  if (transportadorInicializado) {
    return transportador;
  }
  transportadorInicializado = true;

  if (!process.env.SMTP_HOST) {
    return null;
  }

  transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transportador;
}

// Best-effort: nunca lanza. Un fallo de correo no debe interrumpir el flujo
// de negocio que lo origino (crear una alerta, por ejemplo).
export async function enviarCorreo(input: EnviarCorreoInput): Promise<boolean> {
  const cliente = obtenerTransportador();
  if (!cliente) {
    logger.warn({ to: input.to }, "SMTP no configurado (SMTP_HOST ausente): correo no enviado, solo notificacion interna");
    return false;
  }

  try {
    await cliente.sendMail({
      from: process.env.SMTP_FROM ?? "SGI <no-reply@sgi.local>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return true;
  } catch (error) {
    logger.error({ err: error, to: input.to }, "Fallo al enviar correo");
    return false;
  }
}
