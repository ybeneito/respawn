# Respawn — Agent Instructions

## Git workflow

GitHub Flow: `main` is always deployable. All changes go through a short-lived branch and a PR.

```
main    ← production, protected — PR required, squash merge only
feat/*  ← new features  (e.g. feat/42-leaderboard)
fix/*   ← bug fixes     (e.g. fix/17-rls-grant)
docs/*  ← documentation
chore/* ← tooling, deps, CI
refactor/* ← refactoring
test/*  ← tests only
```

**Flow:** branch off `main` → commit → open PR → squash merge into `main` → CI deploys to Cloudflare Workers.

Never push directly to `main`.

**Before creating any branch**, always sync local main first:
```bash
git checkout main && git pull origin main
```
Skipping this creates branches from a stale base — PRs will include unrelated commits.

## Stack

- **Frontend:** Angular 21, standalone components, Signals, OnPush
- **Backend:** Supabase (PostgreSQL 17, Auth, RLS)
- **Deploy:** Cloudflare Workers via `wrangler` — triggered by push to `main`
- **Tests:** Vitest via Angular builder (`pnpm test`)
- **Package manager:** pnpm

## Architecture

Clean Architecture + Hexagonal. Domain layer (`src/domain/`) is pure TypeScript — zero Angular or Supabase imports. Use cases (`src/application/`) orchestrate domain entities via repository interfaces. Supabase adapters (`src/infrastructure/`) implement those interfaces, injected via `InjectionToken`.

## Architecture — règles strictes (violations = bug)

### Dépendances par couche — sens unique, sans exception

```
Component → UseCase (@Injectable) → Port (InjectionToken) ← Adapter (infrastructure)
```

- Un composant ne connaît que des use cases.
- Un use case ne connaît que des ports (interfaces via `InjectionToken`).
- Un adapter est la seule couche qui importe Supabase ou Angular DI infrastructure.

### INTERDIT dans les composants

- Injecter `QUEST_REPOSITORY`, `PROFILE_REPOSITORY`, `CURRENT_USER` ou tout autre token d'infra.
- Instancier un use case avec `new UseCase(repo, ...)` — même si ça compile, c'est une violation.

### Pattern canonique

```ts
// src/application/my.use-case.ts
@Injectable({ providedIn: 'root' })
export class MyUseCase {
  private readonly repo = inject(MY_REPOSITORY); // InjectionToken
  execute() { ... }
}

// Dans le composant :
private readonly myUseCase = inject(MyUseCase); // ← seul pattern autorisé
```

### Checklist avant tout nouveau composant ou use case

- [ ] Le composant n'importe rien de `src/infrastructure/` ni de `src/domain/` sauf les entités (types purs)
- [ ] Aucun `new UseCase(...)` dans un composant
- [ ] Aucun token repo (`*_REPOSITORY`, `CURRENT_USER`) injecté hors use case ou adapter

## Supabase / PostgreSQL

- Migrations live in `supabase/migrations/` — always add new migrations, never edit existing ones.
- Every new table needs explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;` — RLS alone is not enough (PostgreSQL checks GRANT before evaluating policies).
- RLS policies: use `(SELECT auth.uid())` (subquery form) — forces initPlan evaluation, avoids per-row re-evaluation.
- Never write a SELECT policy that re-queries the same table in its USING clause — causes 42501 on `INSERT ... RETURNING` in PostgreSQL 17.

## Angular

- Always call `mcp__angular-cli__get_best_practices` before writing Angular code.
- `templateUrl` + `styleUrl` pointing to separate `.html`/`.css` files — no inline templates or styles.
- Run a specific test: `pnpm ng test --include="**/filename.spec.ts" --watch=false`.