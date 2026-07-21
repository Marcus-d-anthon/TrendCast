import { describe, expect, it } from "vitest";
import {
  calcularPromedioMovil,
  calcularRegresionLineal,
  proyectar,
  recomendarReabastecimiento,
} from "../../src/modules/prediccion/prediccion.math";

describe("calcularPromedioMovil", () => {
  it("calcula el promedio de los ultimos k periodos", () => {
    // (10 + 12 + 14) / 3 = 12
    expect(calcularPromedioMovil([10, 12, 14], 3)).toBe(12);
    // (12 + 14) / 2 = 13
    expect(calcularPromedioMovil([10, 12, 14], 2)).toBe(13);
  });

  it("usa toda la serie si tiene menos datos que la ventana pedida", () => {
    // (10 + 12) / 2 = 11, aunque se pidio ventana=5
    expect(calcularPromedioMovil([10, 12], 5)).toBe(11);
  });

  it("devuelve 0 para una serie vacia", () => {
    expect(calcularPromedioMovil([], 3)).toBe(0);
  });

  it("lanza error si la ventana no es positiva", () => {
    expect(() => calcularPromedioMovil([1, 2, 3], 0)).toThrow();
  });
});

describe("calcularRegresionLineal", () => {
  it("ajusta exactamente una recta perfecta (y = 8 + 2x)", () => {
    // serie [10, 12, 14] equivale a x=[1,2,3], y=[10,12,14]
    // sumaX=6 sumaY=36 sumaXY=76 sumaX2=14
    // b = (3*76 - 6*36) / (3*14 - 6*6) = (228-216)/(42-36) = 12/6 = 2
    // a = (36 - 2*6) / 3 = 24/3 = 8
    const { a, b } = calcularRegresionLineal([10, 12, 14]);
    expect(a).toBeCloseTo(8);
    expect(b).toBeCloseTo(2);
  });

  it("detecta pendiente negativa en una serie decreciente", () => {
    const { b } = calcularRegresionLineal([20, 15, 10, 5]);
    expect(b).toBeLessThan(0);
  });

  it("con una serie constante devuelve pendiente 0 e intercepto igual al valor", () => {
    const { a, b } = calcularRegresionLineal([7, 7, 7, 7]);
    expect(a).toBeCloseTo(7);
    expect(b).toBeCloseTo(0);
  });

  it("con un solo punto devuelve ese valor como intercepto y pendiente 0", () => {
    expect(calcularRegresionLineal([42])).toEqual({ a: 42, b: 0 });
  });

  it("con serie vacia devuelve a=0 b=0", () => {
    expect(calcularRegresionLineal([])).toEqual({ a: 0, b: 0 });
  });
});

describe("proyectar", () => {
  it("proyecta el siguiente periodo usando y = a + b*x", () => {
    // con a=8 b=2 (serie [10,12,14], n=3), el periodo 4 deberia dar 16
    expect(proyectar({ a: 8, b: 2 }, 4)).toBe(16);
  });
});

describe("recomendarReabastecimiento", () => {
  it("calcula max(0, demanda_proyectada + stock_minimo - stock_actual)", () => {
    // 16 + 10 - 5 = 21
    expect(
      recomendarReabastecimiento({ demandaProyectada: 16, stockActual: 5, stockMinimo: 10 })
    ).toBe(21);
  });

  it("nunca devuelve un valor negativo cuando ya sobra stock", () => {
    expect(
      recomendarReabastecimiento({ demandaProyectada: 2, stockActual: 50, stockMinimo: 10 })
    ).toBe(0);
  });
});
