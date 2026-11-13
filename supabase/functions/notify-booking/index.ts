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
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!token || !chatId) return json({ error: "Telegram secrets are not configured" }, 503);

    const details = booking.quote_snapshot?.quotation;
    const price = Number(booking.offer_price);
    const floorPrice = Number(booking.floor_price);
    const below = floorPrice ? floorPrice - price : 0;
    const caption = [
      `🏠 Agentwela — จองห้องสำเร็จ (${booking.building === "wela2" ? "WELA 2" : "WELA 1"})`,
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
      "✅ บันทึกการจองเรียบร้อย ไม่ต้องอนุมัติ",
      `เลขที่จอง: ${booking.id}`,
    ].filter(Boolean).join("\n");
    const send = async (method: string, payload: Record<string, unknown>) => {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, ...payload }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Telegram delivery failed");
    };
    if (booking.snapshot_url) {
      try {
        await send("sendPhoto", {
          photo: booking.snapshot_url,
          caption: caption.length <= 1024 ? caption : `🏠 Agentwela — ห้อง ${booking.unit_no}`,
        });
      } catch {
        // Preserve the quotation URL and booking details when Telegram cannot fetch the image.
        await send("sendMessage", { text: caption.slice(0, 3500) + "\nรูปใบเสนอราคา: " + booking.snapshot_url });
        return json({ ok: true, warning: "Photo delivery failed; quotation link sent" });
      }
      if (caption.length > 1024) await send("sendMessage", { text: caption.slice(0, 4096) });
    } else {
      await send("sendMessage", { text: caption.slice(0, 4096) });
    }
    return json({ ok: true });
  } catch {
    return json({ error: "Unable to send Telegram notification" }, 502);
  }
});
