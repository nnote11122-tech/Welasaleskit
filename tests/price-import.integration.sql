-- Run only against Agentwela. Test records are rolled back.
BEGIN;
SELECT set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
INSERT INTO auth.users(id,email) VALUES(current_setting('request.jwt.claim.sub')::uuid,'price-import-test@example.invalid');
UPDATE public.profiles SET role='manager' WHERE id=current_setting('request.jwt.claim.sub')::uuid;
INSERT INTO public.price(building,unit_no,base_price,freebie1) VALUES('wela1','999901',100,'keep me');
SET LOCAL ROLE authenticated;
DO $test$
DECLARE preview jsonb; committed jsonb; payload jsonb; rejected boolean;
BEGIN
payload:='[{"building":"wela1","unit_no":"999901","base_price":200},{"building":"wela2","unit_no":"999902","base_price":300}]';
preview:=public.import_prices(payload);
IF preview->>'inserted'<>'1' OR preview->>'updated'<>'1' THEN RAISE EXCEPTION 'preview counts failed'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.price WHERE unit_no='999901' AND base_price=100) OR EXISTS(SELECT 1 FROM public.price WHERE unit_no='999902') THEN RAISE EXCEPTION 'preview wrote data'; END IF;
committed:=public.import_prices(payload,false,preview->>'fingerprint','test.csv');
IF NOT EXISTS(SELECT 1 FROM public.price WHERE unit_no='999901' AND base_price=200 AND freebie1='keep me') THEN RAISE EXCEPTION 'partial update lost fields'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.price_imports WHERE id=(committed->>'import_id')::uuid) THEN RAISE EXCEPTION 'audit missing'; END IF;
rejected:=false;
BEGIN PERFORM public.import_prices(payload,false,preview->>'fingerprint'); EXCEPTION WHEN serialization_failure THEN rejected:=true; END;
IF NOT rejected THEN RAISE EXCEPTION 'stale preview allowed'; END IF;
payload:='[{"building":"wela1","unit_no":"999901","base_price":200,"freebie1":null}]';
preview:=public.import_prices(payload);
PERFORM public.import_prices(payload,false,preview->>'fingerprint');
IF EXISTS(SELECT 1 FROM public.price WHERE unit_no='999901' AND freebie1 IS NOT NULL) THEN RAISE EXCEPTION 'explicit blank not cleared'; END IF;
preview:=public.import_prices(payload);
IF preview->>'unchanged'<>'1' THEN RAISE EXCEPTION 'unchanged detection failed'; END IF;
FOR payload IN SELECT value FROM jsonb_array_elements('[
 [{"building":"wela1","unit_no":"999903","base_price":-1}],
 [{"building":"wela1","unit_no":"999903","base_price":1,"id":42}],
 [{"building":"wela1","unit_no":"999903","base_price":1},{"building":"wela1","unit_no":"999903","base_price":2}],
 [{"building":"wela1","unit_no":"999903","base_price":1},{"building":"bad","unit_no":"999904","base_price":2}]
]'::jsonb) LOOP
 rejected:=false;
 BEGIN PERFORM public.import_prices(payload); EXCEPTION WHEN invalid_parameter_value THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'invalid import accepted: %',payload; END IF;
END LOOP;
IF EXISTS(SELECT 1 FROM public.price WHERE unit_no='999903') THEN RAISE EXCEPTION 'invalid batch wrote partial data'; END IF;
END $test$;
RESET ROLE;
UPDATE public.profiles SET role='sales' WHERE id=current_setting('request.jwt.claim.sub')::uuid;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE rejected boolean:=false;
BEGIN
BEGIN PERFORM public.import_prices('[{"building":"wela1","unit_no":"999905","base_price":1}]'); EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
IF NOT rejected THEN RAISE EXCEPTION 'sales can import'; END IF;
rejected:=false;
BEGIN INSERT INTO public.price(building,unit_no,base_price) VALUES('wela1','999905',1); EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
IF NOT rejected THEN RAISE EXCEPTION 'sales bypassed RPC'; END IF;
IF has_function_privilege('anon','public.import_prices(jsonb,boolean,text,text)','EXECUTE') THEN RAISE EXCEPTION 'anon can import'; END IF;
IF has_column_privilege('authenticated','public.profiles','role','UPDATE') THEN RAISE EXCEPTION 'self role escalation possible'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
