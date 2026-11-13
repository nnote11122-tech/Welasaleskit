# Agentwela database setup

Source: SaleskitWela (`lpwjkqxaajoohqxyjhag`).
Destination: Agentwela (`xqdfojgschwurarfdgbp`).

## Completed

- Initialized Agentwela's 392 units from the original inventory on 2026-11-13. The 240 units that were not available became `asakan` (129 in WELA 1 and 111 in WELA 2); 152 available units remained available. No source customer names or notes were copied. Every room's resulting status was checked against the snapshot; the booking RPC rejects Asakan rooms. The matrix and detail view show Asakan in blue. Future bookings still become reserved.

- Applied `initialize_agentwela_schema` to the destination using the live source catalog.
- Created all six public tables, the unit status enum, primary/unique/foreign-key constraints, three functions, and two triggers.
- Enabled Realtime for `public.units`.
- Compared column definitions and constraints reported by the table inspector; they match the source.
- Tested the new-user profile trigger, authenticated reads, unit updates, and booking inserts in a transaction that was rolled back.
- No source database writes were performed. No source records or Auth users were transferred.
- Applied `confirm_booking_without_approval`: `reserve_unit_booking` atomically marks an available unit as reserved and inserts an approved booking. Duplicate reservations and failed-insert rollback were tested in a rolled-back transaction.
- Deployed `notify-booking` version 2 to Agentwela, with JWT verification and authenticated database reads. It sends customer name, phone, offered price, quotation image and booking details to the configured Telegram chat without approval buttons, as explicitly requested. No Telegram webhook was deployed or changed.

## Deliberate access differences

- Anonymous callers cannot access the application tables.
- Authenticated users require a matching sales/manager profile to access units, prices, and bookings.
- Browser users can read prices, read/update units, and read/insert bookings. Price sync and booking approval use server credentials.
- Users can update their profile name, but cannot assign themselves a different role.
- Trigger functions have a fixed search path and are not directly executable by browser roles.
- Health tables and the health-ping function are restricted to server access. The health tables have no seed rows yet; health_ping will report a missing row until separately initialized.
- Security advisors reported only two informational notices for the intentionally private health tables having RLS without browser policies:
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Remaining before the website is ready

### Price import

The `/admin/prices` page is available from the home page and the manager sidebar. It accepts CSV UTF-8 matching the downloadable template (2 MB and 1,000 rows maximum). The template includes 392 rooms (196 per building) with building, room number, floor, room type and area taken from the source price table on 2026-11-13; this matches quotation metadata rather than the older matrix seed. Prices and promotions are blank for the user to fill. Remove rows not being imported. Required headers: `building`, `unit_no`, `base_price`. Missing columns preserve existing values; blank optional cells clear those values. Use `wela1` or `wela2` for building. Numeric cells accept plain numbers or correctly grouped, quoted thousands separators.

`import_prices` is a SECURITY INVOKER RPC with manager-only checks and RLS. No service-role key is needed by the importer or browser. It validates the entire batch, previews additions/updates/unchanged rows and field changes, and requires a matching preview fingerprint before an atomic commit. Imports have an audit summary in `price_imports`.

Only a trusted administrator can assign `profiles.role = 'manager'` to a verified user's UUID. New users receive sales access and cannot elevate themselves. An import adds price records only; it does not create missing units.

Validation: nine Node tests pass, including existing notification tests and CSV parsing cases. Database integration tests cover manager access, blocked sales/direct writes and anonymous RPC access, dry-run behavior, stale previews, preserving omitted fields, intentional clearing, duplicate/invalid batches, and audit rows; all test data is rolled back. Production build passes. Browser visual verification could not complete because the computer-use host could not establish the current Chrome URL.

1. Decide which room statuses and price records to initialize. Application tables are empty.
2. Configure Auth, Google OAuth, site/redirect URLs, and approved users/roles. The copied Auth trigger creates a sales profile for every newly created Auth user, so unrestricted signup must not be enabled for a restricted staff application.
3. Create the quotations bucket and authenticated upload policies; assess the existing public-image URL flow for the intended access model.
4. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Agentwela Edge Function secrets using the existing notification bot/group. This notification-only function does not set or use a webhook. Keep the old bot webhook unchanged. Delivery to the real chat has not been tested yet.
5. Point the new Google Sheets sync at the destination project with its own server credential.
6. Update Vercel environment variables and redeploy only once the backend is ready.

The source has no public.rooms table even though MatrixFloorplan.jsx contains queries for it. Check whether that screen is used and align it with units before relying on it.

The SQL file is an initial-schema migration for an empty destination. Do not run it again against an initialized database.
