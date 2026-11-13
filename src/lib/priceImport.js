import Papa from 'papaparse';
import templateUnits from '../data/priceTemplateUnits.json' with { type: 'json' };

export const PRICE_TEMPLATE_UNIT_COUNT = templateUnits.length;

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const NUMERIC_COLUMNS = [
  'area_sqm', 'base_price', 'registration_disc', 'up_price_floor',
  'floor_price_add', 'furniture_disc', 'free_transfer', 'balloon_3',
  'booking_fee', 'down_total', 'inst_11', 'special_disc',
  'net_price_ontop', 'voucher_disc', 'net_price',
];
export const PRICE_COLUMNS = [
  'building', 'unit_no', 'floor', 'unit_type', ...NUMERIC_COLUMNS,
  ...Array.from({ length: 9 }, (_, i) => `freebie${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `note${i + 1}`),
];
const REQUIRED = ['building', 'unit_no', 'base_price'];

export function parsePriceCSV(text) {
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' });
  const errors = parsed.errors.map(e => `ไฟล์ CSV ไม่สมบูรณ์: ${e.message}`);
  const [header = [], ...data] = parsed.data;
  const columns = header.map(value => value.trim().toLowerCase());
  if (new Set(columns).size !== columns.length) errors.push('ชื่อคอลัมน์ซ้ำ กรุณาใช้ชื่อคอลัมน์แต่ละชื่อเพียงครั้งเดียว');
  const unknown = columns.filter(c => !PRICE_COLUMNS.includes(c));
  if (unknown.length) errors.push(`ไม่รองรับคอลัมน์: ${unknown.join(', ')} กรุณาใช้หัวคอลัมน์ตามไฟล์ตัวอย่าง`);
  for (const field of REQUIRED) if (!columns.includes(field)) errors.push(`ไม่พบคอลัมน์ที่จำเป็น: ${field}`);
  if (!data.length) errors.push('ไฟล์ยังไม่มีข้อมูลราคา');
  if (data.length > MAX_IMPORT_ROWS) errors.push('รองรับไม่เกิน 1,000 แถวต่อครั้ง กรุณาแบ่งไฟล์');
  if (errors.length) return { rows: [], errors, total: data.length };

  const rows = [];
  const seen = new Set();
  for (const [index, values] of data.entries()) {
    const line = index + 2;
    const before = errors.length;
    if (values.length !== columns.length) {
      errors.push(`แถวข้อมูล ${line}: จำนวนช่องไม่ตรงกับหัวคอลัมน์ ถ้าตัวเลขมีเครื่องหมายคอมมาต้องใส่เครื่องหมายคำพูดครอบ`);
      continue;
    }
    const row = {};
    columns.forEach((column, i) => {
      const value = values[i].trim();
      if (NUMERIC_COLUMNS.includes(column)) {
        if (!value) row[column] = null;
        else {
          const valid = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
          const number = Number(value.replaceAll(',', ''));
          if (!valid || !Number.isFinite(number) || number > Number.MAX_SAFE_INTEGER) {
            errors.push(`แถวข้อมูล ${line}: ${column} ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป เช่น 2500000 หรือ 22.9`);
          } else row[column] = number;
        }
      } else {
        row[column] = value || null;
        if (value.length > 2000) errors.push(`แถวข้อมูล ${line}: ${column} ยาวเกิน 2,000 ตัวอักษร`);
      }
    });
    if (!['wela1', 'wela2'].includes(row.building)) errors.push(`แถวข้อมูล ${line}: building ต้องเป็น wela1 หรือ wela2`);
    if (!/^[0-9A-Za-z][0-9A-Za-z._/-]{0,31}$/.test(row.unit_no || '')) errors.push(`แถวข้อมูล ${line}: กรุณาระบุ unit_no ให้ถูกต้อง`);
    if (row.base_price == null) errors.push(`แถวข้อมูล ${line}: ต้องระบุ base_price`);
    const key = `${row.building}/${row.unit_no}`;
    if (seen.has(key)) errors.push(`แถวข้อมูล ${line}: อาคารและเลขห้องซ้ำ (${key})`);
    seen.add(key);
    if (errors.length === before) rows.push(row);
  }
  return { rows: errors.length ? [] : rows, errors, total: data.length };
}

export function priceTemplateCSV() {
  return '\uFEFF' + Papa.unparse({
    fields: PRICE_COLUMNS,
    data: templateUnits.map(unit => PRICE_COLUMNS.map(column => unit[column] ?? '')),
  });
}
