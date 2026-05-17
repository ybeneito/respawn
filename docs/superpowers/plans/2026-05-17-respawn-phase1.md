# Respawn — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working solo gamified quest app where a user can sign up, create quests with rarity tiers, complete them to earn XP, level up, and track their daily streak — all rendered in the Respawn pixel-art design system.

**Architecture:** Clean Architecture + Angular Feature Modules. Domain entities are pure TypeScript (no Angular, no Supabase). Use cases orchestrate domain + repository interfaces. Supabase repositories implement those interfaces and are injected via `InjectionToken`. Angular components are OnPush + Signals throughout.

**Tech Stack:** Angular 21+, Supabase JS v2, TypeScript strict, Vitest, Angular i18n native, pnpm. Design reference: `design-export/respawn/project/design_handoff_respawn/`.

---

## File Map

```
src/
  domain/
    quest/
      quest.entity.ts              Quest class, QuestRarity, QuestStatus, QuestTag types
      quest.repository.ts          IQuestRepository interface (port)
    profile/
      user-profile.entity.ts       UserProfile class, stageForLevel() helper
      streak.entity.ts             Streak class with evaluate()
      profile.repository.ts        IUserProfileRepository interface (port)
  application/
    complete-quest.use-case.ts
    complete-quest.use-case.spec.ts
    create-quest.use-case.ts
    create-quest.use-case.spec.ts
    get-user-dashboard.use-case.ts
    get-user-dashboard.use-case.spec.ts
  infrastructure/
    supabase/
      supabase.client.ts           createClient() singleton
      supabase-quest.repository.ts implements IQuestRepository
      supabase-profile.repository.ts implements IUserProfileRepository
    auth/
      supabase-auth.service.ts     sign-in / sign-up / sign-out / session signal
  app/
    core/
      di-tokens.ts                 InjectionToken constants
      auth.guard.ts                redirects to /auth if no session
    shared/
      pixel-button/
        pixel-button.component.ts  .pbtn with variant input (purple|teal|amber|ghost)
        pixel-button.component.html
        pixel-button.component.css
      pixel-card/
        pixel-card.component.ts    .pbox [.notch-corners] wrapper
      xp-bar/
        xp-bar.component.ts        .pprog with width% computed from xp/xpToNext
        xp-bar.component.html
        xp-bar.component.css
      cat-sprite/
        cat-sprite.component.ts    PixelSprite renderer
        cat-sprite.component.css
        sprites.data.ts            PALETTES, STAGE_SPRITES, STAGE_INFO constants
    features/
      auth/
        auth.component.ts
        auth.component.html
        auth.component.css
        auth.routes.ts
      quests/
        quests.component.ts        Quest log screen
        quests.component.html
        quests.component.css
        quest-row.component.ts
        quest-row.component.html
        quest-row.component.css
        create-quest-modal/
          create-quest-modal.component.ts
          create-quest-modal.component.html
          create-quest-modal.component.css
        quests.routes.ts
      dashboard/
        dashboard.component.ts
        dashboard.component.html
        dashboard.component.css
        xp-toast.component.ts      inline template, absolute-positioned toast
        level-up.component.ts
        level-up.component.html
        level-up.component.css
        dashboard.routes.ts
    app.ts                         3-column shell, nav, right rail cat companion
    app.html
    app.css
    app.routes.ts
    app.config.ts
  styles.css                       design tokens + pixel primitives (from design export)
supabase/
  migrations/
    20260517000000_initial_schema.sql
```

---

## Task 1 — Angular Scaffold + Vitest + Design Tokens

**Files:**
- Create: Angular project files in `C:\Users\ybene\Desktop\dev\respawn`
- Create: `src/styles.css`

- [ ] **Step 1: Scaffold Angular inside existing repo**

```bash
cd C:\Users\ybene\Desktop\dev
ng new respawn --directory respawn --skip-git --style=css --ssr=false
# Si erreur "directory exists": cd respawn && ng init --skip-git --style=css
```

Expected: `angular.json`, `src/`, `package.json` créés dans `respawn/`.

- [ ] **Step 2: Install dependencies**

```bash
cd C:\Users\ybene\Desktop\dev\respawn
pnpm install
pnpm add @supabase/supabase-js
pnpm add -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: Configure Vitest (copier la config de tiddo)**

Lire `C:\Users\ybene\Desktop\dev\tiddo\package.json` pour les scripts test et copier la configuration Vitest exacte dans le `package.json` et `angular.json` de Respawn.

- [ ] **Step 4: Remplacer `src/styles.css` par le design system complet**

Copier le contenu de `design-export/respawn/project/design_handoff_respawn/styles.css` dans `src/styles.css` tel quel.

- [ ] **Step 5: Ajouter les Google Fonts dans `src/index.html`**

```html
<!-- Dans <head>, avant le reste -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&family=Silkscreen:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Configurer `tsconfig.json` en strict**

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

- [ ] **Step 7: Vérifier que le projet tourne**

```bash
pnpm ng serve
```

Ouvrir `http://localhost:4200` — page Angular par défaut visible.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Angular project with design system and Vitest"
```

---

## Task 2 — Domain — Quest Entity

**Files:**
- Create: `src/domain/quest/quest.entity.ts`
- Create: `src/domain/quest/quest.repository.ts`
- Create: `src/domain/quest/quest.entity.spec.ts`

- [ ] **Step 1: Écrire le test en échec**

`src/domain/quest/quest.entity.spec.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { Quest } from './quest.entity';

describe('Quest', () => {
  const base = () => new Quest('q1', 'u1', 'Ship the redesign', 'todo', 'urg', 'work', true, null, new Date());

  it('complete() returns done quest with epic XP', () => {
    const { quest, xpEarned } = base().complete();
    expect(quest.status).toBe('done');
    expect(quest.completedAt).toBeInstanceOf(Date);
    expect(xpEarned).toBe(80);
  });

  it('complete() returns 5 XP for common rarity', () => {
    const q = new Quest('q2', 'u1', 'Quick task', 'todo', 'low', 'home', true, null, new Date());
    const { xpEarned } = q.complete();
    expect(xpEarned).toBe(5);
  });

  it('complete() applies streak bonus', () => {
    const { xpEarned } = base().complete(10); // 10-day streak → +100% cap
    expect(xpEarned).toBe(160); // 80 + 100% = 160
  });

  it('complete() caps streak bonus at 100%', () => {
    const { xpEarned } = base().complete(20); // streak > 10, still capped
    expect(xpEarned).toBe(160);
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier l'échec**

```bash
pnpm ng test --testPathPattern="quest.entity"
```

Expected: FAIL — `Quest` not found.

- [ ] **Step 3: Implémenter `quest.entity.ts`**

```typescript
export type QuestRarity = 'low' | 'med' | 'hi' | 'urg';
export type QuestStatus = 'todo' | 'in_progress' | 'done';
export type QuestTag = 'work' | 'health' | 'learn' | 'home' | 'side-quest';

const XP_BY_RARITY: Record<QuestRarity, number> = {
  low: 5,
  med: 15,
  hi: 35,
  urg: 80,
};

export class Quest {
  constructor(
    readonly id: string,
    readonly ownerId: string,
    readonly title: string,
    readonly status: QuestStatus,
    readonly rarity: QuestRarity,
    readonly tag: QuestTag,
    readonly today: boolean,
    readonly completedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  complete(streakDays = 0): { quest: Quest; xpEarned: number } {
    const base = XP_BY_RARITY[this.rarity];
    const bonus = Math.min(streakDays * 0.1, 1.0);
    const xpEarned = Math.round(base * (1 + bonus));
    return {
      quest: new Quest(this.id, this.ownerId, this.title, 'done', this.rarity, this.tag, this.today, new Date(), this.createdAt),
      xpEarned,
    };
  }
}
```

- [ ] **Step 4: Créer `quest.repository.ts` (port)**

```typescript
import { Quest, QuestRarity, QuestTag } from './quest.entity';

export interface CreateQuestDto {
  ownerId: string;
  title: string;
  rarity: QuestRarity;
  tag: QuestTag;
  today: boolean;
}

export interface IQuestRepository {
  findByUser(userId: string): Promise<Quest[]>;
  findById(id: string): Promise<Quest | null>;
  save(quest: Quest): Promise<Quest>;
  create(dto: CreateQuestDto): Promise<Quest>;
}
```

- [ ] **Step 5: Lancer les tests — vérifier le passage**

```bash
pnpm ng test --testPathPattern="quest.entity"
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain/quest/
git commit -m "feat(domain): add Quest entity with XP calculation and streak bonus"
```

---

## Task 3 — Domain — Streak + UserProfile

**Files:**
- Create: `src/domain/profile/streak.entity.ts`
- Create: `src/domain/profile/streak.entity.spec.ts`
- Create: `src/domain/profile/user-profile.entity.ts`
- Create: `src/domain/profile/user-profile.entity.spec.ts`
- Create: `src/domain/profile/profile.repository.ts`

- [ ] **Step 1: Écrire les tests Streak en échec**

`src/domain/profile/streak.entity.spec.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { Streak } from './streak.entity';

const day = (offset: number) => {
  const d = new Date('2026-05-17');
  d.setDate(d.getDate() + offset);
  return d;
};

describe('Streak', () => {
  it('initialise le streak à 1 si aucune activité précédente', () => {
    const streak = new Streak(0, 0, null);
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(broken).toBe(false);
  });

  it('incrémente si activité hier', () => {
    const streak = new Streak(5, 5, day(-1));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(6);
    expect(next.longest).toBe(6);
    expect(broken).toBe(false);
  });

  it('ne change pas si déjà évalué aujourd\'hui', () => {
    const streak = new Streak(5, 5, day(0));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(5);
    expect(broken).toBe(false);
  });

  it('remet à 1 si gap > 1 jour et signale broken', () => {
    const streak = new Streak(5, 5, day(-3));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(next.longest).toBe(5);
    expect(broken).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier l'échec**

```bash
pnpm ng test --testPathPattern="streak.entity"
```

Expected: FAIL.

- [ ] **Step 3: Implémenter `streak.entity.ts`**

```typescript
export class Streak {
  constructor(
    readonly current: number,
    readonly longest: number,
    readonly lastActivityDate: Date | null,
  ) {}

  evaluate(today: Date): { streak: Streak; broken: boolean } {
    if (!this.lastActivityDate) {
      return { streak: new Streak(1, Math.max(1, this.longest), today), broken: false };
    }
    const daysSince = this.daysBetween(this.lastActivityDate, today);
    if (daysSince === 0) {
      return { streak: this, broken: false };
    }
    if (daysSince === 1) {
      const next = this.current + 1;
      return { streak: new Streak(next, Math.max(next, this.longest), today), broken: false };
    }
    return { streak: new Streak(1, this.longest, today), broken: true };
  }

  private daysBetween(a: Date, b: Date): number {
    const msPerDay = 86_400_000;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utcB - utcA) / msPerDay);
  }
}
```

- [ ] **Step 4: Tests Streak — vérifier le passage**

```bash
pnpm ng test --testPathPattern="streak.entity"
```

Expected: PASS (4 tests).

- [ ] **Step 5: Écrire les tests UserProfile en échec**

`src/domain/profile/user-profile.entity.spec.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { UserProfile } from './user-profile.entity';
import { Streak } from './streak.entity';

const makeProfile = (xp = 0, level = 1, lives = 9) =>
  new UserProfile('u1', 'pixelcat', null, 'orange', xp, level, lives, new Streak(0, 0, null), new Date());

describe('UserProfile', () => {
  it('applyXP ajoute les XP sans level up', () => {
    const { profile, levelUp } = makeProfile(50).applyXP(30);
    expect(profile.xp).toBe(80);
    expect(profile.level).toBe(1);
    expect(levelUp).toBe(false);
  });

  it('applyXP déclenche level up en franchissant le seuil', () => {
    const { profile, levelUp } = makeProfile(90).applyXP(15);
    expect(profile.xp).toBe(105);
    expect(profile.level).toBe(2); // seuil level 2 = 100 XP
    expect(levelUp).toBe(true);
  });

  it('applyXP décrémente une vie si streak broken', () => {
    const { profile } = makeProfile(0, 1, 9).applyXP(5, true);
    expect(profile.lives).toBe(8);
  });

  it('stageForLevel retourne le bon stade', () => {
    expect(makeProfile().stageForLevel(1)).toBe('kitten');
    expect(makeProfile().stageForLevel(4)).toBe('stray');
    expect(makeProfile().stageForLevel(8)).toBe('ninja');
    expect(makeProfile().stageForLevel(13)).toBe('samurai');
    expect(makeProfile().stageForLevel(19)).toBe('arcane');
    expect(makeProfile().stageForLevel(26)).toBe('legendary');
  });
});
```

- [ ] **Step 6: Implémenter `user-profile.entity.ts`**

```typescript
import { Streak } from './streak.entity';

export type CatPalette = 'orange' | 'black' | 'slate' | 'white' | 'brown' | 'siamese' | 'calico' | 'void';
export type CatStage = 'kitten' | 'stray' | 'ninja' | 'samurai' | 'arcane' | 'legendary';

const LEVEL_XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1_000,
};

function xpForLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[level] ?? level * level * 40;
}

function computeLevel(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export class UserProfile {
  constructor(
    readonly userId: string,
    readonly username: string,
    readonly avatarUrl: string | null,
    readonly palette: CatPalette,
    readonly xp: number,
    readonly level: number,
    readonly lives: number,
    readonly streak: Streak,
    readonly createdAt: Date,
  ) {}

  applyXP(amount: number, streakBroken = false): { profile: UserProfile; levelUp: boolean } {
    const newXp = this.xp + amount;
    const newLevel = computeLevel(newXp);
    const newLives = streakBroken ? Math.max(0, this.lives - 1) : this.lives;
    const levelUp = newLevel > this.level;
    return {
      profile: new UserProfile(this.userId, this.username, this.avatarUrl, this.palette, newXp, newLevel, newLives, this.streak, this.createdAt),
      levelUp,
    };
  }

  stageForLevel(level: number): CatStage {
    if (level >= 26) return 'legendary';
    if (level >= 19) return 'arcane';
    if (level >= 13) return 'samurai';
    if (level >= 8) return 'ninja';
    if (level >= 4) return 'stray';
    return 'kitten';
  }

  get stage(): CatStage {
    return this.stageForLevel(this.level);
  }

  get xpToNextLevel(): number {
    return xpForLevel(this.level + 1) - this.xp;
  }

  get xpForCurrentLevel(): number {
    return xpForLevel(this.level);
  }
}
```

- [ ] **Step 7: Créer `profile.repository.ts` (port)**

```typescript
import { UserProfile, CatPalette } from './user-profile.entity';

export interface CreateProfileDto {
  userId: string;
  username: string;
  palette: CatPalette;
}

export interface IUserProfileRepository {
  findById(userId: string): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<UserProfile>;
  create(dto: CreateProfileDto): Promise<UserProfile>;
}
```

- [ ] **Step 8: Tests UserProfile — vérifier le passage**

```bash
pnpm ng test --testPathPattern="user-profile.entity"
```

Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add src/domain/
git commit -m "feat(domain): add Streak and UserProfile entities with level, lives, and stage logic"
```

---

## Task 4 — Supabase Schema + RLS

**Files:**
- Create: `supabase/migrations/20260517000000_initial_schema.sql`

- [ ] **Step 1: Créer le fichier de migration**

`supabase/migrations/20260517000000_initial_schema.sql`
```sql
-- Profiles (étend auth.users)
CREATE TABLE profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username           TEXT UNIQUE NOT NULL,
  palette            TEXT NOT NULL DEFAULT 'orange',
  xp                 INTEGER NOT NULL DEFAULT 0,
  level              INTEGER NOT NULL DEFAULT 1,
  lives              INTEGER NOT NULL DEFAULT 9,
  streak_current     INTEGER NOT NULL DEFAULT 0,
  streak_longest     INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quests
CREATE TABLE quests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  rarity       TEXT NOT NULL DEFAULT 'med' CHECK (rarity IN ('low','med','hi','urg')),
  tag          TEXT NOT NULL DEFAULT 'work' CHECK (tag IN ('work','health','learn','home','side-quest')),
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  today        BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests   ENABLE ROW LEVEL SECURITY;

-- profiles : lecture publique (phase 2 leaderboard), écriture sur son propre profil
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- quests : CRUD sur ses propres quêtes uniquement
CREATE POLICY "quests_all" ON quests
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Trigger : créer un profil vide à la création du compte
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: Initialiser Supabase local (si pas déjà fait)**

```bash
npx supabase init
npx supabase start
```

- [ ] **Step 3: Appliquer la migration**

```bash
npx supabase db push
# ou
npx supabase migration up
```

Expected: tables `profiles` et `quests` créées, RLS activé.

- [ ] **Step 4: Créer `.env` à la racine**

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<clé affichée par supabase start>
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ .env.example
git commit -m "chore(infra): add Supabase schema and RLS for profiles and quests"
```

---

## Task 5 — Infrastructure — Supabase Client + DI Tokens + Repositories

**Files:**
- Create: `src/infrastructure/supabase/supabase.client.ts`
- Create: `src/infrastructure/supabase/supabase-quest.repository.ts`
- Create: `src/infrastructure/supabase/supabase-profile.repository.ts`
- Create: `src/infrastructure/auth/supabase-auth.service.ts`
- Create: `src/app/core/di-tokens.ts`
- Modify: `src/app/app.config.ts`

- [ ] **Step 1: Créer le client Supabase**

`src/infrastructure/supabase/supabase.client.ts`
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
);
```

`src/environments/environment.ts`
```typescript
export const environment = {
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'YOUR_LOCAL_ANON_KEY',
};
```

- [ ] **Step 2: Créer les tokens d'injection**

`src/app/core/di-tokens.ts`
```typescript
import { InjectionToken } from '@angular/core';
import { IQuestRepository } from '../../domain/quest/quest.repository';
import { IUserProfileRepository } from '../../domain/profile/profile.repository';

export const QUEST_REPOSITORY = new InjectionToken<IQuestRepository>('QuestRepository');
export const PROFILE_REPOSITORY = new InjectionToken<IUserProfileRepository>('ProfileRepository');
```

- [ ] **Step 3: Implémenter `SupabaseQuestRepository`**

`src/infrastructure/supabase/supabase-quest.repository.ts`
```typescript
import { Injectable } from '@angular/core';
import { Quest, QuestRarity, QuestStatus, QuestTag } from '../../domain/quest/quest.entity';
import { CreateQuestDto, IQuestRepository } from '../../domain/quest/quest.repository';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseQuestRepository implements IQuestRepository {
  async findByUser(userId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async findById(id: string): Promise<Quest | null> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return this.toEntity(data);
  }

  async save(quest: Quest): Promise<Quest> {
    const { data, error } = await supabase
      .from('quests')
      .update({
        status: quest.status,
        completed_at: quest.completedAt?.toISOString() ?? null,
      })
      .eq('id', quest.id)
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  async create(dto: CreateQuestDto): Promise<Quest> {
    const { data, error } = await supabase
      .from('quests')
      .insert({
        owner_id: dto.ownerId,
        title: dto.title,
        rarity: dto.rarity,
        tag: dto.tag,
        today: dto.today,
      })
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  private toEntity(row: Record<string, unknown>): Quest {
    return new Quest(
      row['id'] as string,
      row['owner_id'] as string,
      row['title'] as string,
      row['status'] as QuestStatus,
      row['rarity'] as QuestRarity,
      row['tag'] as QuestTag,
      row['today'] as boolean,
      row['completed_at'] ? new Date(row['completed_at'] as string) : null,
      new Date(row['created_at'] as string),
    );
  }
}
```

- [ ] **Step 4: Implémenter `SupabaseProfileRepository`**

`src/infrastructure/supabase/supabase-profile.repository.ts`
```typescript
import { Injectable } from '@angular/core';
import { UserProfile, CatPalette } from '../../domain/profile/user-profile.entity';
import { Streak } from '../../domain/profile/streak.entity';
import { CreateProfileDto, IUserProfileRepository } from '../../domain/profile/profile.repository';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseProfileRepository implements IUserProfileRepository {
  async findById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return this.toEntity(data);
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        xp: profile.xp,
        level: profile.level,
        lives: profile.lives,
        streak_current: profile.streak.current,
        streak_longest: profile.streak.longest,
        last_activity_date: profile.streak.lastActivityDate?.toISOString().split('T')[0] ?? null,
      })
      .eq('id', profile.userId)
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  async create(dto: CreateProfileDto): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: dto.userId, username: dto.username, palette: dto.palette })
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  private toEntity(row: Record<string, unknown>): UserProfile {
    const streak = new Streak(
      row['streak_current'] as number,
      row['streak_longest'] as number,
      row['last_activity_date'] ? new Date(row['last_activity_date'] as string) : null,
    );
    return new UserProfile(
      row['id'] as string,
      row['username'] as string,
      null,
      row['palette'] as CatPalette,
      row['xp'] as number,
      row['level'] as number,
      row['lives'] as number,
      streak,
      new Date(row['created_at'] as string),
    );
  }
}
```

- [ ] **Step 5: Créer `SupabaseAuthService`**

`src/infrastructure/auth/supabase-auth.service.ts`
```typescript
import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  readonly session = signal<Session | null>(null);

  constructor() {
    supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    supabase.auth.onAuthStateChange((_, session) => this.session.set(session));
  }

  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return supabase.auth.signOut();
  }
}
```

- [ ] **Step 6: Brancher les providers dans `app.config.ts`**

`src/app/app.config.ts`
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY } from './core/di-tokens';
import { SupabaseQuestRepository } from '../infrastructure/supabase/supabase-quest.repository';
import { SupabaseProfileRepository } from '../infrastructure/supabase/supabase-profile.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: QUEST_REPOSITORY, useClass: SupabaseQuestRepository },
    { provide: PROFILE_REPOSITORY, useClass: SupabaseProfileRepository },
  ],
};
```

- [ ] **Step 7: Commit**

```bash
git add src/infrastructure/ src/app/core/di-tokens.ts src/app/app.config.ts src/environments/
git commit -m "feat(infra): add Supabase repositories, auth service, and DI tokens"
```

---

## Task 6 — Application — CompleteQuest Use Case

**Files:**
- Create: `src/application/complete-quest.use-case.ts`
- Create: `src/application/complete-quest.use-case.spec.ts`

- [ ] **Step 1: Écrire les tests en échec**

`src/application/complete-quest.use-case.spec.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { CompleteQuestUseCase } from './complete-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';

const makeQuest = () => new Quest('q1', 'u1', 'Test', 'todo', 'hi', 'work', true, null, new Date());
const makeProfile = () => new UserProfile('u1', 'cat', null, 'orange', 0, 1, 9, new Streak(3, 3, new Date(Date.now() - 86_400_000)), new Date());

const makeRepos = (quest: Quest, profile: UserProfile) => ({
  questRepo: {
    findById: vi.fn().mockResolvedValue(quest),
    save: vi.fn().mockImplementation(async (q: Quest) => q),
    findByUser: vi.fn(),
    create: vi.fn(),
  } satisfies IQuestRepository,
  profileRepo: {
    findById: vi.fn().mockResolvedValue(profile),
    save: vi.fn().mockImplementation(async (p: UserProfile) => p),
    create: vi.fn(),
  } satisfies IUserProfileRepository,
});

describe('CompleteQuestUseCase', () => {
  it('retourne la quête complétée avec XP et streak', async () => {
    const { questRepo, profileRepo } = makeRepos(makeQuest(), makeProfile());
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo);
    const result = await useCase.execute('q1', 'u1', new Date());

    expect(result.quest.status).toBe('done');
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.streak.current).toBe(4);
    expect(result.levelUp).toBe(false);
  });

  it('déclenche levelUp si le seuil est franchi', async () => {
    const richProfile = new UserProfile('u1', 'cat', null, 'orange', 90, 1, 9, new Streak(0, 0, null), new Date());
    const urgQuest = new Quest('q1', 'u1', 'Big task', 'todo', 'urg', 'work', true, null, new Date());
    const { questRepo, profileRepo } = makeRepos(urgQuest, richProfile);
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo);
    const result = await useCase.execute('q1', 'u1', new Date());

    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier l'échec**

```bash
pnpm ng test --testPathPattern="complete-quest.use-case"
```

Expected: FAIL.

- [ ] **Step 3: Implémenter le use case**

`src/application/complete-quest.use-case.ts`
```typescript
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { Streak } from '../domain/profile/streak.entity';

export interface CompleteQuestResult {
  quest: import('../domain/quest/quest.entity').Quest;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  streak: Streak;
  livesLost: boolean;
}

export class CompleteQuestUseCase {
  constructor(
    private readonly questRepo: IQuestRepository,
    private readonly profileRepo: IUserProfileRepository,
  ) {}

  async execute(questId: string, userId: string, today: Date): Promise<CompleteQuestResult> {
    const quest = await this.questRepo.findById(questId);
    if (!quest) throw new Error(`Quest ${questId} not found`);

    const profile = await this.profileRepo.findById(userId);
    if (!profile) throw new Error(`Profile ${userId} not found`);

    const { streak: newStreak, broken } = profile.streak.evaluate(today);
    const { quest: completedQuest, xpEarned } = quest.complete(newStreak.current);
    const updatedProfileWithStreak = new (profile.constructor as typeof import('../domain/profile/user-profile.entity').UserProfile)(
      profile.userId, profile.username, profile.avatarUrl, profile.palette,
      profile.xp, profile.level, profile.lives, newStreak, profile.createdAt,
    );
    const { profile: finalProfile, levelUp } = updatedProfileWithStreak.applyXP(xpEarned, broken);

    await this.questRepo.save(completedQuest);
    await this.profileRepo.save(finalProfile);

    return {
      quest: completedQuest,
      xpEarned,
      levelUp,
      newLevel: finalProfile.level,
      streak: newStreak,
      livesLost: broken,
    };
  }
}
```

- [ ] **Step 4: Tests — vérifier le passage**

```bash
pnpm ng test --testPathPattern="complete-quest.use-case"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/complete-quest.use-case*
git commit -m "feat(application): add CompleteQuest use case with XP, streak, and level-up logic"
```

---

## Task 7 — Application — CreateQuest + GetUserDashboard

**Files:**
- Create: `src/application/create-quest.use-case.ts`
- Create: `src/application/create-quest.use-case.spec.ts`
- Create: `src/application/get-user-dashboard.use-case.ts`
- Create: `src/application/get-user-dashboard.use-case.spec.ts`

- [ ] **Step 1: Écrire et implémenter `CreateQuestUseCase`**

`src/application/create-quest.use-case.spec.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { CreateQuestUseCase } from './create-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';

const mockRepo: IQuestRepository = {
  findByUser: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  create: vi.fn().mockImplementation(async (dto) =>
    new Quest('new-id', dto.ownerId, dto.title, 'todo', dto.rarity, dto.tag, dto.today, null, new Date())
  ),
};

describe('CreateQuestUseCase', () => {
  it('crée une quête avec le bon owner et la bonne rareté', async () => {
    const useCase = new CreateQuestUseCase(mockRepo);
    const quest = await useCase.execute({ ownerId: 'u1', title: 'Ma quête', rarity: 'hi', tag: 'work', today: true });
    expect(quest.title).toBe('Ma quête');
    expect(quest.rarity).toBe('hi');
    expect(quest.status).toBe('todo');
  });
});
```

`src/application/create-quest.use-case.ts`
```typescript
import { Quest } from '../domain/quest/quest.entity';
import { CreateQuestDto, IQuestRepository } from '../domain/quest/quest.repository';

export class CreateQuestUseCase {
  constructor(private readonly questRepo: IQuestRepository) {}

  execute(dto: CreateQuestDto): Promise<Quest> {
    return this.questRepo.create(dto);
  }
}
```

- [ ] **Step 2: Écrire et implémenter `GetUserDashboardUseCase`**

`src/application/get-user-dashboard.use-case.spec.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { GetUserDashboardUseCase } from './get-user-dashboard.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';

const quests = [
  new Quest('q1', 'u1', 'A', 'todo', 'hi', 'work', true, null, new Date()),
  new Quest('q2', 'u1', 'B', 'done', 'low', 'home', true, new Date(), new Date()),
  new Quest('q3', 'u1', 'C', 'todo', 'med', 'learn', false, null, new Date()),
];
const profile = new UserProfile('u1', 'cat', null, 'orange', 120, 2, 9, new Streak(5, 5, new Date()), new Date());

const questRepo = { findByUser: vi.fn().mockResolvedValue(quests), findById: vi.fn(), save: vi.fn(), create: vi.fn() };
const profileRepo = { findById: vi.fn().mockResolvedValue(profile), save: vi.fn(), create: vi.fn() };

describe('GetUserDashboardUseCase', () => {
  it('retourne le profil et les quêtes du jour séparées done/active', async () => {
    const useCase = new GetUserDashboardUseCase(questRepo, profileRepo);
    const { todayActive, todayDone, userProfile } = await useCase.execute('u1');
    expect(todayActive).toHaveLength(1);
    expect(todayDone).toHaveLength(1);
    expect(userProfile.username).toBe('cat');
  });
});
```

`src/application/get-user-dashboard.use-case.ts`
```typescript
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';

export interface DashboardData {
  userProfile: UserProfile;
  todayActive: Quest[];
  todayDone: Quest[];
  allQuests: Quest[];
}

export class GetUserDashboardUseCase {
  constructor(
    private readonly questRepo: IQuestRepository,
    private readonly profileRepo: IUserProfileRepository,
  ) {}

  async execute(userId: string): Promise<DashboardData> {
    const [allQuests, userProfile] = await Promise.all([
      this.questRepo.findByUser(userId),
      this.profileRepo.findById(userId),
    ]);
    if (!userProfile) throw new Error(`Profile ${userId} not found`);
    const todayQuests = allQuests.filter(q => q.today);
    return {
      userProfile,
      todayActive: todayQuests.filter(q => q.status !== 'done'),
      todayDone: todayQuests.filter(q => q.status === 'done'),
      allQuests,
    };
  }
}
```

- [ ] **Step 3: Lancer tous les tests application**

```bash
pnpm ng test --testPathPattern="application/"
```

Expected: tous les tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/application/
git commit -m "feat(application): add CreateQuest and GetUserDashboard use cases"
```

---

## Task 8 — Auth Feature

**Files:**
- Create: `src/app/core/auth.guard.ts`
- Create: `src/app/features/auth/auth.component.ts`
- Create: `src/app/features/auth/auth.component.html`
- Create: `src/app/features/auth/auth.component.css`
- Create: `src/app/features/auth/auth.routes.ts`

- [ ] **Step 1: Créer le guard**

`src/app/core/auth.guard.ts`
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../../infrastructure/auth/supabase-auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  if (auth.session()) return true;
  return router.createUrlTree(['/auth']);
};
```

- [ ] **Step 2: Créer le composant Auth**

`src/app/features/auth/auth.component.ts`
```typescript
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseAuthService } from '../../../infrastructure/auth/supabase-auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class AuthComponent {
  private readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSignUp = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.value as { email: string; password: string };
    const fn = this.isSignUp() ? this.auth.signUp(email, password) : this.auth.signIn(email, password);
    const { error } = await fn;
    this.loading.set(false);
    if (error) { this.error.set(error.message); return; }
    this.router.navigate(['/dashboard']);
  }

  toggle() { this.isSignUp.update(v => !v); }
}
```

`src/app/features/auth/auth.component.html`
```html
<div class="auth-shell">
  <div class="auth-card pbox notch-corners">
    <h1 class="pf" i18n>RESPAWN</h1>
    <p class="sk" i18n>9 VIES · 1 JOUR À LA FOIS</p>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <input class="pinput" type="email" formControlName="email" placeholder="email" i18n-placeholder>
      <input class="pinput" type="password" formControlName="password" placeholder="mot de passe" i18n-placeholder>
      @if (error()) {
        <p class="error sk">{{ error() }}</p>
      }
      <button class="pbtn teal" type="submit" [disabled]="loading()">
        @if (loading()) { <span i18n>CHARGEMENT…</span> }
        @else if (isSignUp()) { <span i18n>CRÉER UN COMPTE</span> }
        @else { <span i18n>SE CONNECTER</span> }
      </button>
    </form>

    <button class="pbtn ghost" type="button" (click)="toggle()">
      @if (isSignUp()) { <span i18n>J'AI DÉJÀ UN COMPTE</span> }
      @else { <span i18n>CRÉER UN COMPTE</span> }
    </button>
  </div>
</div>
```

`src/app/features/auth/auth.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

export const AUTH_ROUTES: Routes = [
  { path: '', component: AuthComponent },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/app/features/auth/ src/app/core/auth.guard.ts
git commit -m "feat(auth): add sign-in/sign-up form with Supabase and auth guard"
```

---

## Task 9 — Shared UI — Pixel Primitives

**Files:**
- Create: `src/app/shared/pixel-button/pixel-button.component.ts`
- Create: `src/app/shared/pixel-button/pixel-button.component.html`
- Create: `src/app/shared/pixel-card/pixel-card.component.ts`
- Create: `src/app/shared/xp-bar/xp-bar.component.ts`
- Create: `src/app/shared/xp-bar/xp-bar.component.html`
- Create: `src/app/shared/xp-bar/xp-bar.component.css`

- [ ] **Step 1: `PixelButtonComponent`**

`src/app/shared/pixel-button/pixel-button.component.ts`
```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

type ButtonVariant = 'purple' | 'teal' | 'amber' | 'ghost';

@Component({
  selector: 'app-pixel-button',
  template: `<button class="pbtn" [class]="variant()" [disabled]="disabled()"><ng-content /></button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelButtonComponent {
  readonly variant = input<ButtonVariant>('purple');
  readonly disabled = input(false);
}
```

- [ ] **Step 2: `PixelCardComponent`**

`src/app/shared/pixel-card/pixel-card.component.ts`
```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pixel-card',
  template: `<div class="pbox" [class.notch-corners]="notched()"><ng-content /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelCardComponent {
  readonly notched = input(true);
}
```

- [ ] **Step 3: `XpBarComponent`**

`src/app/shared/xp-bar/xp-bar.component.ts`
```typescript
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xp-bar',
  templateUrl: './xp-bar.component.html',
  styleUrl: './xp-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpBarComponent {
  readonly currentXp = input.required<number>();
  readonly xpForCurrentLevel = input.required<number>();
  readonly xpForNextLevel = input.required<number>();

  readonly fillPercent = computed(() => {
    const range = this.xpForNextLevel() - this.xpForCurrentLevel();
    const progress = this.currentXp() - this.xpForCurrentLevel();
    return Math.min(100, Math.max(0, (progress / range) * 100));
  });
}
```

`src/app/shared/xp-bar/xp-bar.component.html`
```html
<div class="pprog" role="progressbar" [attr.aria-valuenow]="currentXp()" [attr.aria-valuemax]="xpForNextLevel()">
  <div class="pprog-fill" [style.width.%]="fillPercent()"></div>
</div>
<p class="sk xp-label" i18n>XP VERS NV {{ xpForNextLevel() - currentXp() }}</p>
```

`src/app/shared/xp-bar/xp-bar.component.css`
```css
:host { display: block; }
.xp-label { color: var(--acc-amber); font-size: 10px; margin-top: 4px; text-align: right; }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/
git commit -m "feat(ui): add PixelButton, PixelCard, and XpBar shared components"
```

---

## Task 10 — Shared UI — CatSprite Component

**Files:**
- Create: `src/app/shared/cat-sprite/sprites.data.ts`
- Create: `src/app/shared/cat-sprite/cat-sprite.component.ts`
- Create: `src/app/shared/cat-sprite/cat-sprite.component.css`

- [ ] **Step 1: Extraire les constantes de sprites depuis le design export**

Lire `design-export/respawn/project/design_handoff_respawn/sprites.jsx` et extraire :
- La constante `PALETTES` → la réécrire en TypeScript dans `sprites.data.ts`
- Les 6 constantes de sprites (KITTEN_ART, STRAY_ART, NINJA_ART, SAMURAI_ART, ARCANE_ART, LEGENDARY_ART) → à réécrire en TypeScript

`src/app/shared/cat-sprite/sprites.data.ts`
```typescript
import { CatPalette, CatStage } from '../../../domain/profile/user-profile.entity';

export interface Palette {
  fur: [string, string, string, string]; // light → dark
  eye: string;
  nose: string;
}

export const PALETTES: Record<CatPalette, Palette> = {
  // Copier les valeurs exactes de PALETTES dans sprites.jsx
  orange:  { fur: ['#f5c87a','#e8974f','#c96b2a','#8b3f0a'], eye: '#4caf50', nose: '#e88070' },
  black:   { fur: ['#555','#333','#1a1a1a','#0d0d0d'], eye: '#ffd600', nose: '#cc6060' },
  slate:   { fur: ['#8899aa','#667788','#445566','#223344'], eye: '#64b5f6', nose: '#e88070' },
  white:   { fur: ['#f0f0f0','#d8d8d8','#b0b0b0','#888888'], eye: '#64b5f6', nose: '#ffb0b0' },
  brown:   { fur: ['#c8956a','#a0694a','#7a4a2e','#4e2c12'], eye: '#4caf50', nose: '#e88070' },
  siamese: { fur: ['#f0e0c8','#d4b896','#a07850','#5c3c1c'], eye: '#42a5f5', nose: '#ffb0b0' },
  calico:  { fur: ['#f0d080','#e09040','#c04820','#8b3010'], eye: '#4caf50', nose: '#e88070' },
  void:    { fur: ['#6040a0','#402080','#200060','#100030'], eye: '#ff80ff', nose: '#c040c0' },
};

// Copier les grilles de sprites exactes depuis sprites.jsx
// Format : string multiligne où chaque caractère est un index fur (1-4), E=eye, P=nose, espace=transparent
export const STAGE_SPRITES: Record<CatStage, string> = {
  kitten:    `/* coller KITTEN_ART depuis sprites.jsx */`,
  stray:     `/* coller STRAY_ART depuis sprites.jsx */`,
  ninja:     `/* coller NINJA_ART depuis sprites.jsx */`,
  samurai:   `/* coller SAMURAI_ART depuis sprites.jsx */`,
  arcane:    `/* coller ARCANE_ART depuis sprites.jsx */`,
  legendary: `/* coller LEGENDARY_ART depuis sprites.jsx */`,
};
```

**Note importante :** les valeurs de `PALETTES` et les grilles de sprites ci-dessus sont des approximations. Lire `design-export/respawn/project/design_handoff_respawn/sprites.jsx` et copier les valeurs exactes de `PALETTES` et de chaque sprite art string.

- [ ] **Step 2: Implémenter le renderer `CatSpriteComponent`**

`src/app/shared/cat-sprite/cat-sprite.component.ts`
```typescript
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CatPalette, CatStage } from '../../../domain/profile/user-profile.entity';
import { PALETTES, STAGE_SPRITES } from './sprites.data';

interface Pixel { x: number; y: number; color: string; }

@Component({
  selector: 'app-cat-sprite',
  template: `
    <div class="sprite-container" [style.width.px]="containerSize()" [style.height.px]="containerSize()">
      @for (pixel of pixels(); track pixel.x + '-' + pixel.y) {
        <div class="pixel"
          [style.left.px]="pixel.x * pixelSize()"
          [style.top.px]="pixel.y * pixelSize()"
          [style.width.px]="pixelSize()"
          [style.height.px]="pixelSize()"
          [style.background]="pixel.color">
        </div>
      }
    </div>
  `,
  styleUrl: './cat-sprite.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatSpriteComponent {
  readonly palette = input.required<CatPalette>();
  readonly stage = input.required<CatStage>();
  readonly pixelSize = input(8);

  readonly pixels = computed(() => this.parseSprite(this.stage(), this.palette()));
  readonly gridSize = 18;
  readonly containerSize = computed(() => this.gridSize * this.pixelSize());

  private parseSprite(stage: CatStage, pal: CatPalette): Pixel[] {
    const grid = STAGE_SPRITES[stage];
    const palette = PALETTES[pal];
    const pixels: Pixel[] = [];
    const rows = grid.trim().split('\n');
    rows.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const color = this.charToColor(char, palette);
        if (color) pixels.push({ x, y, color });
      });
    });
    return pixels;
  }

  private charToColor(char: string, palette: ReturnType<typeof PALETTES[CatPalette]>): string | null {
    switch (char) {
      case '1': return palette.fur[0];
      case '2': return palette.fur[1];
      case '3': return palette.fur[2];
      case '4': return palette.fur[3];
      case 'E': return palette.eye;
      case 'P': return palette.nose;
      default:  return null;
    }
  }
}
```

`src/app/shared/cat-sprite/cat-sprite.component.css`
```css
.sprite-container {
  position: relative;
  image-rendering: pixelated;
  animation: idle-bob-slow 2.4s steps(4) infinite;
}
.pixel {
  position: absolute;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/cat-sprite/
git commit -m "feat(ui): add CatSprite pixel renderer with palette and stage support"
```

---

## Task 11 — Quest Creation Modal (2 étapes)

**Files:**
- Create: `src/app/features/quests/create-quest-modal/create-quest-modal.component.ts`
- Create: `src/app/features/quests/create-quest-modal/create-quest-modal.component.html`
- Create: `src/app/features/quests/create-quest-modal/create-quest-modal.component.css`

- [ ] **Step 1: Implémenter le composant modal**

`src/app/features/quests/create-quest-modal/create-quest-modal.component.ts`
```typescript
import { Component, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QUEST_REPOSITORY } from '../../../core/di-tokens';
import { CreateQuestUseCase } from '../../../../application/create-quest.use-case';
import { Quest, QuestRarity, QuestTag } from '../../../../domain/quest/quest.entity';
import { SupabaseAuthService } from '../../../../infrastructure/auth/supabase-auth.service';

const RARITIES: { value: QuestRarity; label: string; xp: number; diamonds: number }[] = [
  { value: 'low', label: 'COMMUN',   xp: 5,  diamonds: 1 },
  { value: 'med', label: 'INHABITUEL', xp: 15, diamonds: 2 },
  { value: 'hi',  label: 'RARE',    xp: 35, diamonds: 3 },
  { value: 'urg', label: 'ÉPIQUE',  xp: 80, diamonds: 4 },
];

const TAGS: { value: QuestTag; label: string }[] = [
  { value: 'work',       label: 'Travail' },
  { value: 'health',     label: 'Santé' },
  { value: 'learn',      label: 'Apprentissage' },
  { value: 'home',       label: 'Maison' },
  { value: 'side-quest', label: 'Quête annexe' },
];

@Component({
  selector: 'app-create-quest-modal',
  templateUrl: './create-quest-modal.component.html',
  styleUrl: './create-quest-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class CreateQuestModalComponent {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly auth = inject(SupabaseAuthService);
  private readonly fb = inject(FormBuilder);
  private readonly useCase = new CreateQuestUseCase(this.questRepo);

  readonly questCreated = output<Quest>();
  readonly closed = output<void>();

  readonly step = signal<1 | 2>(1);
  readonly loading = signal(false);
  readonly rarities = RARITIES;
  readonly tags = TAGS;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    tag: ['work' as QuestTag],
  });

  get titleLength() { return this.form.get('title')?.value?.length ?? 0; }

  nextStep() {
    if (this.form.get('title')?.invalid) return;
    this.step.set(2);
  }

  async selectRarity(rarity: QuestRarity) {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;
    this.loading.set(true);
    const quest = await this.useCase.execute({
      ownerId: userId,
      title: this.form.value.title!,
      rarity,
      tag: this.form.value.tag as QuestTag,
      today: true,
    });
    this.loading.set(false);
    this.questCreated.emit(quest);
  }
}
```

`src/app/features/quests/create-quest-modal/create-quest-modal.component.html`
```html
<div class="modal-overlay" (click)="closed.emit()">
  <div class="modal pbox notch-corners" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2 class="pf" i18n>NOUVELLE QUÊTE</h2>
      <span class="sk step-indicator" i18n>ÉTAPE {{ step() }}/2</span>
      <button class="pbtn ghost sm" (click)="closed.emit()">✕</button>
    </div>

    <div class="step-bar">
      <div class="step-fill" [class.full]="step() === 2"></div>
    </div>

    @if (step() === 1) {
      <div class="step-content">
        <form [formGroup]="form">
          <input class="pinput" formControlName="title" placeholder="Nom de la quête…" i18n-placeholder maxlength="100">
          <p class="sk char-count">{{ titleLength }}/100</p>
          <div class="tag-chips">
            @for (tag of tags; track tag.value) {
              <button type="button" class="pbtn ghost sm"
                [class.active]="form.get('tag')?.value === tag.value"
                (click)="form.get('tag')?.setValue(tag.value)">
                {{ tag.label }}
              </button>
            }
          </div>
          <button class="pbtn teal" type="button" (click)="nextStep()" [disabled]="form.get('title')?.invalid" i18n>
            CONTINUER →
          </button>
        </form>
      </div>
    }

    @if (step() === 2) {
      <div class="step-content">
        <p class="vt title-echo">"{{ form.value.title }}"</p>
        <p class="sk" i18n>CHOISIS LA RARETÉ</p>
        <div class="rarity-grid">
          @for (r of rarities; track r.value) {
            <button class="rarity-card pbox notch-corners rarity-{{ r.value }}"
              (click)="selectRarity(r.value)" [disabled]="loading()">
              <span class="rarity-pip sk">{{ r.label }}</span>
              <span class="pf rarity-label">{{ r.label }}</span>
              <span class="diamonds">{{ '◆'.repeat(r.diamonds) }}</span>
              <span class="xp-reward sk">+{{ r.xp }} XP</span>
            </button>
          }
        </div>
      </div>
    }
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/quests/create-quest-modal/
git commit -m "feat(quests): add 2-step quest creation modal with rarity selection"
```

---

## Task 12 — Quest Log Screen

**Files:**
- Create: `src/app/features/quests/quest-row.component.ts`
- Create: `src/app/features/quests/quest-row.component.html`
- Create: `src/app/features/quests/quest-row.component.css`
- Create: `src/app/features/quests/quests.component.ts`
- Create: `src/app/features/quests/quests.component.html`
- Create: `src/app/features/quests/quests.component.css`
- Create: `src/app/features/quests/quests.routes.ts`

- [ ] **Step 1: `QuestRowComponent`**

`src/app/features/quests/quest-row.component.ts`
```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Quest } from '../../../domain/quest/quest.entity';

@Component({
  selector: 'app-quest-row',
  templateUrl: './quest-row.component.html',
  styleUrl: './quest-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestRowComponent {
  readonly quest = input.required<Quest>();
  readonly completed = output<string>(); // emits quest.id

  readonly RARITY_LABEL: Record<string, string> = {
    low: 'COMMUN', med: 'INHABITUEL', hi: 'RARE', urg: 'ÉPIQUE',
  };
  readonly XP_BY_RARITY: Record<string, number> = { low: 5, med: 15, hi: 35, urg: 80 };
  readonly DIAMONDS: Record<string, string> = { low: '◆', med: '◆◆', hi: '◆◆◆', urg: '◆◆◆◆' };
}
```

`src/app/features/quests/quest-row.component.html`
```html
<div class="quest-row pbox notch-corners rarity-{{ quest().rarity }}" [class.done]="quest().status === 'done'">
  <button class="checkbox" [class.checked]="quest().status === 'done'"
    (click)="completed.emit(quest().id)" [disabled]="quest().status === 'done'"
    [attr.aria-label]="'Compléter: ' + quest().title">
    @if (quest().status === 'done') { ✓ }
  </button>
  <span class="diamonds sk">{{ DIAMONDS[quest().rarity] }}</span>
  <div class="quest-info">
    <span class="vt title">{{ quest().title }}</span>
    <span class="tag sk">{{ quest().tag }}</span>
  </div>
  <div class="xp sk">
    <span class="coin">🪙</span>
    +{{ XP_BY_RARITY[quest().rarity] }}
  </div>
</div>
```

- [ ] **Step 2: `QuestsComponent` (Quest Log)**

`src/app/features/quests/quests.component.ts`
```typescript
import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY } from '../../core/di-tokens';
import { GetUserDashboardUseCase } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase, CompleteQuestResult } from '../../../application/complete-quest.use-case';
import { SupabaseAuthService } from '../../../infrastructure/auth/supabase-auth.service';
import { Quest } from '../../../domain/quest/quest.entity';
import { CreateQuestModalComponent } from './create-quest-modal/create-quest-modal.component';

type Filter = 'all' | 'today' | 'active' | 'done';

@Component({
  selector: 'app-quests',
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent],
})
export class QuestsComponent implements OnInit {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly auth = inject(SupabaseAuthService);
  private readonly dashboardUseCase = new GetUserDashboardUseCase(this.questRepo, this.profileRepo);
  private readonly completeUseCase = new CompleteQuestUseCase(this.questRepo, this.profileRepo);

  readonly quests = signal<Quest[]>([]);
  readonly filter = signal<Filter>('all');
  readonly showModal = signal(false);
  readonly lastResult = signal<CompleteQuestResult | null>(null);

  readonly filtered = computed(() => {
    const all = this.quests();
    switch (this.filter()) {
      case 'today':  return all.filter(q => q.today);
      case 'active': return all.filter(q => q.status !== 'done');
      case 'done':   return all.filter(q => q.status === 'done');
      default:       return all;
    }
  });

  async ngOnInit() {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;
    const { allQuests } = await this.dashboardUseCase.execute(userId);
    this.quests.set(allQuests);
  }

  async onQuestCompleted(questId: string) {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;
    const result = await this.completeUseCase.execute(questId, userId, new Date());
    this.lastResult.set(result);
    this.quests.update(list =>
      list.map(q => q.id === questId ? result.quest : q)
    );
  }

  onQuestCreated(quest: Quest) {
    this.quests.update(list => [quest, ...list]);
    this.showModal.set(false);
  }
}
```

`src/app/features/quests/quests.component.html`
```html
<div class="screen-header">
  <div>
    <h2 class="pf" i18n>JOURNAL DE QUÊTES</h2>
    <p class="sk" i18n>{{ filtered().length }} quêtes</p>
  </div>
  <button class="pbtn teal" (click)="showModal.set(true)" i18n>+ NOUVELLE QUÊTE</button>
</div>

<div class="filter-chips">
  @for (f of (['all','today','active','done'] as const); track f) {
    <button class="pbtn sm" [class.ghost]="filter() !== f" (click)="filter.set(f)" i18n>
      {{ f === 'all' ? 'TOUT' : f === 'today' ? 'AUJOURD\'HUI' : f === 'active' ? 'ACTIF' : 'TERMINÉ' }}
    </button>
  }
</div>

<div class="quest-list">
  @for (quest of filtered(); track quest.id) {
    <app-quest-row [quest]="quest" (completed)="onQuestCompleted($event)" />
  }
  @empty {
    <p class="vt empty-state" i18n>Aucune quête. Lance-en une !</p>
  }
</div>

@if (showModal()) {
  <app-create-quest-modal (questCreated)="onQuestCreated($event)" (closed)="showModal.set(false)" />
}
```

`src/app/features/quests/quests.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { QuestsComponent } from './quests.component';

export const QUESTS_ROUTES: Routes = [
  { path: '', component: QuestsComponent },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/app/features/quests/
git commit -m "feat(quests): add quest log screen with filters and inline complete"
```

---

## Task 13 — Dashboard Screen

**Files:**
- Create: `src/app/features/dashboard/dashboard.component.ts`
- Create: `src/app/features/dashboard/dashboard.component.html`
- Create: `src/app/features/dashboard/dashboard.component.css`
- Create: `src/app/features/dashboard/dashboard.routes.ts`

- [ ] **Step 1: Implémenter le composant dashboard**

`src/app/features/dashboard/dashboard.component.ts`
```typescript
import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY } from '../../core/di-tokens';
import { GetUserDashboardUseCase, DashboardData } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase, CompleteQuestResult } from '../../../application/complete-quest.use-case';
import { SupabaseAuthService } from '../../../infrastructure/auth/supabase-auth.service';
import { CreateQuestModalComponent } from '../quests/create-quest-modal/create-quest-modal.component';
import { QuestRowComponent } from '../quests/quest-row.component';
import { XpBarComponent } from '../../shared/xp-bar/xp-bar.component';
import { CatSpriteComponent } from '../../shared/cat-sprite/cat-sprite.component';
import { Quest } from '../../../domain/quest/quest.entity';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent, XpBarComponent, CatSpriteComponent],
})
export class DashboardComponent implements OnInit {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly auth = inject(SupabaseAuthService);
  private readonly dashboardUseCase = new GetUserDashboardUseCase(this.questRepo, this.profileRepo);
  private readonly completeUseCase = new CompleteQuestUseCase(this.questRepo, this.profileRepo);

  readonly data = signal<DashboardData | null>(null);
  readonly showModal = signal(false);
  readonly lastResult = signal<CompleteQuestResult | null>(null);

  readonly xpToday = computed(() => {
    if (!this.lastResult()) return 0;
    return this.lastResult()!.xpEarned;
  });

  readonly profile = computed(() => this.data()?.userProfile ?? null);

  async ngOnInit() {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;
    this.data.set(await this.dashboardUseCase.execute(userId));
  }

  async onQuestCompleted(questId: string) {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;
    const result = await this.completeUseCase.execute(questId, userId, new Date());
    this.lastResult.set(result);
    if (this.data()) {
      this.data.update(prev => ({
        ...prev!,
        todayActive: prev!.todayActive.filter(q => q.id !== questId),
        todayDone: [...prev!.todayDone, result.quest],
        userProfile: result.quest ? prev!.userProfile : prev!.userProfile,
      }));
    }
  }

  onQuestCreated(quest: Quest) {
    this.data.update(prev => prev ? ({
      ...prev,
      todayActive: [quest, ...prev.todayActive],
      allQuests: [quest, ...prev.allQuests],
    }) : prev);
    this.showModal.set(false);
  }
}
```

`src/app/features/dashboard/dashboard.component.html`
```html
@if (data(); as dashboard) {
  <div class="screen-header">
    <div>
      <h2 class="pf" i18n>TABLEAU DE BORD</h2>
      <p class="vt" i18n>Jour {{ dashboard.userProfile.streak.current }} de ta série</p>
    </div>
    <button class="pbtn teal" (click)="showModal.set(true)" i18n>+ NOUVELLE QUÊTE</button>
  </div>

  <div class="stat-blocks">
    <div class="stat-block pbox accent-purple">
      <p class="sk label" i18n>AUJOURD'HUI</p>
      <p class="pf value">{{ dashboard.todayDone.length }}/{{ dashboard.todayActive.length + dashboard.todayDone.length }}</p>
      <p class="sk caption" i18n>quêtes complétées</p>
    </div>
    <div class="stat-block pbox accent-amber">
      <p class="sk label" i18n>SÉRIE</p>
      <p class="pf value">{{ dashboard.userProfile.streak.current }}j 🔥</p>
      <p class="sk caption" i18n>ne brise pas ta série</p>
    </div>
    <div class="stat-block pbox accent-teal">
      <p class="sk label" i18n>XP AUJOURD'HUI</p>
      <p class="pf value">+{{ xpToday() }}</p>
      <p class="sk caption" i18n>points gagnés</p>
    </div>
  </div>

  <h3 class="pf section-title" i18n>QUÊTES DU JOUR</h3>
  <div class="quest-list">
    @for (quest of dashboard.todayActive; track quest.id) {
      <app-quest-row [quest]="quest" (completed)="onQuestCompleted($event)" />
    }
    @for (quest of dashboard.todayDone; track quest.id) {
      <app-quest-row [quest]="quest" (completed)="onQuestCompleted($event)" />
    }
    @empty {
      <p class="vt" i18n>Toutes les quêtes sont terminées ! 🎉</p>
    }
  </div>
}

@if (showModal()) {
  <app-create-quest-modal (questCreated)="onQuestCreated($event)" (closed)="showModal.set(false)" />
}
```

`src/app/features/dashboard/dashboard.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const DASHBOARD_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/dashboard/
git commit -m "feat(dashboard): add main dashboard with stat blocks and today's quests"
```

---

## Task 14 — Level-Up Overlay + XP Toast

**Files:**
- Create: `src/app/features/dashboard/xp-toast.component.ts`
- Create: `src/app/features/dashboard/level-up.component.ts`
- Create: `src/app/features/dashboard/level-up.component.html`
- Create: `src/app/features/dashboard/level-up.component.css`

- [ ] **Step 1: `XpToastComponent` (toast inline)**

`src/app/features/dashboard/xp-toast.component.ts`
```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xp-toast',
  template: `
    <div class="xp-toast pf" [class.visible]="visible()">
      +{{ xp() }} XP
    </div>
  `,
  styles: [`
    .xp-toast {
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: var(--acc-amber); color: #2a1a05;
      padding: 12px 24px; font-size: 14px;
      box-shadow: 4px 4px 0 0 rgba(0,0,0,0.6);
      opacity: 0; transition: opacity 200ms steps(4);
      pointer-events: none; z-index: 200;
    }
    .xp-toast.visible { opacity: 1; animation: rise 200ms steps(4) forwards; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpToastComponent {
  readonly xp = input(0);
  readonly visible = input(false);
}
```

- [ ] **Step 2: `LevelUpComponent`**

`src/app/features/dashboard/level-up.component.ts`
```typescript
import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CatSpriteComponent } from '../../shared/cat-sprite/cat-sprite.component';
import { UserProfile } from '../../../domain/profile/user-profile.entity';

@Component({
  selector: 'app-level-up',
  templateUrl: './level-up.component.html',
  styleUrl: './level-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CatSpriteComponent],
})
export class LevelUpComponent {
  readonly profile = input.required<UserProfile>();
  readonly continued = output<void>();

  readonly stage = computed(() => this.profile().stage);
  readonly level = computed(() => this.profile().level);
}
```

`src/app/features/dashboard/level-up.component.html`
```html
<div class="levelup-overlay">
  <div class="rays"></div>
  <app-cat-sprite [palette]="profile().palette" [stage]="stage()" [pixelSize]="14" />
  <div class="banner pf" i18n>NIVEAU SUPÉRIEUR !</div>
  <div class="level-number pf">{{ level() }}</div>
  <button class="pbtn amber" (click)="continued.emit()" i18n>CONTINUER LA RUN →</button>
</div>
```

`src/app/features/dashboard/level-up.component.css`
```css
.levelup-overlay {
  position: fixed; inset: 0; background: var(--bg-void);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px; z-index: 300; animation: pop-in 400ms steps(6) forwards;
}
.banner { font-size: 28px; color: var(--acc-amber); animation: flag-shake 0.3s steps(2) 3; }
.level-number { font-size: 64px; color: var(--text-hi);
  text-shadow: 4px 4px 0 var(--acc-purple-dk), 8px 8px 0 rgba(0,0,0,0.5); }
.rays {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  animation: ray-rotate 12s linear infinite;
}
```

- [ ] **Step 3: Intégrer toast + level-up dans `DashboardComponent`**

Modifier `dashboard.component.ts` — ajouter signals et logique :
```typescript
// Ajouter dans DashboardComponent :
readonly showLevelUp = signal(false);
readonly showXpToast = signal(false);
readonly xpEarned = signal(0);

// Modifier onQuestCompleted() — ajouter après lastResult.set(result) :
this.xpEarned.set(result.xpEarned);
this.showXpToast.set(true);
setTimeout(() => this.showXpToast.set(false), 1200);
if (result.levelUp) {
  setTimeout(() => this.showLevelUp.set(true), 400);
}
```

Modifier `dashboard.component.html` — ajouter avant la fermeture :
```html
<app-xp-toast [xp]="xpEarned()" [visible]="showXpToast()" />

@if (showLevelUp() && profile()) {
  <app-level-up [profile]="profile()!" (continued)="showLevelUp.set(false)" />
}
```

Ajouter les imports dans `dashboard.component.ts` :
```typescript
imports: [QuestRowComponent, CreateQuestModalComponent, XpBarComponent, CatSpriteComponent, XpToastComponent, LevelUpComponent],
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/xp-toast.component.ts src/app/features/dashboard/level-up.*
git commit -m "feat(gamification): add XP toast and level-up overlay with cat evolution reveal"
```

---

## Task 15 — App Shell (3 colonnes, routing, nav, right rail)

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`
- Modify: `src/app/app.css`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Configurer les routes**

`src/app/app.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'quests',    loadChildren: () => import('./features/quests/quests.routes').then(m => m.QUESTS_ROUTES) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

- [ ] **Step 2: Implémenter l'App Shell**

`src/app/app.ts`
```typescript
import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseAuthService } from '../infrastructure/auth/supabase-auth.service';
import { CatSpriteComponent } from './shared/cat-sprite/cat-sprite.component';
import { XpBarComponent } from './shared/xp-bar/xp-bar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CatSpriteComponent, XpBarComponent],
})
export class App {
  readonly auth = inject(SupabaseAuthService);
  readonly isLoggedIn = computed(() => !!this.auth.session());
}
```

`src/app/app.html`
```html
@if (!isLoggedIn()) {
  <router-outlet />
} @else {
  <div class="shell scanlines vignette">
    <!-- Left rail -->
    <nav class="left-rail">
      <div class="logo">
        <span class="pf" i18n>RESPAWN</span>
        <span class="sk tagline" i18n>9 VIES · 1 JOUR À LA FOIS</span>
      </div>
      <ul class="nav-links">
        <li><a routerLink="/dashboard" routerLinkActive="active" class="nav-item pf" i18n>TABLEAU DE BORD</a></li>
        <li><a routerLink="/quests" routerLinkActive="active" class="nav-item pf" i18n>QUÊTES</a></li>
      </ul>
      <button class="pbtn ghost sm new-quest-btn" routerLink="/quests" i18n>+ NOUVELLE QUÊTE</button>
    </nav>

    <!-- Center main -->
    <main class="main-area">
      <router-outlet />
    </main>

    <!-- Right rail (companion) -->
    <aside class="right-rail">
      <p class="sk companion-label" i18n>COMPAGNON</p>
    </aside>
  </div>
}
```

`src/app/app.css`
```css
.shell {
  display: grid;
  grid-template-columns: minmax(200px, 220px) minmax(0, 1fr) minmax(280px, 320px);
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.left-rail {
  background: var(--bg-deep);
  border-right: 4px solid var(--border-dim);
  display: flex; flex-direction: column;
  padding: 24px 16px;
  overflow-y: auto;
}

.logo { margin-bottom: 32px; }
.logo .pf { color: var(--acc-purple); font-size: 14px; display: block; }
.logo .tagline { font-size: 9px; color: var(--text-mut); }

.nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.nav-item {
  display: block; padding: 12px 16px; font-size: 9px; color: var(--text);
  text-decoration: none;
}
.nav-item.active { background: var(--acc-purple); color: var(--text-hi); }
.new-quest-btn { margin-top: auto; width: 100%; }

.main-area { overflow-y: auto; padding: 24px; }

.right-rail {
  background: var(--bg-deep);
  border-left: 4px solid var(--border-dim);
  padding: 24px 16px;
  overflow-y: auto;
}
```

- [ ] **Step 3: Lancer l'app et vérifier le flux complet**

```bash
pnpm ng serve
```

Vérifier :
1. `/auth` → formulaire sign-up/sign-in
2. Après connexion → redirect `/dashboard`
3. Shell 3 colonnes visible
4. Navigation dashboard ↔ quêtes fonctionne
5. Créer une quête → apparaît dans la liste
6. Compléter une quête → toast XP apparaît

- [ ] **Step 4: Commit final Phase 1**

```bash
git add src/app/
git commit -m "feat(shell): add 3-column app shell with routing, nav, and auth guard"
```

---

## Self-Review

**Couverture de la spec :**
- ✅ Auth (sign-up, sign-in, sign-out)
- ✅ Quests CRUD (create + complete)
- ✅ XP system (par rareté + bonus streak)
- ✅ Level system (seuils, level-up overlay)
- ✅ Streak system (evaluate(), broken → perte de vie)
- ✅ Lives system (9 - streaks brisés)
- ✅ Dashboard (stat blocks, quêtes du jour)
- ✅ Design system (tokens CSS, pixel composants)
- ✅ CatSprite (palette + 6 stades)
- ✅ XP toast + level-up celebration
- ✅ i18n (templates en français, attributs `i18n`)
- ✅ App shell 3 colonnes
- ✅ Clean Architecture (domain → application → infrastructure → presentation)
- ✅ DI tokens (QUEST_REPOSITORY, PROFILE_REPOSITORY)
- ✅ Angular standalone + OnPush + Signals

**Manquant de la Phase 1 (intentionnellement Phase 2) :**
- Leaderboard, Duels, Amis, Notifications — hors scope Phase 1

**Cohérence des types :**
- `QuestRarity` : `'low' | 'med' | 'hi' | 'urg'` — cohérent dans toutes les tâches
- `CatStage` : `'kitten' | 'stray' | 'ninja' | 'samurai' | 'arcane' | 'legendary'` — cohérent
- `CatPalette` : 8 valeurs — cohérent entre sprites.data.ts et user-profile.entity.ts
- `CompleteQuestResult` : interface définie dans Task 6, réutilisée dans Tasks 12, 13, 14

**Note Task 10 :** les valeurs exactes de `PALETTES` et des grilles de sprites doivent être copiées depuis `design-export/respawn/project/design_handoff_respawn/sprites.jsx`. Les placeholders dans le plan sont des approximations à remplacer.
