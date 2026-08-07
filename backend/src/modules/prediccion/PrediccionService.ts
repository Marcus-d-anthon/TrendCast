import { NotFoundError } from "../../lib/errors";
import { productosRepository } from "../productos/productos.repository";
import {
  calcularPromedioMovil,
  calcularRegresionLineal,
  proyectar,
  recomendarReabastecimiento,
} from "./prediccion.math";
import { prediccionRepository, type Granularidad } from "./prediccion.repository";

const VENTANA_SMA_DEFECTO = 3;

export interface PrediccionInput {
  productoId: string;
  periodos: number;
  granularidad: Granularidad;
}

export const prediccionService = {
  async generar(input: PrediccionInput) {
    const producto = await productosRepository.buscarPorId(input.productoId);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }

    const historicoCompleto = await prediccionRepository.obtenerDemandaHistorica(
      input.productoId,
      input.granularidad
    );
    const historico = historicoCompleto.slice(-input.periodos);
    const serie = historico.map((punto) => punto.demanda);

    const ventanaSma = Math.min(VENTANA_SMA_DEFECTO, serie.length || 1);
    const promedioMovilProximoPeriodo = calcularPromedioMovil(serie, ventanaSma);

    const regresion = calcularRegresionLineal(serie);
    // La demanda no puede ser negativa: una tendencia decreciente pronunciada
    // podria proyectar un valor negativo matematicamente, se recorta a 0.
    const proyeccionRegresion = Math.max(0, proyectar(regresion, serie.length + 1));

    const stockActual = producto.stocks.reduce((suma, s) => suma + s.cantidad, 0);

    return {
      productoId: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      granularidad: input.granularidad,
      historico: historico.map((punto) => ({ periodo: punto.periodo, demanda: punto.demanda })),
      promedioMovil: {
        ventana: ventanaSma,
        proyeccionProximoPeriodo: promedioMovilProximoPeriodo,
      },
      regresionLineal: {
        interceptoA: regresion.a,
        pendienteB: regresion.b,
        proyeccionProximoPeriodo: proyeccionRegresion,
      },
      stockActual,
      stockMinimo: producto.stockMinimo,
      recomendacionReabastecimiento: recomendarReabastecimiento({
        demandaProyectada: proyeccionRegresion,
        stockActual,
        stockMinimo: producto.stockMinimo,
      }),
    };
  },
};
