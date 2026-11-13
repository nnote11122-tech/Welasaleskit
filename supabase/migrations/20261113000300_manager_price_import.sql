-- Manager-only CSV import; no service key or elevated function is required.
CREATE TABLE public.price_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 file_name text NOT NULL,
 inserted integer NOT NULL,
 updated integer NOT NULL,
 unchanged integer NOT NULL
);
ALTER TABLE public.price_imports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.price_imports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.price_imports TO authenticated;
GRANT ALL ON public.price_imports TO service_role;
CREATE POLICY manager_read_imports ON public.price_imports FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='manager'));
CREATE POLICY manager_write_imports ON public.price_imports FOR INSERT TO authenticated
WITH CHECK (created_by=(select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='manager'));

GRANT INSERT, UPDATE ON public.price TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.price_id_seq TO authenticated;
CREATE POLICY manager_insert_prices ON public.price FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='manager'));
CREATE POLICY manager_update_prices ON public.price FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='manager'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='manager'));

CREATE OR REPLACE FUNCTION public.import_prices(
 rows_data jsonb, preview_only boolean DEFAULT true,
 expected_fingerprint text DEFAULT NULL, source_name text DEFAULT 'prices.csv'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
 allowed_columns text[] := ARRAY['building','unit_no','floor','unit_type','freebie1','freebie2','freebie3','freebie4','freebie5','freebie6','freebie7','freebie8','freebie9','note1','note2','note3','note4','note5','note6','note7','note8','area_sqm','base_price','registration_disc','up_price_floor','floor_price_add','furniture_disc','free_transfer','balloon_3','booking_fee','down_total','inst_11','special_disc','net_price_ontop','voucher_disc','net_price'];
 numeric_columns text[] := ARRAY['area_sqm','base_price','registration_disc','up_price_floor','floor_price_add','furniture_disc','free_transfer','balloon_3','booking_fee','down_total','inst_11','special_disc','net_price_ontop','voucher_disc','net_price'];
 row_data jsonb; pair record; old_data jsonb; merged jsonb;
 staged jsonb := '[]'::jsonb; preview jsonb := '[]'::jsonb;
 current_rows jsonb; fingerprint text; action text;
 n_insert integer:=0; n_update integer:=0; n_unchanged integer:=0;
 import_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='manager') THEN
   RAISE EXCEPTION 'เฉพาะผู้จัดการที่ได้รับสิทธิ์เท่านั้นที่นำเข้าราคาได้' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(rows_data) IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'ข้อมูลต้องเป็นรายการราคา' USING ERRCODE='22023';
 END IF;
 IF jsonb_array_length(rows_data) NOT BETWEEN 1 AND 1000 OR octet_length(rows_data::text)>2097152 THEN
   RAISE EXCEPTION 'รองรับ 1–1,000 แถว และข้อมูลไม่เกิน 2 MB' USING ERRCODE='22023';
 END IF;
 IF preview_only IS NULL THEN RAISE EXCEPTION 'ต้องระบุโหมดตรวจสอบหรือนำเข้า' USING ERRCODE='22023'; END IF;
 IF source_name IS NULL OR length(source_name)>255 THEN RAISE EXCEPTION 'ชื่อไฟล์ไม่ถูกต้อง' USING ERRCODE='22023'; END IF;

 FOR row_data IN SELECT value FROM jsonb_array_elements(rows_data) LOOP
  IF jsonb_typeof(row_data) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'รูปแบบแถวไม่ถูกต้อง' USING ERRCODE='22023'; END IF;
  IF jsonb_typeof(row_data->'building') IS DISTINCT FROM 'string'
     OR row_data->>'building' NOT IN ('wela1','wela2')
     OR jsonb_typeof(row_data->'unit_no') IS DISTINCT FROM 'string'
     OR NOT (row_data->>'unit_no' ~ '^[0-9A-Za-z][0-9A-Za-z._/-]{0,31}$')
     OR jsonb_typeof(row_data->'base_price') IS DISTINCT FROM 'number' THEN
    RAISE EXCEPTION 'ต้องระบุ building, unit_no และ base_price ให้ถูกต้อง' USING ERRCODE='22023';
  END IF;
  FOR pair IN SELECT * FROM jsonb_each(row_data) LOOP
   IF NOT (pair.key=ANY(allowed_columns)) THEN RAISE EXCEPTION 'ไม่รองรับคอลัมน์ %',pair.key USING ERRCODE='22023'; END IF;
   IF pair.key=ANY(numeric_columns) THEN
    IF pair.value <> 'null'::jsonb AND (
      jsonb_typeof(pair.value)<>'number' OR (pair.value::text)::numeric < 0 OR (pair.value::text)::numeric > 9007199254740991
    ) THEN RAISE EXCEPTION 'คอลัมน์ % ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป',pair.key USING ERRCODE='22023'; END IF;
   ELSIF pair.value <> 'null'::jsonb AND (jsonb_typeof(pair.value)<>'string' OR length(pair.value #>> '{}')>2000) THEN
    RAISE EXCEPTION 'ข้อความในคอลัมน์ % ไม่ถูกต้องหรือยาวเกินไป',pair.key USING ERRCODE='22023';
   END IF;
  END LOOP;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(rows_data) r GROUP BY r->>'building',r->>'unit_no' HAVING count(*)>1) THEN
  RAISE EXCEPTION 'มีอาคารและเลขห้องซ้ำในไฟล์ กรุณาแก้ก่อนนำเข้า' USING ERRCODE='22023';
 END IF;

 -- Serialize commits with other price writes and reject changes since preview.
 IF NOT preview_only THEN LOCK TABLE public.price IN SHARE ROW EXCLUSIVE MODE; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.building,p.unit_no),'[]'::jsonb)
 INTO current_rows FROM public.price p
 WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(rows_data) r WHERE r->>'building'=p.building AND r->>'unit_no'=p.unit_no);
 fingerprint:=md5(rows_data::text || current_rows::text || auth.uid()::text);
 IF NOT preview_only AND expected_fingerprint IS DISTINCT FROM fingerprint THEN
  RAISE EXCEPTION 'ราคาเปลี่ยนหลังตรวจสอบ กรุณากดตรวจสอบข้อมูลอีกครั้ง' USING ERRCODE='40001';
 END IF;

 FOR row_data IN SELECT value FROM jsonb_array_elements(rows_data) LOOP
  SELECT to_jsonb(p)-'id' INTO old_data FROM public.price p
  WHERE p.building=row_data->>'building' AND p.unit_no=row_data->>'unit_no';
  merged:=to_jsonb(jsonb_populate_record(NULL::public.price,
   '{"area_sqm":0,"base_price":0,"registration_disc":0,"up_price_floor":0,"floor_price_add":0,"furniture_disc":0,"free_transfer":0,"balloon_3":0,"booking_fee":0,"down_total":0,"inst_11":0,"special_disc":0,"net_price_ontop":0}'::jsonb || coalesce(old_data,'{}'::jsonb) || row_data))-'id';
  IF old_data IS NULL THEN action:='insert'; n_insert:=n_insert+1;
  ELSIF old_data IS DISTINCT FROM merged THEN action:='update'; n_update:=n_update+1;
  ELSE action:='unchanged'; n_unchanged:=n_unchanged+1; END IF;
  staged:=staged || jsonb_build_array(jsonb_build_object('data',merged,'action',action));
  preview:=preview || jsonb_build_array(jsonb_build_object(
   'building',merged->'building','unit_no',merged->'unit_no','action',action,
   'old_price',old_data->'base_price','new_price',merged->'base_price',
   'changes',(SELECT coalesce(jsonb_agg(jsonb_build_object('column',e.key,'before',old_data->e.key,'after',e.value) ORDER BY e.key),'[]'::jsonb)
     FROM jsonb_each(merged) e WHERE old_data->e.key IS DISTINCT FROM e.value
       AND (old_data IS NOT NULL OR row_data ? e.key))));
 END LOOP;
 IF NOT preview_only THEN
  FOR row_data IN SELECT value->'data' FROM jsonb_array_elements(staged) WHERE value->>'action'<>'unchanged' LOOP
   INSERT INTO public.price (building,unit_no,floor,unit_type,freebie1,freebie2,freebie3,freebie4,freebie5,freebie6,freebie7,freebie8,freebie9,note1,note2,note3,note4,note5,note6,note7,note8,area_sqm,base_price,registration_disc,up_price_floor,floor_price_add,furniture_disc,free_transfer,balloon_3,booking_fee,down_total,inst_11,special_disc,net_price_ontop,voucher_disc,net_price)
   SELECT r.building,r.unit_no,r.floor,r.unit_type,r.freebie1,r.freebie2,r.freebie3,r.freebie4,r.freebie5,r.freebie6,r.freebie7,r.freebie8,r.freebie9,r.note1,r.note2,r.note3,r.note4,r.note5,r.note6,r.note7,r.note8,r.area_sqm,r.base_price,r.registration_disc,r.up_price_floor,r.floor_price_add,r.furniture_disc,r.free_transfer,r.balloon_3,r.booking_fee,r.down_total,r.inst_11,r.special_disc,r.net_price_ontop,r.voucher_disc,r.net_price FROM jsonb_populate_record(NULL::public.price,row_data) r
   ON CONFLICT (building,unit_no) DO UPDATE SET floor=EXCLUDED.floor,unit_type=EXCLUDED.unit_type,freebie1=EXCLUDED.freebie1,freebie2=EXCLUDED.freebie2,freebie3=EXCLUDED.freebie3,freebie4=EXCLUDED.freebie4,freebie5=EXCLUDED.freebie5,freebie6=EXCLUDED.freebie6,freebie7=EXCLUDED.freebie7,freebie8=EXCLUDED.freebie8,freebie9=EXCLUDED.freebie9,note1=EXCLUDED.note1,note2=EXCLUDED.note2,note3=EXCLUDED.note3,note4=EXCLUDED.note4,note5=EXCLUDED.note5,note6=EXCLUDED.note6,note7=EXCLUDED.note7,note8=EXCLUDED.note8,area_sqm=EXCLUDED.area_sqm,base_price=EXCLUDED.base_price,registration_disc=EXCLUDED.registration_disc,up_price_floor=EXCLUDED.up_price_floor,floor_price_add=EXCLUDED.floor_price_add,furniture_disc=EXCLUDED.furniture_disc,free_transfer=EXCLUDED.free_transfer,balloon_3=EXCLUDED.balloon_3,booking_fee=EXCLUDED.booking_fee,down_total=EXCLUDED.down_total,inst_11=EXCLUDED.inst_11,special_disc=EXCLUDED.special_disc,net_price_ontop=EXCLUDED.net_price_ontop,voucher_disc=EXCLUDED.voucher_disc,net_price=EXCLUDED.net_price;
  END LOOP;
  INSERT INTO public.price_imports(created_by,file_name,inserted,updated,unchanged)
  VALUES(auth.uid(),source_name,n_insert,n_update,n_unchanged) RETURNING id INTO import_id;
 END IF;
 RETURN jsonb_build_object('inserted',n_insert,'updated',n_update,'unchanged',n_unchanged,
   'fingerprint',fingerprint,'rows',preview,'import_id',import_id,'committed',NOT preview_only);
END;
$$;
REVOKE ALL ON FUNCTION public.import_prices(jsonb,boolean,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.import_prices(jsonb,boolean,text,text) TO authenticated;
