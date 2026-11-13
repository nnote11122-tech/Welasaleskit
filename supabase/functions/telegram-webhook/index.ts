import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN        = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const body = await req.json();
    if (!body.callback_query) return new Response("ok", { status: 200 });

    const cb          = body.callback_query;
    const data        = cb.data as string; // "apr:UUID" or "rej:UUID"
    const managerName = cb.from?.first_name || "Manager";
    const msg         = cb.message;

    // ตอบ Telegram ทันที หยุด timeout
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id, text: "กำลังดำเนินการ..." }),
    });

    const [actionCode, bookingId] = data.split(":");
    const isApprove = actionCode === "apr";

    console.log("action:", actionCode, "bookingId:", bookingId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    // ดึงข้อมูล booking
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("unit_no, building")
      .eq("id", bookingId)
      .single();

    console.log("booking:", JSON.stringify(booking), "err:", fetchErr?.message);

    if (!booking) {
      return new Response("booking not found", { status: 200 });
    }

    const { unit_no, building } = booking;
    const bookingStatus = isApprove ? "approved"  : "rejected";
    const unitStatus    = isApprove ? "reserved"  : "available";
    const statusLabel   = isApprove ? "✅ อนุมัติการจองแล้ว" : "❌ ปฏิเสธการจองแล้ว";
    const buildingLabel = building === "wela2" ? "WELA 2" : "WELA 1";

    // อัพเดท bookings via REST
    const bRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_SERVICE,
        "Authorization": `Bearer ${SUPABASE_SERVICE}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ status: bookingStatus }),
    });
    console.log("bookings update:", bRes.status, await bRes.text());

    // อัพเดท units via REST
    const unitBody: Record<string, string | null> = { status: unitStatus };
    if (!isApprove) unitBody.customer_name = null;
    const uRes = await fetch(`${SUPABASE_URL}/rest/v1/units?unit_no=eq.${unit_no}&building=eq.${building}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_SERVICE,
        "Authorization": `Bearer ${SUPABASE_SERVICE}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(unitBody),
    });
    console.log("units update:", uRes.status, await uRes.text());

    // Edit caption + ลบปุ่ม
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        caption: `${msg.caption || ""}\n\n━━━━━━━━━━━━━\n${statusLabel}\n${buildingLabel} ห้อง ${unit_no}\nโดย: ${managerName}`,
        reply_markup: { inline_keyboard: [] },
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("catch:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 });
  }
});
