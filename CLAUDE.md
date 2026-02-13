# GoMail

Bulk email sending application built with TanStack Start.

## Tech Stack

- **Framework**: TanStack Start (Vite-based, SSR)
- **Auth**: Supabase Auth (email/password, cookie-based SSR sessions via `@supabase/ssr`)
- **UI**: Shadcn/ui + Tailwind CSS v4
- **Routing**: TanStack Router (file-based)
- **Data**: React Query + TanStack Start server functions (`createServerFn`)
- **Validation**: Zod
- **Linting**: Biome

## Project Structure

```
src/
├── components/
│   ├── global/          # App-wide components (header)
│   └── ui/              # Shadcn components
├── features/
│   └── auth/
│       ├── api/         # Server functions (fetchUser, signIn, signUp, signOut)
│       ├── components/  # Auth form components
│       └── schemas/     # Zod schemas + types
├── hooks/               # Shared hooks (use-mutation)
├── integrations/
│   └── supabase/        # Supabase SSR client
├── lib/                 # Utilities (cn)
├── routes/              # File-based routes
│   ├── __root.tsx       # Root layout, fetchUser in beforeLoad
│   ├── index.tsx        # Landing page (public)
│   ├── _auth/           # Public-only layout (redirects authed users to /dashboard)
│   └── _authed/         # Protected layout (redirects unauthed users to /sign-in)
├── router.tsx           # Router factory with QueryClient context
└── styles/app.css       # Tailwind CSS v4
```

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm check        # Biome lint + format
```

## Auth Architecture

- Supabase client created server-side only (`src/integrations/supabase/server.ts`)
- Auth state fetched in `__root.tsx` `beforeLoad` — available via route context everywhere
- Route guards: `_auth` layout redirects authenticated users, `_authed` layout redirects unauthenticated users
- No Supabase keys exposed to client (no `VITE_` prefix)

## Environment Variables

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Conventions

- **Feature-based folders**: `features/<name>/{api,components,schemas}`
- **Server functions** for all data operations via `createServerFn`
- **Zod schemas** for input validation
- **Shadcn/ui** for all UI components
- Path alias: `~/` maps to `src/`
- Formatter: tabs, Biome

## Future Features

- Email templates (TipTap rich text editor)
- Contact management with CSV import
- Contact collections/groups
- Email campaigns (template + collection + scheduling)
- Campaign analytics
