import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { MAX_IMPORT_BYTES, PRICE_TEMPLATE_UNIT_COUNT, parsePriceCSV, priceTemplateCSV } from '../lib/priceImport';

const money = value => value == null ? '—' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const ACTIONS = { insert: 'เพิ่มใหม่', update: 'แก้ไข', unchanged: 'ไม่เปลี่ยน' };
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#001a33] disabled:cursor-not-allowed disabled:opacity-50';

export default function PriceImport() {
  const { isManager, user } = useAuth();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [visibleRows, setVisibleRows] = useState(50);
  const busy = ['reading', 'checking', 'saving'].includes(phase);

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([priceTemplateCSV()], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wela-price-template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function chooseFile(event) {
    const selected = event.target.files?.[0];
    setFile(null); setRows([]); setPreview(null); setResult(null); setErrors([]);
    if (!selected) return;
    setPhase('reading');
    try {
      if (!/\.csv$/i.test(selected.name)) throw new Error('กรุณาเลือกไฟล์ CSV หากใช้ Excel ให้บันทึกเป็น CSV UTF-8 ก่อน');
      if (selected.size > MAX_IMPORT_BYTES) throw new Error('ไฟล์ใหญ่เกิน 2 MB กรุณาแบ่งไฟล์แล้วลองใหม่');
      const parsed = parsePriceCSV(await selected.text());
      setFile(selected);
      setRows(parsed.rows);
      setErrors(parsed.errors);
    } catch (error) { setErrors([error.message]); }
    finally { setPhase('idle'); }
  }

  async function checkFile() {
    setErrors([]); setPreview(null); setResult(null); setPhase('checking');
    try {
      const { data, error } = await supabase.rpc('import_prices', {
        rows_data: rows, preview_only: true, source_name: file.name,
      });
      if (error) throw error;
      setPreview(data); setVisibleRows(50);
    } catch (error) { setErrors([error.message || 'ตรวจข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง']); }
    finally { setPhase('idle'); }
  }

  async function confirmImport() {
    if (!preview || busy) return;
    setErrors([]); setPhase('saving');
    try {
      const { data, error } = await supabase.rpc('import_prices', {
        rows_data: rows, preview_only: false,
        expected_fingerprint: preview.fingerprint, source_name: file.name,
      });
      if (error) throw error;
      setResult(data); setPreview(null); setRows([]);
    } catch (error) {
      setPreview(null);
      setErrors([`${error.message || 'ยังยืนยันผลการนำเข้าไม่ได้'} กรุณากดตรวจข้อมูลอีกครั้งก่อนลองยืนยันใหม่`]);
    } finally { setPhase('idle'); }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#001a33]">
      <header className="border-b border-[#dce2e8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className={`${button} -ml-4 hover:bg-[#edf1f5]`}><ArrowLeft size={18} aria-hidden="true" /> กลับหน้าโครงการ</Link>
          <span className="text-lg font-bold tracking-widest">WE<span className="text-[#c63e35]">L</span>A</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">นำเข้าราคา</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#465b70]">อัปเดตราคา ส่วนลด และโปรโมชันจากไฟล์ CSV ตรวจรายการเปลี่ยนแปลงก่อนบันทึก</p>
          </div>
          {isManager && <button onClick={downloadTemplate} className={`${button} border border-[#b7c4d0] bg-white hover:bg-[#edf1f5]`}><Download size={17} aria-hidden="true" /> ดาวน์โหลดไฟล์ตัวอย่าง</button>}
        </div>

        {!isManager ? (
          <section className="rounded-xl border border-[#dce2e8] bg-white p-7">
            <h2 className="text-xl font-semibold">บัญชีนี้ยังไม่มีสิทธิ์นำเข้าราคา</h2>
            <p className="mt-3 text-sm leading-7 text-[#465b70]">หน้านี้สำหรับผู้จัดการที่ได้รับสิทธิ์ กรุณาให้ผู้ดูแลกำหนดสิทธิ์ manager ให้บัญชี {user?.email}</p>
          </section>
        ) : (
          <div className="space-y-6">
            <section aria-labelledby="file-heading" className="rounded-xl border border-[#dce2e8] bg-white p-5 sm:p-7">
              <h2 id="file-heading" className="text-xl font-semibold">เลือกไฟล์ราคา</h2>
              <p id="file-help" className="mt-2 text-sm leading-7 text-[#465b70]">ไฟล์ตัวอย่างมี WELA 1 และ WELA 2 รวม {PRICE_TEMPLATE_UNIT_COUNT} ห้อง พร้อมอาคาร เลขห้อง ชั้น ประเภท และพื้นที่ กรอกราคาและโปรโมชันก่อนบันทึกเป็น CSV UTF-8 รองรับไม่เกิน 2 MB และ 1,000 แถวต่อครั้ง</p>
              <p className="mt-2 text-sm leading-7 text-[#465b70]">หากนำเข้าเฉพาะบางห้อง ให้ลบแถวที่ไม่ใช้ หากต้องการเก็บส่วนลดหรือโปรโมชันเดิม ให้ลบคอลัมน์นั้นออกจากไฟล์แทนการปล่อยช่องว่าง</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-[#9aafc1] bg-[#f8fafc] p-5">
                <FileSpreadsheet size={28} className="shrink-0 text-[#526c83]" aria-hidden="true" />
                <div className="min-w-0 flex-1 basis-48">
                  <label htmlFor="price-file" className="block text-sm font-medium">ไฟล์ CSV</label>
                  <input ref={input} id="price-file" type="file" accept=".csv,text/csv" onChange={chooseFile} disabled={busy} aria-describedby="file-help" className="mt-2 block w-full text-sm text-[#465b70] file:mr-3 file:rounded-md file:border-0 file:bg-[#001a33] file:px-3 file:py-2 file:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#001a33]" />
                </div>
                <button onClick={checkFile} disabled={!rows.length || busy || !!result} className={`${button} bg-[#001a33] text-white hover:bg-[#143c60]`}>
                  {phase === 'checking' ? <Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload size={17} aria-hidden="true" />}
                  {phase === 'checking' ? 'กำลังตรวจข้อมูล…' : 'ตรวจข้อมูลและดูตัวอย่าง'}
                </button>
              </div>
              <div className="mt-5 space-y-1 text-sm leading-7 text-[#465b70]">
                <p>ต้องมี <code>building</code>, <code>unit_no</code> และ <code>base_price</code> โดย building ใช้ <code>wela1</code> หรือ <code>wela2</code></p>
                <p>ห้องเดิมจะอัปเดตตามอาคารและเลขห้อง คอลัมน์ที่ไม่มีในไฟล์จะคงค่าเดิม ส่วนช่องว่างในคอลัมน์ที่ส่งมาจะล้างค่านั้น</p>
                <p>นำเข้าเฉพาะราคาและโปรโมชัน สถานะห้องและรายการจองคงเดิม</p>
              </div>
              {rows.length > 0 && !preview && !result && <p className="mt-4 text-sm font-medium" role="status">อ่านไฟล์แล้ว {rows.length.toLocaleString('th-TH')} แถว พร้อมตรวจเทียบกับราคาปัจจุบัน</p>}
            </section>

            {errors.length > 0 && <section role="alert" className="rounded-xl border border-[#edbcb7] bg-[#fff5f3] p-5 text-[#8f261e]">
              <h2 className="flex items-center gap-2 font-semibold"><AlertCircle size={18} aria-hidden="true" /> ยังนำเข้าไม่ได้</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">{errors.slice(0, 15).map((error, index) => <li key={index}>{error}</li>)}</ul>
              {errors.length > 15 && <p className="mt-3 text-sm">พบทั้งหมด {errors.length} จุด แสดง 15 จุดแรก กรุณาแก้ไฟล์แล้วเลือกใหม่</p>}
            </section>}

            {preview && <section aria-labelledby="preview-heading" className="overflow-hidden rounded-xl border border-[#dce2e8] bg-white">
              <div className="p-5 sm:p-7">
                <h2 id="preview-heading" className="text-xl font-semibold">ตรวจรายการก่อนนำเข้า</h2>
                <p className="mt-2 break-all text-sm text-[#465b70]">{file.name}</p>
                <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                  {[['เพิ่มใหม่', preview.inserted], ['แก้ไข', preview.updated], ['ไม่เปลี่ยน', preview.unchanged]].map(([label, value]) => <div key={label}><dt className="text-[#465b70]">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd></div>)}
                </dl>
              </div>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="ตารางเปรียบเทียบราคา">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <caption className="sr-only">เปรียบเทียบราคาขายและรายละเอียดคอลัมน์ที่เปลี่ยนแปลง</caption>
                  <thead className="border-y border-[#dce2e8] bg-[#edf2f6] text-[#3a5269]"><tr>{['อาคาร', 'เลขห้อง', 'รายการ', 'ราคาเดิม', 'ราคาใหม่'].map(label => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead>
                  <tbody>{preview.rows.slice(0, visibleRows).map(row => <tr key={`${row.building}/${row.unit_no}`} className="border-b border-[#edf1f5]">
                    <td className="px-5 py-3 uppercase">{row.building}</td><td className="px-5 py-3 font-medium">{row.unit_no}</td>
                    <td className={`px-5 py-3 ${row.action === 'unchanged' ? 'text-[#52677b]' : 'font-medium text-[#954016]'}`}>
                      {ACTIONS[row.action]}
                      {row.changes?.length > 0 && <details className="mt-1 max-w-sm whitespace-normal text-xs font-normal leading-6 text-[#465b70]"><summary className="cursor-pointer rounded focus-visible:outline focus-visible:outline-2">ดู {row.changes.length} คอลัมน์</summary><ul className="mt-2 space-y-1">{row.changes.map(change => <li key={change.column} className="break-words"><span className="font-medium">{change.column}</span>: {change.before == null ? '(ว่าง)' : String(change.before)} → {change.after == null ? '(ล้างค่า)' : String(change.after)}</li>)}</ul></details>}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{money(row.old_price)}</td><td className="px-5 py-3 tabular-nums">{money(row.new_price)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              {preview.rows.length > visibleRows && <button onClick={() => setVisibleRows(count => count + 50)} className={`${button} m-5 border border-[#b7c4d0] hover:bg-[#edf1f5]`}>แสดงเพิ่ม 50 แถว ({visibleRows}/{preview.rows.length})</button>}
              <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-7">
                <p className="max-w-xl text-sm leading-7 text-[#465b70]">{preview.inserted + preview.updated ? `ยืนยันแล้วจะบันทึกทั้ง ${rows.length} แถว รวมส่วนลดและโปรโมชัน เปิด “ดูคอลัมน์” เพื่อตรวจรายละเอียด` : 'ข้อมูลตรงกับราคาปัจจุบันทั้งหมด ไม่ต้องนำเข้าซ้ำ'}</p>
                <button onClick={confirmImport} disabled={busy || preview.inserted + preview.updated === 0} className={`${button} bg-[#b63c33] text-white hover:bg-[#982f28]`}>
                  {phase === 'saving' && <Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  {phase === 'saving' ? 'กำลังบันทึก…' : 'ยืนยันนำเข้าราคา'}
                </button>
              </div>
            </section>}

            {result && <section role="status" className="rounded-xl border border-[#adcdbd] bg-[#eff8f3] p-6 text-[#1b5238]">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><CheckCircle2 size={22} aria-hidden="true" /> นำเข้าราคาเรียบร้อย</h2>
              <p className="mt-3 text-sm leading-7">เพิ่ม {result.inserted} ห้อง · แก้ไข {result.updated} ห้อง · ไม่เปลี่ยน {result.unchanged} ห้อง</p>
              <p className="mt-1 text-sm leading-7">ราคาพร้อมใช้ในใบเสนอราคาแล้ว เลือกไฟล์ใหม่เมื่อต้องการนำเข้าอีกครั้ง</p>
            </section>}
          </div>
        )}
      </main>
    </div>
  );
}
