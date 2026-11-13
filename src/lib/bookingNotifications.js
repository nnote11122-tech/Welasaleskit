import { supabase } from './supabaseClient';

export async function notifyBooking(bookingId) {
  const { data, error } = await supabase.functions.invoke('notify-booking', {
    body: { booking_id: bookingId },
  });
  if (error) {
    let details;
    try { details = await error.context?.json(); } catch { /* Response may not be JSON. */ }
    throw new Error(details?.error || 'ส่งแจ้งเตือนไม่สำเร็จ กรุณาตรวจการเชื่อมต่อและลองอีกครั้ง');
  }
  if (!data?.ok) throw new Error(data?.error || 'ส่งแจ้งเตือนไม่สำเร็จ');
  return data;
}
