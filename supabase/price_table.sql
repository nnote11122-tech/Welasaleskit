-- WELA price table (รัน ใน Supabase SQL Editor)
create table if not exists price (
  id              bigint generated always as identity primary key,
  building        text    not null,                  -- 'wela1' | 'wela2'
  unit_no         text    not null,                  -- col 1: Unit number
  floor           text,                              -- col 2: Floor
  area_sqm        numeric default 0,                 -- col 3: Area / Sq.m.
  unit_type       text,                              -- col 4: Unit Type
  base_price      numeric default 0,                 -- col 6: ราคาตั้งต้น
  registration_disc numeric default 0,               -- col 7: ส่วนลดลงทะเบียน
  up_price_floor  numeric default 0,                 -- col 9: Up price / Floor 5000
  floor_price_add numeric default 0,                 -- col 10: ราคาเพิ่มชั้น
  furniture_disc  numeric default 0,                 -- col 12: ส่วนลดเฟอร์
  free_transfer   numeric default 0,                 -- col 13: Free ค่าใช้จ่ายวันโอน
  balloon_3       numeric default 0,                 -- col 14: บอลลูนดาวน์ งวด 3
  booking_fee     numeric default 0,                 -- col 15: Booking
  down_total      numeric default 0,                 -- col 16: ดาวน์
  inst_11         numeric default 0,                 -- col 17: ผ่อนดาวน์ 11 งวดละ
  freebie1        text,                              -- col 19: Promotion 1
  freebie2        text,                              -- col 20: Promotion 2
  freebie3        text,                              -- col 21: Promotion 3
  freebie4        text,                              -- col 22: Promotion 4
  freebie5        text,                              -- col 23: Promotion 5
  freebie6        text,                              -- col 24: Promotion 6
  special_disc    numeric default 0,                 -- col 26: ส่วนลดพิเศษ
  net_price_ontop numeric default 0,                 -- col 27: ราคาหลังลด ontop (floor ref)
  unique(building, unit_no)
);

alter table price enable row level security;
create policy "allow all" on price for all using (true) with check (true);
