# WELA Sales Kit

## Platform

Web application built with React and Vite, hosted through Git on Vercel.

## Users and workflows

- Sales users look up rooms and prices, prepare quotations, and make bookings.
- Agentwela has a separate Supabase project from the original SaleskitWela system.
- Bookings reserve rooms immediately and send customer details and quotation images to the existing Telegram group without approval buttons.
- Managers import prices from a CSV matching the downloadable template, inspect changes, then explicitly confirm the import.
- Price imports change prices and promotions, not room availability or bookings.

## Access constraints

External users must not receive a Supabase service key. Import authorization and validation run in the database using the signed-in user's permissions. Only manager profiles can import; users cannot assign themselves that role.
