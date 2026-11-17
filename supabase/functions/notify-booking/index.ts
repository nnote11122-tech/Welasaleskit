import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class TelegramDeliveryError extends Error {
  constructor(public reason: string, message: string) { super(message); }
}

function telegramError(status: number, description: string) {
  if (status === 401) return new TelegramDeliveryError('invalid_token', 'Telegram ไม่ยอมรับ Bot Token ที่ Agentwela อ่านได้ กรุณาตรวจค่าที่บันทึกใน TELEGRAM_BOT_TOKEN');
  if (status === 404) return new TelegramDeliveryError('telegram_endpoint_not_found', 'Telegram ไม่พบปลายทาง API กรุณาตรวจว่า TELEGRAM_BOT_TOKEN เป็น token ทั้งชุด ไม่ใช่ชื่อ bot หรือ URL');
  if (status === 403) return new TelegramDeliveryError('bot_forbidden', 'Bot ส่งข้อความไม่ได้ กรุณาตรวจว่า bot ยังอยู่ในกลุ่มและมีสิทธิ์ส่งข้อความ');
  if (/chat not found/i.test(description)) return new TelegramDeliveryError('chat_not_found', 'ไม่พบกลุ่ม Telegram กรุณาตรวจ TELEGRAM_CHAT_ID และเพิ่ม bot เข้ากลุ่ม');
  if (status === 429) return new TelegramDeliveryError('rate_limited', 'Telegram จำกัดการส่งชั่วคราว กรุณารอสักครู่แล้วส่งแจ้งเตือนอีกครั้ง');
  return new TelegramDeliveryError('delivery_failed', 'Telegram ไม่รับข้อความ กรุณาให้ผู้ดูแลตรวจ log ของ notify-booking');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    if (typeof body.booking_id !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.booking_id)) {
      return json({ error: "Valid booking_id is required" }, 400);
    }
    // Read saved data through the caller's RLS, not browser-supplied prices or URLs.
    const { data: booking, error } = await supabase.from("bookings")
      .select("*").eq("id", body.booking_id).single();
    if (error || !booking) return json({ error: "Booking not found or access denied" }, 404);
    if (booking.status !== "approved") return json({ error: "Booking is not confirmed" }, 409);
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim();
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID")?.trim();


    const details = booking.quote_snapshot?.quotation;
    const price = Number(booking.offer_price);
    const floorPrice = Number(booking.floor_price);
    const below = floorPrice ? floorPrice - price : 0;
    const caption = [
      `🏠 จองห้องสำเร็จ (${booking.building === "wela2" ? "WELA 2" : "WELA 1"})`,
      `📌 ห้อง: ${booking.unit_no}`,
      `👤 ลูกค้า: ${booking.customer_name}`,
      `📞 โทร: ${booking.customer_phone}`,
      `💰 ราคาเสนอ: ${price.toLocaleString("th-TH")} บาท`,
      floorPrice ? `🏷 Floor Price: ${floorPrice.toLocaleString("th-TH")} บาท` : "",
      below > 0 ? `⚠️ ต่ำกว่า Floor ${below.toLocaleString("th-TH")} บาท` : "",
      below < 0 ? `✅ สูงกว่า Floor ${Math.abs(below).toLocaleString("th-TH")} บาท` : "",
      details?.floor ? `🏢 ชั้น: ${details.floor}` : "",
      details?.area ? `📐 พื้นที่: ${details.area} ตร.ม.` : "",
      booking.priv_added ? `➕ เพิ่ม: ${booking.priv_added}` : "",
      booking.priv_removed ? `➖ ตัด: ${booking.priv_removed}` : "",
      "✅ บันทึกการจองเรียบร้อย",
      `เลขที่จอง: ${booking.booking_code}`,
    ].filter(Boolean).join("\n");
    const sendTelegram = async () => {
    if (!token || !chatId) throw new TelegramDeliveryError('configuration_error', "ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ใน Agentwela");
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
      console.error('[notify-booking]', JSON.stringify({ reason: 'token_format_invalid', hasColon: token.includes(':'), hasWhitespace: /\s/.test(token) }));
      throw new TelegramDeliveryError('token_format_invalid', 'ค่าที่ Agentwela อ่านจาก TELEGRAM_BOT_TOKEN ไม่ใช่รูปแบบ token ของ Telegram ต้องเป็นตัวเลข ตามด้วย : และตัวอักษร โดยไม่มีข้อความอื่นปน');
    }
    const send = async (method: string, payload: Record<string, unknown>) => {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, ...payload }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const error = telegramError(response.status, String(result.description ?? ''));
        console.error('[notify-booking]', JSON.stringify({ method, status: response.status, reason: error.reason }));
        throw error;
      }
    };
    if (booking.snapshot_url) {
      try {
        await send("sendPhoto", {
          photo: booking.snapshot_url,
          caption: caption.length <= 1024 ? caption : `🏠 ห้อง ${booking.unit_no}`,
        });
      } catch {
        // Preserve the quotation URL and booking details when Telegram cannot fetch the image.
        await send("sendMessage", { text: caption.slice(0, 3500) + "\nรูปใบเสนอราคา: " + booking.snapshot_url });
        return "Telegram ส่งรายละเอียดและลิงก์แล้ว แต่โหลดรูปไม่สำเร็จ";
      }
      if (caption.length > 1024) await send("sendMessage", { text: caption.slice(0, 4096) });
    } else {
      await send("sendMessage", { text: caption.slice(0, 4096) });
    }
    return null;
    };

    const sendLine = async () => {
      const accessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")?.trim();
      const groupId = Deno.env.get("LINE_GROUP_ID")?.trim();
      if (!accessToken && !groupId) return { skipped: true };
      if (!accessToken || !groupId) throw new Error("LINE ยังตั้งค่า LINE_CHANNEL_ACCESS_TOKEN หรือ LINE_GROUP_ID ไม่ครบ");
      const messages: Record<string, unknown>[] = [{ type: "text", text: caption.slice(0, 5000) }];
      if (booking.snapshot_url) messages.push({
        type: "image", originalContentUrl: booking.snapshot_url, previewImageUrl: booking.snapshot_url,
      });
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "X-Line-Retry-Key": booking.id },
        body: JSON.stringify({ to: groupId, messages }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 409 && response.headers.get("x-line-accepted-request-id")) return { skipped: false };
      if (!response.ok) {
        const reason = response.status === 401 ? "Channel access token ไม่ถูกต้อง"
          : response.status === 429 ? "เกินโควตาหรือจำกัดการส่งข้อความ"
          : response.status === 403 ? "Bot ไม่มีสิทธิ์ส่งข้อความ"
          : "กรุณาตรวจ Group ID, bot ในกลุ่ม และ URL รูปใบเสนอราคา";
        console.error('[notify-booking]', JSON.stringify({ channel: "line", status: response.status }));
        throw new Error(`LINE ส่งไม่สำเร็จ: ${reason}`);
      }
      return { skipped: false };
    };

    const [telegram, line] = await Promise.allSettled([sendTelegram(), sendLine()]);
    const telegramSent = telegram.status === "fulfilled";
    const lineSent = line.status === "fulfilled" && !line.value.skipped;
    const failures: string[] = [];
    if (telegram.status === "rejected") failures.push(telegram.reason instanceof TelegramDeliveryError
      ? telegram.reason.message : "เชื่อมต่อ Telegram ไม่สำเร็จ");
    if (line.status === "rejected") failures.push(line.reason instanceof Error ? line.reason.message : "เชื่อมต่อ LINE ไม่สำเร็จ");
    const channels = {
      telegram: telegramSent ? "sent" : "failed",
      line: lineSent ? "sent" : line.status === "fulfilled" ? "not_configured" : "failed",
    };
    if (!telegramSent && !lineSent) return json({
      ok: false, error: failures.join(" / "),
      reason: telegram.status === "rejected" && telegram.reason instanceof TelegramDeliveryError ? telegram.reason.reason : "delivery_failed",
      channels,
    }, 502);
    if (telegram.status === "fulfilled" && telegram.value) failures.push(telegram.value);
    return json({ ok: true, channels, ...(failures.length ? { warning: failures.join(" / ") } : {}) });
  } catch (error) {
    if (error instanceof TelegramDeliveryError) return json({ error: error.message, reason: error.reason }, 502);
    console.error('[notify-booking]', JSON.stringify({ reason: 'unexpected_delivery_failure' }));
    return json({ error: "เชื่อมต่อระบบแจ้งเตือนไม่สำเร็จ กรุณาลองส่งแจ้งเตือนอีกครั้ง" }, 502);
  }
});
