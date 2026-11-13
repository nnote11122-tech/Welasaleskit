-- Agentwela only: reserve the unit and save the booking in one transaction.
CREATE OR REPLACE FUNCTION public.reserve_unit_booking(payload jsonb)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  result public.bookings;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('sales', 'manager')
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF nullif(trim(payload->>'customer_name'), '') IS NULL
     OR nullif(trim(payload->>'customer_phone'), '') IS NULL THEN
    RAISE EXCEPTION 'Customer name and phone are required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.units
  SET status = 'reserved', customer_name = trim(payload->>'customer_name')
  WHERE building = payload->>'building'
    AND unit_no = payload->>'unit_no'
    AND status = 'available';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ห้องนี้ไม่ว่างหรือถูกจองไปแล้ว' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bookings (
    building, unit_no, customer_name, customer_phone, offer_price,
    floor_price, sales_name, priv_removed, priv_added,
    quote_snapshot, snapshot_url, status
  ) VALUES (
    payload->>'building', payload->>'unit_no',
    trim(payload->>'customer_name'), trim(payload->>'customer_phone'),
    (payload->>'offer_price')::numeric, (payload->>'floor_price')::numeric,
    'agentwela', payload->>'priv_removed', payload->>'priv_added',
    payload->'quote_snapshot', payload->>'snapshot_url', 'approved'
  ) RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_unit_booking(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_unit_booking(jsonb) TO authenticated;
