# Fitstify

Fitstify is a fashion-catalog community: collect pieces, build catalogs, and discover other people's style.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth, Postgres, Row Level Security, and Storage
- Vercel deployment

## Local setup
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (or your Vercel environment variables).
5. In Supabase SQL Editor, run all of `supabase/schema.sql`.
6. In Supabase Authentication settings, set your Site URL and add your Vercel domain to the allowed redirect URLs.
7. Run `npm run dev`.

Only use the Supabase publishable key in `NEXT_PUBLIC_*` variables. Never put a secret/service-role key in browser code or commit secrets.

## Current implementation status
This branch introduces the Next.js application foundation, account signup/sign-in, catalog creation, public discovery, likes, image uploads, and the initial database schema. The original browser-only prototype remains at `index.html` for reference and is not the production app entry point.

## Security and launch checklist
- Row Level Security protects private catalogs and owner-only writes.
- Public and unlisted catalogs are readable by link; only public catalogs should be shown in discovery.
- Image uploads are limited to authenticated users' own storage folders.
- Before a public launch, add email verification, abuse-report review/moderation operations, rate limits, terms/privacy pages, and automated tests.
- Configure Supabase Auth redirect URLs for both localhost and the final Vercel domain.
- Test the production build and auth flow after adding Supabase environment variables.

Never put a Supabase secret/service-role key in browser code or commit secrets.
