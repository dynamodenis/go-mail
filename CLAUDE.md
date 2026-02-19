# Bulk Email Marketing Platform

## Project Overview
A bulk email marketing SaaS platform built with TanStack Start. Users can create email templates, manage contact collections, run campaigns, and manage their email/calendar via Nylas integration.

## Tech Stack
- **Framework**: TanStack Start (fullstack — serves as both frontend AND backend)
- **Routing**: TanStack Router (file-based routing)
- **Data Fetching**: TanStack Query (React Query) for ALL server data
- **Auth**: Supabase Auth (already configured — DO NOT modify auth setup)
- **Database**: PostgreSQL hosted on Railway
- **ORM**: Prisma (all DB access goes through Prisma, never raw SQL unless absolutely necessary)
- **State Management**: Zustand (client-only / derived / UI state)
- **Styling**: Tailwind CSS + ShadCN UI components
- **Email/Calendar**: Nylas API
- **Testing**: Vitest + React Testing Library

---

## Architecture Rules

### Backend (TanStack Start Server Functions)
- TanStack Start IS the backend. All API logic lives in server functions (`createServerFn`).
- Server functions go in: `app/features/{feature}/api/server.ts`
- Supabase is ONLY for authentication. Do NOT use Supabase for database queries.
- All database access uses Prisma client.
- Prisma client instance lives in `app/lib/prisma.ts` as a singleton.
- Never expose Prisma or database logic to the client — always wrap in server functions.

### Frontend
- All server/async data flows through TanStack Query (React Query). No exceptions.
- Client-only state (UI toggles, form state, derived/computed data, button clicks, modal open/close, filters, selections) goes in Zustand.
- Never put server-fetched data in Zustand. Zustand is NOT a cache — React Query handles caching.

---

## Project Structure

```
app/
├── features/                    # Feature-based modules
│   ├── dashboard/
│   │   ├── components/          # React components for this feature
│   │   │   ├── StatsCards.tsx
│   │   │   ├── SendsChart.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── api/
│   │   │   ├── server.ts        # Server functions (createServerFn)
│   │   │   ├── queries.ts       # React Query hooks (useQuery wrappers)
│   │   │   └── store.ts         # Zustand store for this feature
│   │   ├── hooks/               # Custom hooks for this feature
│   │   │   └── useDashboardFilters.ts
│   │   ├── types.ts             # TypeScript types for this feature
│   │   └── tests/               # Tests for this feature
│   │       ├── StatsCards.test.tsx
│   │       ├── SendsChart.test.tsx
│   │       └── queries.test.ts
│   ├── campaigns/
│   │   ├── components/
│   │   ├── api/
│   │   │   ├── server.ts
│   │   │   ├── queries.ts
│   │   │   └── store.ts
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── tests/
│   ├── templates/
│   ├── contacts/
│   ├── collections/
│   ├── email/                   # Nylas email integration
│   ├── calendar/                # Nylas calendar integration
│   ├── reports/
│   └── settings/
├── components/                  # Shared/global components
│   ├── ui/                      # ShadCN UI components (DO NOT EDIT these)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── SidebarNavItem.tsx
│   │   ├── TopBar.tsx
│   │   └── AppLayout.tsx
│   └── shared/                  # Reusable components across features
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       ├── ConfirmDialog.tsx
│       └── PageHeader.tsx
├── hooks/                       # Shared hooks
│   └── useAuth.ts
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── supabase.ts              # Supabase client (auth only)
│   ├── nylas.ts                 # Nylas client setup
│   ├── utils.ts                 # General utilities
│   └── constants.ts             # App-wide constants
├── routes/                      # TanStack file-based routes
│   ├── __root.tsx
│   ├── _authenticated.tsx       # Protected layout (checks Supabase session)
│   ├── _authenticated/
│   │   ├── dashboard.tsx
│   │   ├── email/
│   │   │   ├── inbox.tsx
│   │   │   ├── sent.tsx
│   │   │   └── drafts.tsx
│   │   ├── calendar.tsx
│   │   ├── campaigns/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── $campaignId.tsx
│   │   ├── templates/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── $templateId.edit.tsx
│   │   ├── contacts/
│   │   │   ├── index.tsx
│   │   │   ├── collections.tsx
│   │   │   └── $contactId.tsx
│   │   ├── reports/
│   │   │   ├── index.tsx
│   │   │   ├── deliverability.tsx
│   │   │   ├── engagement.tsx
│   │   │   └── growth.tsx
│   │   └── settings/
│   │       ├── account.tsx
│   │       ├── team.tsx
│   │       ├── integrations.tsx
│   │       ├── compliance.tsx
│   │       └── logs.tsx
│   ├── login.tsx
│   └── auth/
│       └── callback.tsx
└── styles/
    └── globals.css
prisma/
├── schema.prisma
└── migrations/
```

---

## Component Guardrails

### STRICT: Max 250 Lines Per Component
- No React component file shall exceed 250 lines of code.
- If a component approaches 250 lines, decompose it into smaller child components.
- Child components live in the same feature's `components/` directory.
- Example: Instead of one `CampaignBuilder.tsx` (400 lines), break into:
  - `CampaignBuilder.tsx` (orchestrator, <100 lines)
  - `CampaignStepSelector.tsx`
  - `CampaignTemplateStep.tsx`
  - `CampaignRecipientsStep.tsx`
  - `CampaignReviewStep.tsx`

### STRICT: Component Responsibility
- Each component does ONE thing. If you can't describe it in one sentence, split it.
- Container components (data fetching) are separate from presentational components (rendering).
- Route files in `/routes` should be thin — they import and compose feature components. Route files should not contain business logic or complex UI. Keep them under 50 lines ideally.

### STRICT: No Inline Styles
- Use Tailwind classes exclusively. Only use `style={{}}` props when no options.
- Extract repeated Tailwind patterns into shared components, not into CSS classes.

---

## State Management Rules

### React Query (Server State)
- ALL data that comes from the server (API, database) is managed by React Query.
- React Query is the single source of truth for server state and caching.
- Define query hooks in `app/features/{feature}/api/queries.ts`.
- Every query hook must accept `queryClient` as an optional parameter for dependency injection in tests.

### Zustand (Client State)
- Zustand is for UI state, derived state, user interactions, and computed values only.
- Each feature gets its own Zustand store in `app/features/{feature}/api/store.ts`.
- Keep stores small and focused. One store per feature domain.
- Never put async data fetching in Zustand — that's React Query's job.

## Hook Rules

### Dependency Injection Pattern
- All custom hooks that use `queryClient` must accept it as an optional parameter.
- This enables testing without providers.

### Hook Location
- Feature-specific hooks: `app/features/{feature}/hooks/`
- Shared hooks: `app/hooks/`
- Query hooks specifically: `app/features/{feature}/api/queries.ts`

---

## Testing Rules

### STRICT: Every Feature Must Have Tests
- Tests live in `app/features/{feature}/tests/`
- Every component gets a test file: `ComponentName.test.tsx`
- Every query/mutation hook gets tested: `queries.test.ts`
- Use Vitest + React Testing Library.
- Test file naming: `{FileName}.test.{tsx|ts}`

### What to Test
- **Components**: Renders correctly, user interactions, conditional rendering, loading/error states
- **Query hooks**: Correct query keys, data transformation, error handling
- **Zustand stores**: State transitions, actions produce correct state
- **Server functions**: Input validation, correct Prisma calls (mock Prisma)

### Testing Patterns
```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { StatsCards } from '../components/StatsCards'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('StatsCards', () => {
  it('renders loading state', () => {
    const qc = createTestQueryClient()
    render(
      <QueryClientProvider client={qc}>
        <StatsCards />
      </QueryClientProvider>
    )
    expect(screen.getByTestId('stats-loading')).toBeInTheDocument()
  })
})
```

---

## Server Function Rules

### Location & Naming
- All server functions: `app/features/{feature}/api/server.ts`
- Use `createServerFn` from TanStack Start.
- Prefix with HTTP-like verbs: `getCampaigns`, `createCampaign`, `updateCampaign`, `deleteCampaign`

### Validation
- Validate ALL inputs in server functions using Zod schemas.
- Define Zod schemas in `app/features/{feature}/types.ts`.
- Never trust client input.

### Auth in Server Functions
- ALWAYS verify the user session in server functions that read/write data.
- Extract the user from Supabase auth session.
- Filter all Prisma queries by `userId` — never return data belonging to other users.

### Error Handling
- Server functions should throw typed errors.
- Use a shared error format: `{ code: string, message: string }`
- Handle errors gracefully on the client with React Query's error state.

---

## Prisma Rules
- Schema lives in `prisma/schema.prisma`
- Always create migrations for schema changes: `npx prisma migrate dev --name description_of_change`
- Use meaningful migration names: `add_campaigns_table`, `add_status_to_contacts`
- Index foreign keys and frequently queried columns.
- Use `@default(uuid())` for all `id` fields.
- Use `@default(now())` for `createdAt` fields.
- Add `@@index` for columns used in WHERE clauses and JOINs.
- Use Prisma's relation fields for all foreign key relationships.

---

## Naming Conventions
- **Files**: kebab-case for utilities (`query-keys.ts`), PascalCase for components (`StatsCards.tsx`)
- **Components**: PascalCase (`CampaignList`, `TemplateEditor`)
- **Hooks**: camelCase with `use` prefix (`useCampaigns`, `useDeleteContact`)
- **Zustand stores**: camelCase with `use` prefix and `Store` suffix (`useCampaignUIStore`)
- **Server functions**: camelCase verb-noun (`getCampaigns`, `createTemplate`)
- **Types/Interfaces**: PascalCase (`Campaign`, `CampaignFilters`, `CreateCampaignInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DAILY_SENDS`, `DEFAULT_PAGE_SIZE`)
- **Query keys**: Use arrays (`['campaigns', filters]`, `['contacts', contactId]`)

---

## Performance Rules
- Use `React.memo()` on expensive presentational components that receive stable props.
- Use `useMemo` and `useCallback` only when there's a measurable benefit — don't premature optimize.
- Paginate all list queries — default page size of 25.
- Use React Query's `staleTime` and `gcTime` appropriately:
  - Frequently changing data (inbox): `staleTime: 30_000` (30 seconds)
  - Semi-static data (templates, collections): `staleTime: 300_000` (5 minutes)
  - Static data (settings): `staleTime: 600_000` (10 minutes)
- Lazy load heavy components (template editor, charts) with `React.lazy()`.

---

## Accessibility Rules
- All interactive elements must be keyboard accessible.
- Use semantic HTML (`button` for actions, `a` for navigation, proper heading hierarchy).
- ShadCN components handle most a11y — don't override their ARIA attributes.
- All images need `alt` text. Decorative images get `alt=""`.
- Form inputs must have associated labels.
- Loading and error states must be announced to screen readers.

---

## Git Commit Convention
- `feat: add campaign builder step 2`
- `fix: correct bounce rate calculation`
- `refactor: extract StatsCard into shared component`
- `test: add tests for useCampaigns hook`
- `chore: update prisma schema with indexes`

---

## Important Reminders
- DO NOT modify Supabase auth setup — it's already working.
- DO NOT use Supabase for database queries — use Prisma + Railway PostgreSQL.
- Supabase is ONLY for: `auth.getSession()`, `auth.getUser()`, `auth.signIn()`, `auth.signOut()`
- DO NOT install packages without asking first.
- When creating a new feature, always create: components/, api/ (server.ts, queries.ts, store.ts), hooks/, types.ts, tests/
- Always handle loading, error, and empty states in every page/component that fetches data.

## Security Rules
- NEVER log sensitive data (API keys, tokens, passwords, email content).
- NEVER return raw Prisma errors to the client — map to user-friendly messages.
- Sanitize all HTML content before storing (templates, email body) using DOMPurify.
- Rate limit server functions that perform writes (use a simple in-memory counter or middleware).
- All environment variables go in .env — never hardcode secrets.
- The .env file is in .gitignore — always verify this.

## API Response Patterns
- All server functions return a consistent shape:
  - Success: `{ data: T }`
  - Error: `{ error: { code: string, message: string } }`
- All list endpoints support pagination: `{ data: T[], total: number, page: number, pageSize: number }`
- Never return the entire database row if the client only needs 3 fields — use Prisma `select`.

## Code Smell Prevention
- No `any` types. Use `unknown` and narrow with type guards if needed.
- No `// @ts-ignore` or `// @ts-expect-error` without a linked issue/TODO explaining why.
- No `console.log` in committed code — use a proper logger or remove before commit.
- No magic numbers — extract to named constants in constants.ts or at file top.
- No prop drilling beyond 2 levels — use Zustand or React Context instead.
- No `useEffect` for derived state — use `useMemo` or compute inline.
- No `useEffect` to sync React Query data into Zustand — this is an antipattern.

## Feature Flags
- Nylas features should be behind a check: `if (settings.nylasGrantId)`.
- If Nylas is not connected, show a CTA to connect in Settings > Integrations.
- Email sending features should check if a sending provider is configured.
- Show graceful "not configured" states, never crash.

## Documentation
- Every server function must have a JSDoc comment explaining what it does, 
  its auth requirements, and what errors it can throw.
- Every Zustand store must have a comment at the top explaining its purpose.
- Complex business logic must have inline comments explaining WHY, not WHAT.