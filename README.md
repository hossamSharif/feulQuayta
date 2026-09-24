# Qadra Oil — Fuel Quota & Billing

Fuel-quota and post-pay billing management system for an oil company operating multiple fuel stations.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript
- **Backend**: Supabase (Postgres, Auth, Realtime) — all quota-affecting operations via Postgres RPC functions
- **UI**: shadcn/ui, Tailwind CSS, next-themes (light/dark), next-intl (Arabic/English)
- **Offline**: PWA with IndexedDB via Dexie.js
- **Testing**: Playwright E2E
- **Deploy**: Cloudflare Pages / Netlify

## Getting Started

```bash
npm install
npm run dev
```

Configure `.env.local` with your Supabase credentials.

## Project Structure

```
app/          # Next.js App Router pages
components/   # React components
lib/          # Utilities, types, offline store, sync service
supabase/     # Supabase client + server client
supabase/migrations/  # SQL migrations + RPC functions
public/       # Static assets, PWA manifest
```
