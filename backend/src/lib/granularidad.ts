export type Granularidad = "diaria" | "semanal" | "mensual";

// Unidad valida para date_trunc() de PostgreSQL correspondiente a cada
// granularidad expuesta en la API (usada por prediccion y reportes).
export const TRUNC_UNIDAD: Record<Granularidad, string> = {
  diaria: "day",
  semanal: "week",
  mensual: "month",
};
