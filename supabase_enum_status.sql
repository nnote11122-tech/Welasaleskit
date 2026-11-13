-- ============================================================
-- สร้าง ENUM type สำหรับ status — ทำให้ Supabase แสดง dropdown
-- รันใน SQL Editor ก่อนสร้าง units table
-- ============================================================

CREATE TYPE unit_status AS ENUM (
  'available',
  'reserved',
  'contracted',
  'transferred',
  'locked',
  'pending',
  'hold'
);

-- ============================================================
-- ถ้า units table มีอยู่แล้ว และต้องการเปลี่ยน column ให้ใช้ enum:
-- ============================================================

-- ALTER TABLE units
--   ALTER COLUMN status TYPE unit_status
--   USING status::unit_status;
