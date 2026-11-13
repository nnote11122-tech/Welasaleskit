-- ============================================================
-- WELA Ramkhamhaeng 186 — Units Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS units (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  building       text         NOT NULL CHECK (building IN ('wela1', 'wela2')),
  unit_no        text         NOT NULL,
  floor          integer      NOT NULL,
  col_label      text         NOT NULL,
  col_sort       integer      NOT NULL,
  unit_type      text         NOT NULL DEFAULT 'C',
  area_sqm       numeric,
  status         unit_status  NOT NULL DEFAULT 'available',
  customer_name  text,
  notes          text,
  updated_at     timestamptz  DEFAULT now(),
  UNIQUE (building, unit_no)
);

-- 2. Auto-update timestamp
CREATE OR REPLACE FUNCTION update_units_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS units_updated_at ON units;
CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_units_timestamp();

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE units;

-- 4. Enable Row Level Security (allow anonymous read/write for sales kit)
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON units FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed all 392 units (2 buildings × 7 floors × 28 columns)
--    Column layout: 1-12, 12A, 14-28  (col_sort = ordinal 1-28)
--    Unit types:
--      col 1-2   → A (Exclusive A, 46 sqm)
--      col 3-12  → C (Studio, 23 sqm)
--      col 13    → B (Exclusive B, 47 sqm)  ← label "12A"
--      col 14-15 → E (1 Bedroom, 29 sqm)
--      col 16-26 → C (Studio, 23 sqm)
--      col 27    → D (Bedroom Plus, 35.84 sqm)
--      col 28    → A (Exclusive A, 46 sqm)

DO $$
DECLARE
  col_labels  TEXT[]    := ARRAY[
    '1','2','3','4','5','6','7','8','9','10','11','12',
    '12A',
    '14','15','16','17','18','19','20','21','22','23','24','25','26','27','28'
  ];
  col_types   TEXT[]    := ARRAY[
    'A','C','D','C','D','C','D','D','C','D','C','D','C',   -- col 1-13
    'A','B','E',                                             -- col 14-16
    'C','D','C','D','C','D','C','D','D','C','C','B'         -- col 17-28
  ];
  col_areas   NUMERIC[] := ARRAY[
    46,   22,    35.84, 22,    35.84, 22,    35.84, 35.84, 22,    35.84, 22,    35.84, 22,
    46,   47,    29,
    22,   35.84, 22,    35.84, 22,    35.84, 22,    35.84, 35.84, 22,    22,    47
  ];
  b TEXT;
  f INTEGER;
  c INTEGER;
BEGIN
  FOREACH b IN ARRAY ARRAY['wela1', 'wela2'] LOOP
    FOR f IN 2..8 LOOP
      FOR c IN 1..28 LOOP
        INSERT INTO units (building, unit_no, floor, col_label, col_sort, unit_type, area_sqm, status)
        VALUES (
          b,
          (f * 100 + c)::TEXT,
          f,
          col_labels[c],
          c,
          col_types[c],
          col_areas[c],
          'available'
        )
        ON CONFLICT (building, unit_no) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Verify: should return 392
SELECT COUNT(*) FROM units;
SELECT building, COUNT(*) FROM units GROUP BY building;
