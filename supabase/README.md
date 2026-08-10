# Supabase setup

The database is the single source of truth for Wellspire SMS. Everything lives
in Postgres on Supabase.

## 1. Create a project
Go to [supabase.com](https://supabase.com) → **New project**. Note the project
URL and the two API keys (Project Settings → API):

| Value | Where it goes |
| --- | --- |
| Project URL | `SUPABASE_URL` and `VITE_SUPABASE_URL` |
| `anon` public key | `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY` |
| `service_role` secret key | `SUPABASE_SERVICE_ROLE_KEY` (server only — never in the browser) |

## 2. Run the migrations
Open **SQL Editor** in Supabase and run each file **in order**:

1. `migrations/0001_core_schema.sql`
2. `migrations/0002_functions_triggers.sql`
3. `migrations/0003_rls_policies.sql`
4. `migrations/0004_seed.sql`  *(optional — realistic starter data)*

Or with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push        # applies everything in migrations/
```

## 3. Auth (optional but recommended)
Enable **Email** auth in Authentication → Providers. To make a person an admin,
create their auth user, then insert/patch a matching row in `profiles` with
`auth_user_id = <their auth uid>` and `role = 'admin'`.

## Notes
- The API server uses the **service_role** key and therefore bypasses RLS. The
  RLS policies in `0003` protect any *direct* browser access via the anon key.
- Derived values are maintained by triggers: invoice status/paid-amount, library
  `available_copies`, and inventory `quantity`. Never write those columns by hand.
- `mark_overdue_invoices()` and `mark_overdue_loans()` are called by the API's
  automation jobs; you can also run them manually from the SQL editor.
