-- Uses an isolated temporary sequence; does not consume production numbers.
BEGIN;
CREATE TEMP TABLE booking_number_test (LIKE public.bookings INCLUDING ALL);
INSERT INTO booking_number_test(building,unit_no,customer_name,customer_phone)
VALUES ('wela1','test1','test','test'),('wela2','test2','test','test');
DO $test$
DECLARE codes text[]; numbers bigint[];
BEGIN
SELECT array_agg(booking_code ORDER BY booking_number),array_agg(booking_number ORDER BY booking_number)
INTO codes,numbers FROM booking_number_test;
IF numbers[2]<>numbers[1]+1 OR codes[1]<>('WelaA-'||lpad(numbers[1]::text,4,'0')) THEN RAISE EXCEPTION 'Sequential booking numbers failed'; END IF;
END $test$;
INSERT INTO booking_number_test(building,unit_no,customer_name,customer_phone,booking_number)
OVERRIDING SYSTEM VALUE VALUES('wela1','test10000','test','test',10000);
DO $test$
BEGIN
IF NOT EXISTS(SELECT 1 FROM booking_number_test WHERE booking_code='WelaA-10000') THEN RAISE EXCEPTION 'Booking code truncated above 9999'; END IF;
END $test$;
ROLLBACK;
SELECT booking_code,building,unit_no FROM public.bookings ORDER BY booking_number;
