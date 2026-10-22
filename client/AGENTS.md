## Project rules
- Ticket business rules (prices, age thresholds, participant limits, validation) live only in `src/lib/tickets.ts` as pure functions with tests in `tickets.test.ts`; UI must import them, never re-hardcode. Why: one place to change and verify rules.
- Catalog and booking go through `src/lib/api.ts` → FastAPI backend (`/api/*`). Session dates are preformatted strings from the server.
- Checkout flow state lives in `src/routes/index.tsx`; step components in `src/components/checkout/` are presentational. Why: single source of truth for step transitions and "edit from review" return.
