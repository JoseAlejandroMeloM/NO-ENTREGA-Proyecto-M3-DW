// CSV building (add-sales-export). One cell at a time so the export can stream row by row.

/** Text a spreadsheet would run as a formula (OWASP "CSV injection"): =, +, -, @, tab, carriage return. */
const FORMULA_START = /^[=+\-@\t\r]/;

/** One CSV cell: numbers as-is; text prefixed with ' if it looks like a formula, then quoted. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(text) || text !== value ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One CSV line (CRLF, as RFC 4180 says). */
export const csvRow = (cells: Parameters<typeof csvCell>[0][]) => `${cells.map(csvCell).join(',')}\r\n`;
