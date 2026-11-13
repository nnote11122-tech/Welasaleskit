// Google Apps Script — sync WELA price sheet → Supabase
// วิธีใช้: Tools → Script editor → วางโค้ดนี้ → Save → Run syncAll
// หรือตั้ง Trigger: syncAll ทุก 1 ชั่วโมง / on edit

const SUPABASE_URL = "https://lpwjkqxaajoohqxyjhag.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"; // ใส่ service role key จาก Supabase → Settings → API
const TABLE_NAME   = "price";

// map ชื่อ tab ใน Google Sheet → building key ใน Supabase
// ถ้าชื่อ tab ต่าง ให้แก้ key ด้านซ้าย
const BUILDING_SHEETS = {
  "WELA1": "wela1",
  "WELA2": "wela2",
};

// อีเมลที่อนุญาตให้ sync ได้
const ALLOWED_EMAILS = [
  "nnote1985@gmail.com",
  // เพิ่ม email อื่นได้ที่นี่
];

function checkPermission() {
  const email = Session.getActiveUser().getEmail();
  if (!ALLOWED_EMAILS.includes(email)) {
    SpreadsheetApp.getUi().alert(`❌ ไม่มีสิทธิ์ sync\n\nEmail: ${email}`);
    return false;
  }
  return true;
}

// จำนวนแถว header (WELA sheet มี 2 แถว header)
const HEADER_ROWS = 2;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🔄 Sync Supabase")
    .addItem("Sync All Buildings", "syncAll")
    .addToUi();
}

function syncAll() {
  if (!checkPermission()) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const [sheetName, buildingKey] of Object.entries(BUILDING_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Sheet "${sheetName}" not found — skipped`);
      continue;
    }
    Logger.log(`Syncing ${sheetName} → building=${buildingKey}`);
    syncSheet(sheet, buildingKey);
  }
}

function syncSheet(sheet, buildingKey) {
  const rows    = sheet.getDataRange().getValues();
  const records = [];

  for (let i = HEADER_ROWS; i < rows.length; i++) {
    const r = rows[i];
    const unitNo = String(r[1]).trim();
    if (!unitNo) continue; // ข้ามแถวว่าง

    records.push({
      building:          buildingKey,
      unit_no:           unitNo,
      floor:             String(r[2]).trim()   || null,
      area_sqm:          toNum(r[3]),           // col D: Area / Sq.m.
      unit_type:         String(r[4]).trim()   || null,
      // col E (index 5): Area owner — ไม่บันทึก
      base_price:        toNum(r[6]),           // col G: ราคาตั้งต้น
      registration_disc: toNum(r[7]),           // col H: ส่วนลดลงทะเบียน
      // col I (index 8): ราคา VIP — calculated, ไม่บันทึก
      up_price_floor:    toNum(r[9]),           // col J: Up price / Floor 5000
      floor_price_add:   toNum(r[10]),          // col K: ราคาเพิ่มชั้น
      // col L (index 11): ราคาต่อ ตร.ม. — calculated, ไม่บันทึก
      furniture_disc:    toNum(r[12]),          // col M: ส่วนลดเฟอร์
      free_transfer:     toNum(r[13]),          // col N: Free ค่าใช้จ่ายวันโอน
      balloon_3:         toNum(r[14]),          // col O: บอลลูนดาวน์ งวด 3
      booking_fee:       toNum(r[15]),          // col P: Booking
      down_total:        toNum(r[16]),          // col Q: ดาวน์
      inst_11:           toNum(r[17]),          // col R: ผ่อนดาวน์ 11 งวดละ
      // col S (index 18): จำนวนฟรีเครื่องใช้ไฟฟ้า (count) — ไม่บันทึก
      freebie1:          String(r[19]).trim()  || null, // col T: Promotion 1
      freebie2:          String(r[20]).trim()  || null, // col U: Promotion 2
      freebie3:          String(r[21]).trim()  || null, // col V: Promotion 3
      freebie4:          String(r[22]).trim()  || null, // col W: Promotion 4
      freebie5:          String(r[23]).trim()  || null, // col X: Promotion 5
      freebie6:          String(r[24]).trim()  || null, // col Y: Promotion 6
      // col Z (index 25): empty — ข้าม
      special_disc:      toNum(r[26]),          // col AA: ส่วนลดพิเศษ
      net_price_ontop:   toNum(r[27]),          // col AB: ราคาหลังลด ontop
    });
  }

  if (records.length === 0) {
    Logger.log("No records to sync");
    return;
  }

  // Upsert เป็น batch 50 แถว
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=building,unit_no`, {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
      },
      payload:            JSON.stringify(batch),
      muteHttpExceptions: true,
    });
    Logger.log(`Batch ${i + 1}–${Math.min(i + BATCH_SIZE, records.length)}: HTTP ${res.getResponseCode()} | ${res.getContentText().substring(0, 200)}`);
  }

  Logger.log(`Done — ${records.length} records synced for building=${buildingKey}`);
}

function toNum(v) {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}
