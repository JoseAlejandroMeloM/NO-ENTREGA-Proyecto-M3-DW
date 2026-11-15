const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Prices are whole Colombian pesos: 2500 → "$ 2.500". */
export const formatCOP = (value: number) => cop.format(value);
