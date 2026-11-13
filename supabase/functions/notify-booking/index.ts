import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID   = Deno.env.get("TELEGRAM_CHAT_ID")   ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      booking_id, unit, building, customer, phone,
      price, floor_price,
      priv_added, priv_removed,
      details, image_url,
    } = body;

    const buildingLabel = building === "wela2" ? "WELA 2" : "WELA 1";
    const below = floor_price ? floor_price - price : 0;
    const priceTag = below > 0
      ? `⚠️ ต่ำกว่า Floor ${below.toLocaleString("th-TH")} บาท`
      : below < 0
      ? `✅ สูงกว่า Floor ${Math.abs(below).toLocaleString("th-TH")} บาท`
      : "";

    const caption = [
      `🏠 จองห้องใหม่ — ${buildingLabel}`,
      ``,
      `📌 ห้อง: ${unit}`,
      `👤 ลูกค้า: ${customer}`,
      `📞 โทร: ${phone}`,
      ``,
      `💰 ราคาเสนอ: ${Number(price).toLocaleString("th-TH")} บาท`,
      floor_price ? `🏷 Floor Price: ${Number(floor_price).toLocaleString("th-TH")} บาท` : "",
      priceTag,
      ``,
      details?.floor ? `🏢 ชั้น: ${details.floor}` : "",
      details?.area  ? `📐 พื้นที่: ${details.area} ตร.ม.` : "",
      priv_added     ? `➕ เพิ่ม: ${priv_added}`   : "",
      priv_removed   ? `➖ ตัด: ${priv_removed}` : "",
    ].filter(Boolean).join("\n");

    const replyMarkup = {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `apr:${booking_id}` },
        { text: "❌ Reject",  callback_data: `rej:${booking_id}` },
      ]],
    };

    if (image_url) {
      // ส่งรูปพร้อม inline button ใน caption (เหมือน working version)
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          photo: image_url,
          caption,
          reply_markup: replyMarkup,
        }),
      });
    } else {
      // fallback: ส่ง text ถ้าไม่มีรูป
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: caption,
          reply_markup: replyMarkup,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
