-- Number existing bookings chronologically; preserve UUIDs and references.
LOCK TABLE public.bookings IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.bookings ADD COLUMN booking_number bigint;
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS number
  FROM public.bookings
)
UPDATE public.bookings b SET booking_number = o.number
FROM ordered o WHERE b.id = o.id;

ALTER TABLE public.bookings ALTER COLUMN booking_number SET NOT NULL;
DO $$
DECLARE next_number bigint;
BEGIN
  SELECT coalesce(max(booking_number), 0) + 1 INTO next_number FROM public.bookings;
  EXECUTE format(
    'ALTER TABLE public.bookings ALTER COLUMN booking_number ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)',
    next_number
  );
END;
$$;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_number_positive CHECK (booking_number > 0),
  ADD CONSTRAINT bookings_number_unique UNIQUE (booking_number),
  ADD COLUMN booking_code text GENERATED ALWAYS AS (
    'WelaA-' || lpad(booking_number::text, greatest(4, length(booking_number::text)), '0')
  ) STORED;
CREATE UNIQUE INDEX bookings_code_unique ON public.bookings (booking_code);
GRANT USAGE, SELECT ON SEQUENCE public.bookings_booking_number_seq TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
