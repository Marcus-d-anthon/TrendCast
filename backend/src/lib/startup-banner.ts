// Banner de arranque impreso directo a stdout (no via pino: los logs
// estructurados JSON son para maquinas/observabilidad, esto es para el
// desarrollador mirando la terminal). Usa color verdadero ANSI (24-bit) con
// el indigo/violeta de la marca TrendCast; casi cualquier terminal moderna
// (VS Code, Windows Terminal, iTerm) lo soporta. Si no lo soporta, los
// codigos se ignoran y el texto plano sigue siendo legible.
const INDIGO = "\x1b[38;2;139;127;251m";
const INDIGO_DIM = "\x1b[38;2;98;90;180m";
const GREEN = "\x1b[38;2;46;204;113m";
const GRAY = "\x1b[38;2;148;144;179m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

interface BannerInfo {
  version: string;
  port: number;
  entorno: string;
  baseDeDatosConectada: boolean;
}

function visibleLength(texto: string): number {
  // eslint-disable-next-line no-control-regex
  return texto.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function fila(contenido: string, ancho: number): string {
  const relleno = ancho - visibleLength(contenido);
  return `${INDIGO}│${RESET} ${contenido}${" ".repeat(Math.max(relleno, 0))} ${INDIGO}│${RESET}`;
}

export function imprimirBannerArranque({ version, port, entorno, baseDeDatosConectada }: BannerInfo): void {
  const lineas = [
    `${BOLD}${INDIGO}▸▸ TrendCast API${RESET}  ${GRAY}v${version}${RESET}`,
    `${GRAY}Gestión de inventarios con análisis predictivo${RESET}`,
    "",
    `${GREEN}●${RESET} Servidor      ${BOLD}http://localhost:${port}${RESET}`,
    `${GREEN}●${RESET} Documentación ${BOLD}http://localhost:${port}/docs${RESET}`,
    `${baseDeDatosConectada ? GREEN + "●" : "\x1b[38;2;231;76;60m●"}${RESET} Base de datos ${baseDeDatosConectada ? "conectada" : "sin verificar"}`,
    `${INDIGO_DIM}●${RESET} Entorno       ${entorno}`,
  ];

  const ancho = Math.max(...lineas.map(visibleLength)) + 2;
  const borde = "─".repeat(ancho + 2);

  const salida = [
    `${INDIGO}╭${borde}╮${RESET}`,
    ...lineas.map((l) => fila(l, ancho)),
    `${INDIGO}╰${borde}╯${RESET}`,
    `${GRAY}  ✓ listo para recibir peticiones${RESET}`,
    "",
  ].join("\n");

  // eslint-disable-next-line no-console
  console.log(`\n${salida}`);
}
