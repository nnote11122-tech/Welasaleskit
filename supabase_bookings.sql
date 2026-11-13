-- ============================================================
-- Bookings table สำหรับ WELA
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  building       text        NOT NULL,
  unit_no        text        NOT NULL,
  customer_name  text        NOT NULL,
  customer_phone text        NOT NULL,
  offer_price    numeric,
  floor_price    numeric,
  sales_name     text,
  priv_removed   text,
  priv_added     text,
  quote_snapshot jsonb,
  snapshot_url   text,
  status         text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket สำหรับเก็บรูป quotation
-- (ทำใน Supabase Dashboard → Storage → New bucket → ชื่อ "quotations" → Public)
