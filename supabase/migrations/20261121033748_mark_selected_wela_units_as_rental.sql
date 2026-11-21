-- Apply only to Agentwela. Change the explicitly selected ASAKAN rooms.
DO $$
DECLARE
  matched integer;
BEGIN
  PERFORM 1 FROM public.units
  WHERE (building = 'wela2' AND unit_no IN ('202','203','204','205','206','208','210','213','218','219','220','222'))
     OR (building = 'wela1' AND unit_no = '306')
  FOR UPDATE;

  SELECT count(*) INTO matched FROM public.units
  WHERE ((building = 'wela2' AND unit_no IN ('202','203','204','205','206','208','210','213','218','219','220','222'))
     OR (building = 'wela1' AND unit_no = '306'))
    AND status IN ('asakan', 'rental');

  IF matched <> 13 THEN
    RAISE EXCEPTION 'Expected all 13 selected rooms to be ASAKAN or already rental; found %. No rooms changed.', matched;
  END IF;

  UPDATE public.units SET status = 'rental'
  WHERE ((building = 'wela2' AND unit_no IN ('202','203','204','205','206','208','210','213','218','219','220','222'))
     OR (building = 'wela1' AND unit_no = '306'))
    AND status = 'asakan';
END;
$$;
