# Canopy

Canopy is an intelligent workspace for small NGOs. It monitors news, funding opportunities, inbox/field reports, and uploaded documents, prioritizes them with traffic-light urgency, translates content, and lets each NGO keep a saved dashboard layout.

The hackathon demo focuses on two partner NGOs:

- **Burundi Kids**: children's education work in Burundi.
- **Welttierschutzgesellschaft / WTG**: animal welfare work across 20+ countries.

## Current Features

- Landing page for the product story.
- Supabase email/password login, register, and onboarding.
- Demo login buttons for Burundi Kids and WTG.
- Draggable/resizable dashboard powered by `react-grid-layout`.
- Supabase-backed dashboard layout/template persistence.
- Dashboard template picker and add/remove widget tray.
- Inbox widget and full inbox detail view backed by `inbox_items`.
- News widget and full news view backed by `news_items`.
- News refresh, AI analysis, and daily digest through Supabase Edge Functions.
- Funding widget and full funding view backed by `funding_opportunities`.
- Funding refresh and AI analysis through Supabase Edge Functions.
- Reports/documents widget and full reports view backed by `documents`.
- S3 document upload/download signing through a Supabase Edge Function.
- Translator widget/view for text and PDFs through a Supabase Edge Function.
- Gmail OAuth and inbox sync through Supabase Edge Functions.
- Settings for layout, organization, news preferences, Gmail, and logout.
- Local prototype ticketing and collaboration/connections pages.
- Traffic-light urgency indicators and NGO-specific demo data.

## Current Technical State

This repo started as a Lovable-generated frontend. It is now a TanStack Start app with a Supabase backend slice for auth, orgs, dashboard layouts, inbox, news, funding, documents, Gmail, translation, and AI analysis.

- Frontend: Vite, React, TypeScript, Tailwind CSS.
- App runtime/routing: TanStack Start with file-based routes in `src/routes/`.
- Server state: React Query plus typed helpers in `src/lib/api/`.
- Local/UI state: Zustand stores for dashboard state, selected NGO, legacy templates, and legacy item notifications.
- Backend: Supabase Auth, Postgres, RLS, migrations, seed data, and Edge Functions.
- AI/integrations: OpenAI from Edge Functions only; AWS Bedrock assistant, Gmail OAuth/sync, and AWS S3 document upload/download from Edge Functions.
- Env setup: `.env.example` is committed; real `.env` files are ignored.
- Current RLS model: org-owned data is scoped through `orgs.admin_user_id = auth.uid()`.

Remaining rough edges:

- `/tickets` and `/connections` are localStorage prototypes.
- `src/data/items.ts` still powers older notification/demo paths.
- Reports keep local fallback rows if live documents fail to load.
- Edge Functions need Supabase secrets and provider credentials configured before all live flows work.

## Getting Started

Install dependencies:

```bash
bun install
```

Run the app:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Environment

Create a local `.env` from `.env.example` for browser-exposed Supabase settings:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only the Supabase anon key belongs in `VITE_SUPABASE_ANON_KEY`. Never put the Supabase `service_role` key, OpenAI key, AWS credentials, Gmail secrets, or Bedrock credentials in any `VITE_*` variable, source code, or commits.

Supabase Edge Function secrets/config should be set with `supabase secrets set` for deployed functions. The committed `.env.example` lists the browser vars and main function secret names; current function secret groups include:

- Supabase service role: `CANOPY_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- OpenAI: `OPENAI_API_KEY`, `OPENAI_CLASSIFIER_MODEL`, `OPENAI_FUNDING_MODEL`, `OPENAI_NEWS_MODEL`, `OPENAI_TRANSLATION_MODEL`.
- Gmail OAuth: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `CANOPY_APP_URL`.
- AWS S3: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_SESSION_TOKEN`.
- AWS Bedrock: `BEDROCK_REGION`, `BEDROCK_KNOWLEDGE_BASE_ID`, `BEDROCK_MODEL_ARN`.

## Demo Logins

The login page has demo buttons for the two showcase NGOs:

| NGO | Email | Password |
| --- | --- | --- |
| Burundi Kids | `burundi-kids@canopy.demo` | `canopy123` |
| WTG | `wtg@canopy.demo` | `canopy123` |

These must exist as real Supabase Auth users. After creating them in Supabase Dashboard, run the SQL in `supabase/demo-users.sql` to link them to their `orgs` rows and preload their saved dashboard layouts. See `supabase/demo-users.md`.

## Repo Layout

```text
src/
  components/
    canopy/       Shared app chrome, translator, assistant, media components
    funding/      Funding display components
    inbox/        Full inbox layout/detail UI
    ui/           Generated UI primitives
    widgets/      Dashboard widgets
  contexts/       Auth/session/org context
  data/           Legacy mock data
  integrations/   Supabase generated clients/types helpers
  lib/
    api/          Typed Supabase table/function helpers
    *-store.ts    Zustand stores
  pages/          Login/Register/Onboarding page implementations
  routes/         TanStack file routes
supabase/
  config.toml     Supabase project config
  migrations/     Database migrations
  functions/      Edge Functions
  seed.sql        Demo seed data
```

Important files:

- `src/routes/dashboard.tsx`: main draggable dashboard.
- `src/lib/dashboard-store.ts`: Supabase-backed dashboard layout state.
- `src/contexts/AuthContext.tsx`: Supabase Auth and current org bridge.
- `src/lib/api/`: typed helpers for Supabase tables and Edge Functions.
- `src/data/items.ts`: legacy mock item data; avoid adding new backend data here.
- `src/routeTree.gen.ts`: generated by TanStack tooling; do not edit manually.
- `AGENTS.md`: detailed implementation guidance for coding agents.

## Supabase Snapshot

Current tables are created/updated through `supabase/migrations/` and demo rows live in `supabase/seed.sql`.

- Core org/dashboard/data tables: `orgs`, `dashboard_layouts`, `inbox_items`, `news_items`, `funding_opportunities`, `documents`.
- Gmail integration tables: `org_gmail_connections`, `gmail_oauth_states`, `gmail_ingest_events`.
- Important org columns: `admin_user_id`, `news_countries`, `news_topics`, `news_languages`, `trusted_news_domains`.
- Important document columns: S3 bucket/key, file URL, upload status, uploader, MIME type, file size.
- Important AI metadata: news and funding analysis summaries, reasons, priority/classification fields, processed timestamp, model.

Current Edge Functions:

- `refresh-news`, `analyze-news`, `news-digest`
- `refresh-funding`, `analyze-funding`
- `translate-document`
- `document-upload`
- `gmail-auth`, `gmail-sync`
- `classify-inbox-item`
- `bedrock-chat`

## Development Notes

- Keep the current UI as stable as possible.
- Do not add new mock data to `src/data/`.
- Do not rewrite routing/framework structure during the hackathon.
- Do not rely on client-side filters for data security; use Supabase RLS.
- Do not call OpenAI from browser/client code.
- Keep backend changes small and ticket-scoped.
- Do not manually edit `src/routeTree.gen.ts`.
