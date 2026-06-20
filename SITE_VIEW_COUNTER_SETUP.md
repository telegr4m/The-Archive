# Persistent Site View Counter

The footer counts one visit per browser session and stores the shared total in
Supabase Postgres. It does not store IP addresses, user agents, or personal data.

## Supabase setup

1. Create a Supabase project.
2. Open its SQL editor and run [`supabase/site-views.sql`](supabase/site-views.sql).
3. Copy the project URL and server secret key from the Supabase dashboard.
4. Add these server-only variables locally in `.env.local` and in the Vercel
   project's environment settings:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-server-secret-key
```

Legacy Supabase projects can use `SUPABASE_SERVICE_ROLE_KEY` instead. Never use
the `NEXT_PUBLIC_` prefix for either secret key.

Redeploy after adding Vercel environment variables.

## Behavior

- `POST /api/site-views` atomically increments `total_views` unless the
  HTTP-only session cookie is already present.
- Refreshes and client-side page navigation in the same browser session read
  the existing total without incrementing it.
- `GET /api/site-views` returns the current total without incrementing it.
- A new browser session or incognito session increments once.
- If Supabase is unavailable or unconfigured, the footer shows `-`; it never
  invents a count.

The cookie is not a fraud-prevention system. Clearing cookies creates a new
session, and determined automated traffic can still inflate a public counter.
