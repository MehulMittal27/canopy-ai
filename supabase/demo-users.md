# Demo Users

The login page demo buttons use real Supabase Auth email/password sign-in. The Auth users must exist before the buttons work.

## Create Auth Users

In Supabase Dashboard, go to **Authentication -> Users -> Add user** and create:

| NGO | Email | Password |
| --- | --- | --- |
| Burundi Kids | `burundi-kids@canopy.demo` | `canopy123` |
| WTG | `wtg@canopy.demo` | `canopy123` |

Mark both users as email-confirmed if Supabase asks.

## Link Users to Orgs

After both Auth users exist, open **SQL Editor** and run:

```sql
-- Paste the contents of supabase/demo-users.sql here.
```

The script links:

- `burundi-kids@canopy.demo` -> `orgs.slug = 'burundi-kids'`
- `wtg@canopy.demo` -> `orgs.slug = 'wtg'`

It also preloads each demo user's saved `dashboard_layouts` row using the 16-column dashboard layout.

## Verify

The final query in `supabase/demo-users.sql` should return two rows with:

- a non-null `admin_user_id`
- the matching demo email
- template `bk` for Burundi Kids and `wtg` for WTG
- layout version `2`
- layout cols `16`

After that, the two login page demo buttons should go straight to `/dashboard`.
