import assert from 'node:assert/strict';
import { test } from 'node:test';
import Papa from 'papaparse';
import { parsePriceCSV, priceTemplateCSV } from '../src/lib/priceImport.js';

test('template includes 392 distinct rooms, real metadata, and blank prices', () => {
  const template = Papa.parse(priceTemplateCSV(), { header: true }).data;
  assert.equal(template.length, 392);
  assert.equal(template.filter(r => r.building === 'wela1').length, 196);
  assert.equal(template.filter(r => r.building === 'wela2').length, 196);
  assert.equal(new Set(template.map(r => `${r.building}/${r.unit_no}`)).size, 392);
  assert.ok(template.every(r => r.floor && r.unit_type && Number(r.area_sqm) > 0));
  assert.ok(template.every(r => r.base_price === '' && r.freebie1 === '' && r.registration_disc === ''));
  const first = template.find(r => r.building === 'wela1' && r.unit_no === '201');
  assert.equal(first.area_sqm, '47.27');
  assert.equal(first.unit_type, 'Exclusive A 2 Bed');
  // Filling prices produces an importable batch without changing the seeded room data.
  const result = parsePriceCSV(Papa.unparse(template.map(r => ({ ...r, base_price: '2500000' }))));
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 392);
  assert.equal(result.rows[0].base_price, 2500000);
});
test('preserves room identifiers, quoted commas, and multiline promotions', () => {
  const result = parsePriceCSV('building,unit_no,base_price,freebie1\nwela1,0201,"2,500,000","ของแถม\nสองรายการ"');
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].unit_no, '0201');
  assert.equal(result.rows[0].base_price, 2500000);
  assert.equal(result.rows[0].freebie1, 'ของแถม\nสองรายการ');
  assert.equal('booking_fee' in result.rows[0], false);
});
test('distinguishes omitted fields from intentional blank values', () => {
  const { rows } = parsePriceCSV('building,unit_no,base_price,freebie1\nwela1,201,100,');
  assert.equal(rows[0].freebie1, null);
  assert.equal('freebie2' in rows[0], false);
});
test('blocks malformed values, duplicate headers/rooms and protected columns', () => {
  for (const csv of [
    'building,unit_no,base_price\nwela1,201,-100',
    'building,unit_no,base_price\nwela1,201,"2,50,000"',
    'building,unit_no,base_price\nwela1,201,abc',
    'building,unit_no,base_price\nwela1,201,',
    'building,unit_no,base_price\nwela1,201,100\nwela1,201,200',
    'building,unit_no,base_price\nwela3,201,100',
    'building,unit_no,base_price,base_price\nwela1,201,100,200',
    'building,unit_no,base_price,id\nwela1,201,100,1',
    'building,unit_no,base_price\nwela1,201,100,200',
    'building,unit_no\nwela1,201',
    'building,unit_no,base_price',
  ]) {
    const result = parsePriceCSV(csv);
    assert.ok(result.errors.length, csv);
    assert.deepEqual(result.rows, []);
  }
});
test('accepts the same room number in separate buildings', () => {
  const result = parsePriceCSV('building,unit_no,base_price\nwela1,201,100\nwela2,201,200');
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 2);
});
test('blocks oversized batches', () => {
  const result = parsePriceCSV('building,unit_no,base_price\n' + Array.from({length:1001},(_,i)=>`wela1,${i},100`).join('\n'));
  assert.ok(result.errors.length);
});
