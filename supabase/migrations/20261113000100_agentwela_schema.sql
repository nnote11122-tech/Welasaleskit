-- Source: SaleskitWela / lpwjkqxaajoohqxyjhag
-- Destination: Agentwela / xqdfojgschwurarfdgbp
-- Schema only. No application rows or Auth users are copied.
-- Browser access is restricted to authenticated users with profiles.
SET search_path = public, extensions;

CREATE TYPE public."unit_status" AS ENUM ('available', 'reserved', 'contracted', 'transferred', 'locked', 'pending', 'hold');

CREATE TABLE public."units" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "building" text NOT NULL,
  "unit_no" text NOT NULL,
  "floor" integer NOT NULL,
  "col_label" text NOT NULL,
  "col_sort" integer NOT NULL,
  "unit_type" text DEFAULT 'C'::text NOT NULL,
  "area_sqm" numeric,
  "status" public."unit_status" DEFAULT 'available'::unit_status NOT NULL,
  "customer_name" text,
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."units" ADD CONSTRAINT "units_building_unit_no_key" UNIQUE (building, unit_no);
ALTER TABLE public."units" ADD CONSTRAINT "units_pkey" PRIMARY KEY (id);
ALTER TABLE public."units" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."units" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."units" TO service_role;

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "name" text,
  "role" text DEFAULT 'sales'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['manager'::text, 'sales'::text]));
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."profiles" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."profiles" TO service_role;

CREATE TABLE public."bookings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "building" text NOT NULL,
  "unit_no" text NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text NOT NULL,
  "offer_price" numeric,
  "floor_price" numeric,
  "sales_name" text,
  "priv_removed" text,
  "priv_added" text,
  "quote_snapshot" jsonb,
  "snapshot_url" text,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."bookings" ADD CONSTRAINT "bookings_pkey" PRIMARY KEY (id);
ALTER TABLE public."bookings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."bookings" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."bookings" TO service_role;

CREATE TABLE public."price" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "building" text NOT NULL,
  "unit_no" text NOT NULL,
  "floor" text,
  "area_sqm" numeric DEFAULT 0,
  "unit_type" text,
  "base_price" numeric DEFAULT 0,
  "registration_disc" numeric DEFAULT 0,
  "up_price_floor" numeric DEFAULT 0,
  "floor_price_add" numeric DEFAULT 0,
  "furniture_disc" numeric DEFAULT 0,
  "free_transfer" numeric DEFAULT 0,
  "balloon_3" numeric DEFAULT 0,
  "booking_fee" numeric DEFAULT 0,
  "down_total" numeric DEFAULT 0,
  "inst_11" numeric DEFAULT 0,
  "freebie1" text,
  "freebie2" text,
  "special_disc" numeric DEFAULT 0,
  "net_price_ontop" numeric DEFAULT 0,
  "freebie3" text,
  "freebie4" text,
  "freebie5" text,
  "freebie6" text,
  "freebie7" text,
  "freebie8" text,
  "freebie9" text,
  "voucher_disc" numeric,
  "net_price" numeric,
  "note1" text,
  "note2" text,
  "note3" text,
  "note4" text,
  "note5" text,
  "note6" text,
  "note7" text,
  "note8" text
);
ALTER TABLE public."price" ADD CONSTRAINT "price_building_unit_no_key" UNIQUE (building, unit_no);
ALTER TABLE public."price" ADD CONSTRAINT "price_pkey" PRIMARY KEY (id);
ALTER TABLE public."price" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."price" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."price" TO service_role;

CREATE TABLE public."system_health_seed" (
  "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  "category" text NOT NULL,
  "value" integer NOT NULL,
  "label" text
);
ALTER TABLE public."system_health_seed" ADD CONSTRAINT "system_health_seed_pkey" PRIMARY KEY (id);
ALTER TABLE public."system_health_seed" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."system_health_seed" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."system_health_seed" TO service_role;

CREATE TABLE public."health_check" (
  "id" integer DEFAULT 1 NOT NULL,
  "project_name" text,
  "supabase_ref" text,
  "ping_count" bigint DEFAULT 0 NOT NULL,
  "last_ping" timestamp with time zone DEFAULT now() NOT NULL,
  "setup_at" timestamp with time zone DEFAULT now() NOT NULL,
  "seed_version" integer DEFAULT 2 NOT NULL
);
ALTER TABLE public."health_check" ADD CONSTRAINT "health_check_pkey" PRIMARY KEY (id);
ALTER TABLE public."health_check" ADD CONSTRAINT "single_row" CHECK (id = 1);
ALTER TABLE public."health_check" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."health_check" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."health_check" TO service_role;

CREATE OR REPLACE FUNCTION public.health_ping()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.health_check;
  seed_ok boolean;
begin
  select exists(select 1 from public.system_health_seed) into seed_ok;

  -- rate limit: ข้าม write หาก ping ล่าสุดยังไม่ถึง 15 นาที (ป้องกัน counter spam)
  update public.health_check
     set ping_count = ping_count + 1,
         last_ping = now()
   where id = 1
     and last_ping < now() - interval '15 minutes'
  returning * into r;

  -- ถ้า rate limit ยิง (ยังไม่ถึง 15 นาที): อ่าน row ปัจจุบันแทน
  if r is null then
    select * into r from public.health_check where id = 1;
  end if;

  -- ถ้าไม่มี row id=1 เลย: seed SQL ยังรันไม่ครบ
  if r is null then
    raise exception 'health_check row missing — re-run seed SQL' using errcode = 'P0002';
  end if;

  return json_build_object(
    'ok', true,
    'count', r.ping_count,
    'last_ping', r.last_ping,
    'seed_ok', seed_ok,
    'db_time', now()
  );
end;
$function$
;
REVOKE ALL ON FUNCTION public."health_ping"() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public."health_ping"() TO service_role;

CREATE OR REPLACE FUNCTION public.update_units_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;
REVOKE ALL ON FUNCTION public."update_units_timestamp"() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public."update_units_timestamp"() TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, NEW.email, 'sales')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$
;
REVOKE ALL ON FUNCTION public."handle_new_user"() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO service_role;

CREATE TRIGGER units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_units_timestamp();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (name) ON public.profiles TO authenticated;
CREATE POLICY read_own ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY update_own_name ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
GRANT SELECT, UPDATE ON public.units TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT SELECT ON public.price TO authenticated;
CREATE POLICY approved_read ON public.units FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager')));
CREATE POLICY approved_read ON public.bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager')));
CREATE POLICY approved_read ON public.price FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager')));
CREATE POLICY approved_update ON public.units FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager')));
CREATE POLICY approved_insert ON public.bookings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('sales', 'manager')));
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
NOTIFY pgrst, 'reload schema';

