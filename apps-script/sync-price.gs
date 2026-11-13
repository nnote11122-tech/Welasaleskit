// Google Apps Script — sync WELA price sheet → Supabase
// วิธีใช้: Tools → Script editor → วางโค้ดนี้ → Save → Run syncAll
// หรือตั้ง Trigger: syncAll ทุก 1 ชั่วโมง / on edit

const SUPABASE_URL = "https://lpwjkqxaajoohqxyjhag.supabase.co";
const SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty("SUPABASE_SERVICE_ROLE_KEY");
const TABLE_NAME   = "price";

const BUILDING_SHEETS = {
  "Wela1": "wela1",
  "Wela2": "wela2",
};

const ALLOWED_EMAILS = [
  "nnote1985@gmail.com",
];

const HEADER_ROWS = 2;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🔄 Sync Supabase")
    .addItem("Sync All Buildings", "syncAll")
    .addToUi();
}

function checkPermission() {
  const email = Session.getActiveUser().getEmail();
  if (!ALLOWED_EMAILS.includes(email)) {
    SpreadsheetApp.getUi().alert(`❌ ไม่มีสิทธิ์ sync\n\nEmail: ${email}`);
    return false;
  }
  return true;
}

function syncAll() {
  if (!checkPermission()) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let totalSynced = 0;
  for (const [sheetName, buildingKey] of Object.entries(BUILDING_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) { Logger.log(`Sheet "${sheetName}" not found — skipped`); continue; }
    Logger.log(`Syncing ${sheetName} → building=${buildingKey}`);
    totalSynced += syncSheet(sheet, buildingKey);
  }
  SpreadsheetApp.getUi().alert(`✅ Sync เสร็จสิ้น\n\nรวม ${totalSynced} ห้อง`);
}

function syncSheet(sheet, buildingKey) {
  const rows    = sheet.getDataRange().getValues();
  const records = [];

  for (let i = HEADER_ROWS; i < rows.length; i++) {
    const r      = rows[i];
    const unitNo = String(r[1]).trim();
    if (!unitNo) continue;

    records.push({
      building:          buildingKey,
      unit_no:           unitNo,
      floor:             String(r[2]).trim()  || null,
      area_sqm:          toNum(r[3]),
      unit_type:         String(r[4]).trim()  || null,
      base_price:        toNum(r[6]),
      registration_disc: toNum(r[7]),
      up_price_floor:    toNum(r[9]),
      floor_price_add:   toNum(r[10]),
      furniture_disc:    toNum(r[12]),
      free_transfer:     toNum(r[13]),
      balloon_3:         toNum(r[14]),
      booking_fee:       toNum(r[15]),
      down_total:        toNum(r[16]),
      inst_11:           toNum(r[17]),
      // r[18] = count ฟรีเครื่องใช้ไฟฟ้า — ข้าม
      freebie1:          String(r[19]).trim() || null,  // Col T
      freebie2:          String(r[20]).trim() || null,  // Col U
      freebie3:          String(r[21]).trim() || null,  // Col V
      freebie4:          String(r[22]).trim() || null,  // Col W
      freebie5:          String(r[23]).trim() || null,  // Col X
      freebie6:          String(r[24]).trim() || null,  // Col Y
      freebie7:          String(r[25]).trim() || null,  // Col Z
      freebie8:          String(r[26]).trim() || null,  // Col AA
      freebie9:          String(r[27]).trim() || null,  // Col AB
      special_disc:      toNum(r[28]),                  // Col AC
      voucher_disc:      toNum(r[29]),                  // Col AD
      net_price:         toNum(r[30]),                  // Col AE
      note1:             String(r[31]).trim() || null,  // Col AF
      note2:             String(r[32]).trim() || null,  // Col AG
      note3:             String(r[33]).trim() || null,  // Col AH
      note4:             String(r[34]).trim() || null,  // Col AI
      note5:             String(r[35]).trim() || null,  // Col AJ
      note6:             String(r[36]).trim() || null,  // Col AK
      note7:             String(r[37]).trim() || null,  // Col AL
      note8:             String(r[38]).trim() || null,  // Col AM
    });
  }

  if (records.length === 0) { Logger.log("No records to sync"); return 0; }

  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=building,unit_no`,
      {
        method: "POST",
        headers: {
          "apikey":        SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Content-Type":  "application/json",
          "Prefer":        "resolution=merge-duplicates,return=minimal",
        },
        payload:            JSON.stringify(batch),
        muteHttpExceptions: true,
      }
    );
    Logger.log(`Batch ${i + 1}–${Math.min(i + BATCH_SIZE, records.length)}: HTTP ${res.getResponseCode()} | ${res.getContentText().substring(0, 200)}`);
  }

  Logger.log(`Done — ${records.length} records synced for building=${buildingKey}`);
  return records.length;
}

function toNum(v) {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}
