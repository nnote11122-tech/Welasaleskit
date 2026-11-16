import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Workbook } from '@oai/artifact-tool';
import { PRICE_COLUMNS, NUMERIC_COLUMNS, parsePriceCSV } from '../../src/lib/priceImport.js';

const rows = JSON.parse(await fs.readFile(new URL('./source-prices.json', import.meta.url), 'utf8'));
assert.equal(rows.length, 392);
const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Prices');
sheet.getRangeByIndexes(0, 0, rows.length + 1, PRICE_COLUMNS.length).values = [
  PRICE_COLUMNS,
  ...rows.map(row => PRICE_COLUMNS.map(column => row[column] ?? null)),
];
workbook.recalculate();
const matrix = sheet.getRangeByIndexes(0, 0, rows.length + 1, PRICE_COLUMNS.length).values;
const escapeCSV = value => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
};
const csv = '\uFEFF' + matrix.map(row => row.map(escapeCSV).join(',')).join('\r\n');
const parsed = parsePriceCSV(csv);
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.rows.length, rows.length);
for (let i = 0; i < rows.length; i++) {
  for (const column of PRICE_COLUMNS) {
    const expected = rows[i][column] ?? null;
    assert.equal(parsed.rows[i][column], expected, `Row ${i + 2}, ${column}`);
  }
}
const filename = new URL('./wela-real-prices-2026-11-13.csv', import.meta.url);
await fs.writeFile(filename, csv, 'utf8');
const written = await fs.readFile(filename, 'utf8');
assert.equal(parsePriceCSV(written).rows.length, 392);
console.log(JSON.stringify({ file: filename.pathname, rows: 392, columns: PRICE_COLUMNS.length,
  buildings: Object.fromEntries(['wela1','wela2'].map(b => [b, rows.filter(r => r.building === b).length])),
  bytes: Buffer.byteLength(csv), verified: true }));
