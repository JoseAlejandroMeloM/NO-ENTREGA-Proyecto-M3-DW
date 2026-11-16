import { describe, expect, it } from 'vitest';
import { csvCell, csvRow } from '../src/utils/csv';

describe('csvCell', () => {
  it('escapes text that a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    for (const s of ['+1', '-1', '@SUM(A1)', '\tx']) expect(csvCell(s)).toBe(`"'${s}"`);
  });
  it('quotes commas, quotes and new lines; leaves plain text and numbers alone', () => {
    expect(csvCell('Arroz, 500 g')).toBe('"Arroz, 500 g"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
    expect(csvCell('Leche')).toBe('Leche');
    expect(csvCell(-5)).toBe('-5');
    expect(csvCell(null)).toBe('');
  });
  it('builds a CRLF row', () => {
    expect(csvRow(['a', 1, null])).toBe('a,1,\r\n');
  });
});
