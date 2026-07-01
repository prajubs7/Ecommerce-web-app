# Ecommerce Marketplace (React + MUI + React Query + Redux Toolkit + Supabase)

A multi-role (customer / vendor / admin) ecommerce starter, built with role-based
access enforced at both the UI and database (RLS) level.

## Stack

- React 19 + Vite + TypeScript
- Material UI v6 (custom theme — see `src/theme/theme.ts`)
- TanStack React Query — all server-state (products, orders, profiles)
- Redux Toolkit — client-state only (auth session, cart, UI filters/drawers)
- Supabase — Postgres, Auth, Storage, Row Level Security

## Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a project, and grab your
Project URL and anon public key from Project Settings → API.

### 2. Apply the schema
Open the SQL editor in your Supabase dashboard and run `supabase/schema.sql`
in this repo. It creates all tables, enums, indexes, the `is_admin()` helper,
the new-user profile trigger, and every RLS policy described in the design doc.

It also includes (commented out, since it needs the bucket created first) the
Storage policies for a `product-images` bucket — create that bucket in the
dashboard first, then uncomment and run those statements.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 4. Install and run
```bash
npm install
npm run dev
```

### 5. (Optional but recommended) Generate real Supabase types
The app currently uses hand-written types in `src/types/database.types.ts`
as manual return-type annotations. Once your project exists, generate the
real ones:
```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.types.ts
```
Then switch `src/api/supabaseClient.ts` back to `createClient<Database>(...)`
for full query-level type safety (left untyped in the scaffold to avoid
fighting a hand-rolled type against `tsc -b`'s stricter project-reference build).

## How roles work

- `profiles.role` is `customer | vendor | admin`. Vendors additionally have
  `vendor_status: pending | approved | rejected` — new vendor signups start
  `pending` and can't list products until an admin approves them
  (Admin dashboard → Vendor approvals tab).
- **Frontend** (`src/routes/ProtectedRoute.tsx`) hides UI and blocks routes
  by role — this is a UX convenience only.
- **Backend** (`supabase/schema.sql`) enforces the real boundary via RLS:
  a vendor's Supabase queries are restricted to their own `vendor_id` rows
  no matter what the frontend sends; only `role = 'admin'` rows pass the
  `is_admin()` checks.

## State management split

This is the one rule the whole app follows: **if it came from Supabase, it
lives in React Query, never in Redux.** Redux only holds the auth session
(`authSlice`, synced via `src/features/auth/useAuthListener.ts`), cart
(`cartSlice`, persisted to localStorage via `redux-persist`), and ephemeral
UI state like the cart drawer / filters (`uiSlice`, not persisted).

## Folder structure

```
src/
  api/              Supabase calls + React Query hooks (products, orders, auth)
  store/            Redux Toolkit slices + store config
  features/         Feature-organized pages (auth, products, cart, checkout,
                     vendor-dashboard, admin-dashboard)
  components/       Shared UI (Navbar, etc.)
  routes/           AppRoutes + ProtectedRoute (role guard)
  theme/            Custom MUI theme
  types/            Hand-written DB types (until you generate real ones)
supabase/
  schema.sql        Full schema, RLS policies, triggers, storage policy stubs
```

## What's scaffolded vs. what's next

Done: auth (signup with role selection, login, session sync), role-gated
routing, product catalog + detail + search, cart (Redux + drawer), checkout
→ order creation, customer order history, vendor dashboard (product list +
delete, order list), admin dashboard (vendor approvals, users, products,
orders overview).

Not yet wired up (left as clear next steps, not because they're hard):
- **Add/Edit product form** for vendors (the "Add product" button is a stub —
  `useCreateProduct`/`useUpdateProduct` hooks already exist in `src/api/products.ts`)
- **Image upload** to Supabase Storage (bucket + policies are in `schema.sql`,
  just needs an upload component wired to `useCreateProduct`)
- **Payment integration** (Stripe is the natural fit given your stack — orders
  currently go straight to `pending` status with no payment step)
- **Category management UI** for admin (table exists, no CRUD UI yet)

## AI-readiness

The `products.metadata` jsonb column and the clean `api/` query-hook layer
are the intentional hooks for adding AI features later without restructuring:
- **Semantic search / recommendations**: store embeddings in `metadata` or a
  separate `product_embeddings` table (pgvector extension), query via a new
  React Query hook following the same pattern as `useProducts`.
- **Chatbot / support**: add as a new Supabase Edge Function, called from a
  new `src/api/assistant.ts` file — doesn't touch existing data flow.
- Nothing in the current schema or component structure assumes a fixed,
  non-extensible shape for product data.
