// Funciones puras (sin I/O, sin Prisma) para que el servicio predictivo se
// pueda probar unitariamente con arreglos de numeros fijos, sin necesitar
// una base de datos de pruebas.

/**
 * Promedio movil simple (SMA) de los ultimos `ventana` valores de la serie.
 *
 *   SMA = (1/k) * Sum(d_i)  para los ultimos k periodos disponibles
 *
 * Se usa como proyeccion ingenua del proximo periodo: asume que la demanda
 * futura se parece al promedio reciente, suavizando picos aislados. Si la
 * serie tiene menos datos que la ventana pedida, se usa toda la serie
 * disponible.
 */
export function calcularPromedioMovil(serie: number[], ventana: number): number {
  if (ventana <= 0) {
    throw new Error("La ventana debe ser mayor a cero");
  }
  if (serie.length === 0) {
    return 0;
  }

  const tamanoReal = Math.min(ventana, serie.length);
  const ultimos = serie.slice(-tamanoReal);
  const suma = ultimos.reduce((acumulado, valor) => acumulado + valor, 0);
  return suma / tamanoReal;
}

export interface RegresionLineal {
  /** Intercepto (valor proyectado en x = 0) */
  a: number;
  /** Pendiente (cambio de demanda por periodo) */
  b: number;
}

/**
 * Regresion lineal simple por minimos cuadrados: ajusta y = a + b*x sobre la
 * serie historica, indexando cada periodo como x = 1..n y su demanda como y.
 * A diferencia del SMA, captura tendencia (creciente o decreciente).
 *
 *   b = (n*Sum(xi*yi) - Sum(xi)*Sum(yi)) / (n*Sum(xi^2) - (Sum(xi))^2)
 *   a = (Sum(yi) - b*Sum(xi)) / n
 */
export function calcularRegresionLineal(serie: number[]): RegresionLineal {
  const n = serie.length;
  if (n === 0) {
    return { a: 0, b: 0 };
  }
  if (n === 1) {
    // Con un solo punto no hay tendencia que ajustar: la mejor recta
    // horizontal posible es el propio valor.
    return { a: serie[0], b: 0 };
  }

  const xs = serie.map((_, indice) => indice + 1);
  const sumaX = xs.reduce((acc, x) => acc + x, 0);
  const sumaY = serie.reduce((acc, y) => acc + y, 0);
  const sumaXY = xs.reduce((acc, x, indice) => acc + x * serie[indice], 0);
  const sumaX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const denominador = n * sumaX2 - sumaX * sumaX;
  const b = denominador === 0 ? 0 : (n * sumaXY - sumaX * sumaY) / denominador;
  const a = (sumaY - b * sumaX) / n;

  return { a, b };
}

/**
 * Proyecta la demanda para un periodo futuro dado el modelo de regresion.
 * Usa la misma indexacion 1..n de calcularRegresionLineal: si la serie tiene
 * n periodos, pasar n+1 proyecta el proximo periodo inmediato.
 */
export function proyectar(regresion: RegresionLineal, periodoFuturo: number): number {
  return regresion.a + regresion.b * periodoFuturo;
}

export interface RecomendacionReabastecimientoParams {
  demandaProyectada: number;
  stockActual: number;
  stockMinimo: number;
}

/**
 * Cantidad sugerida a reabastecer: cubre la demanda proyectada del proximo
 * periodo mas el colchon de stock minimo, descontando lo que ya se tiene.
 * Nunca es negativa (si ya sobra stock, no se sugiere comprar).
 *
 *   cantidad_sugerida = max(0, demanda_proyectada + stock_minimo - stock_actual)
 */
export function recomendarReabastecimiento(params: RecomendacionReabastecimientoParams): number {
  const { demandaProyectada, stockActual, stockMinimo } = params;
  const sugerido = demandaProyectada + stockMinimo - stockActual;
  return Math.max(0, Math.round(sugerido));
}
