/** MySQL devuelve DECIMAL como texto ("85000.00"): lo pasamos a número para la API. */
export const decimalANumero = {
  to: (v?: number | null) => v,
  from: (v?: string | number | null) => (v === null || v === undefined ? null : Number(v)),
};
