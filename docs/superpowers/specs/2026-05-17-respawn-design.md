# Respawn — Design Document

**Date:** 2026-05-17  
**Status:** Approved  
**Stack:** Angular + Supabase + TypeScript

---

## Vision

Respawn est une application de gestion d'objectifs gamifiée. Chaque jour, l'utilisateur "respawn" — il relance sa run, affronte ses défis, accumule de l'XP et maintient son streak. Les tâches ne sont pas une liste à cocher : ce sont des quêtes à accomplir. Les amis ne sont pas des contacts : ce sont des rivaux et alliés dans un classement commun.

---

## Phases d'implémentation

| Phase | Contenu | Livrable |
|-------|---------|----------|
| 1 | Auth + Tâches + XP/Levels/Streaks | App solo gamifiée |
| 2 | Leaderboard + Défis + Amis | Couche sociale complète |
| 3 | AI Task Parser (Claude API) | Création de tâches assistée |

---

## Architecture globale

Clean Architecture + Feature Modules Angular. Les dépendances pointent toujours vers l'intérieur.

```
┌─────────────────────────────────────────┐
│         Presentation (Angular)          │
│   feature modules, components, signals  │
├─────────────────────────────────────────┤
│             Infrastructure              │
│   Supabase repos, realtime, auth        │
├─────────────────────────────────────────┤
│              Application                │
│   use cases (CompleteTask, ComputeXP…)  │
├─────────────────────────────────────────┤
│               Domain                    │
│   entités TS pures, aucune dépendance   │
└─────────────────────────────────────────┘
```

**Règle absolue :** le domain ne connaît ni Angular ni Supabase. Supabase est un détail d'infrastructure branché via des interfaces (ports).

---

## Structure de dossiers

```
src/
  domain/
    task/
      task.entity.ts
      task-status.value-object.ts
      task-priority.value-object.ts
      xp-reward.value-object.ts
      task.repository.ts              ← interface (port)
    profile/
      user-profile.entity.ts
      streak.entity.ts
      profile.repository.ts
    challenge/
      challenge.entity.ts
      challenge-metric.value-object.ts
      challenge.repository.ts
    friendship/
      friendship.entity.ts
      friendship.repository.ts
    notification/
      notification.entity.ts
      notification.repository.ts

  application/
    create-task.use-case.ts
    complete-task.use-case.ts
    get-user-dashboard.use-case.ts
    parse-task-from-text.use-case.ts  ← phase 3
    launch-challenge.use-case.ts
    accept-challenge.use-case.ts
    resolve-challenge.use-case.ts
    get-leaderboard.use-case.ts
    send-friend-request.use-case.ts
    accept-friend-request.use-case.ts

  infrastructure/
    supabase/
      task.repository.ts
      profile.repository.ts
      challenge.repository.ts
      friendship.repository.ts
      notification.repository.ts
      supabase.client.ts
    auth/
      supabase-auth.adapter.ts
    ai/
      claude-task-parser.ts           ← phase 3, implémente ITaskParser

  app/
    core/
      auth.guard.ts
      di-tokens.ts
    shared/
      ui/                             ← composants réutilisables
    features/
      auth/                           ← lazy loaded
      tasks/
      gamification/
      social/
```

---

## Domain layer

### Entités

#### Task
```typescript
class Task {
  id: string
  ownerId: string
  title: string
  description?: string
  status: TaskStatus        // TODO | IN_PROGRESS | DONE
  priority: TaskPriority    // LOW | MEDIUM | HIGH | URGENT
  dueDate?: Date
  completedAt?: Date
  createdAt: Date

  complete(): { task: Task; xpEarned: number }
}
```

#### UserProfile
```typescript
class UserProfile {
  userId: string
  username: string
  avatarUrl?: string
  xp: number
  level: number
  streak: Streak
  createdAt: Date

  applyXP(amount: number): { profile: UserProfile; levelUp: boolean }
}
```

#### Streak
```typescript
class Streak {
  current: number         // jours consécutifs actifs
  longest: number         // record personnel
  lastActivityDate?: Date

  evaluate(today: Date): Streak
}
```

#### Challenge
```typescript
class Challenge {
  id: string
  challengerId: string
  challengedId: string
  title: string
  metric: ChallengeMetric   // TASKS_COMPLETED | XP_EARNED
  startDate: Date
  endDate: Date
  status: ChallengeStatus   // PENDING | ACTIVE | COMPLETED | CANCELLED
  challengerMessage?: string
  challengedMessage?: string
  winnerId?: string

  isExpired(today: Date): boolean
  resolveWinner(challengerScore: number, challengedScore: number): Challenge
}
```

### Barème XP

| Priorité | XP de base |
|----------|-----------|
| LOW      | 10 XP     |
| MEDIUM   | 25 XP     |
| HIGH     | 50 XP     |
| URGENT   | 100 XP    |

**Streak bonus :** +10% par jour de streak consécutif, plafonné à +100% (streak ≥ 10 jours).

### Seuils de level

| Level | XP requis |
|-------|-----------|
| 1     | 0         |
| 2     | 100       |
| 3     | 250       |
| 4     | 500       |
| 5     | 1 000     |
| N     | N² × 40   |

### Interfaces repository (ports)

```typescript
interface ITaskRepository {
  findByUser(userId: string): Promise<Task[]>
  findById(id: string): Promise<Task | null>
  save(task: Task): Promise<Task>
}

interface IUserProfileRepository {
  findById(userId: string): Promise<UserProfile | null>
  save(profile: UserProfile): Promise<UserProfile>
  findFriendsLeaderboard(userId: string, period: 'week' | 'month' | 'all'): Promise<UserProfile[]>
}

interface IChallengeRepository {
  findActive(userId: string): Promise<Challenge[]>
  findById(id: string): Promise<Challenge | null>
  save(challenge: Challenge): Promise<Challenge>
}

interface IFriendshipRepository {
  findAccepted(userId: string): Promise<Friendship[]>
  findPending(userId: string): Promise<Friendship[]>
  save(friendship: Friendship): Promise<Friendship>
}

interface INotificationRepository {
  findUnread(userId: string): Promise<Notification[]>
  markRead(id: string): Promise<void>
  save(notification: Notification): Promise<Notification>
}

interface ITaskParser {
  parse(text: string): Promise<TaskDraft>
}
```

---

## Application layer — Use cases

### CompleteTask (phase 1 — critique)

```
Input : taskId, userId, today: Date
1. taskRepo.findById(taskId)
2. task.complete()                       → xpEarned (priorité × streak bonus)
3. profileRepo.findById(userId)
4. streak.evaluate(today)                → maintient / incrémente / reset
5. profile.applyXP(xpEarned)            → recalcule level si seuil franchi
6. taskRepo.save(task)
7. profileRepo.save(profile)
Output : { task, xpEarned, levelUp: boolean, streak }
```

Ce retour riche alimente directement les animations de feedback dans l'UI.

### GetUserDashboard (phase 1)
Agrège tâches du jour + profil XP/level/streak en une seule passe.

### LaunchChallenge (phase 2)
Crée un challenge PENDING avec message optionnel, notifie l'adversaire.

### AcceptChallenge (phase 2)
Passe le challenge à ACTIVE, enregistre le message de réponse optionnel.

### ResolveChallenge (phase 2)
Appelé par edge function Supabase à `end_date` — calcule les scores et désigne le winner.

### ParseTaskFromText (phase 3)
Délègue à `ITaskParser`. En phase 1 : règles locales (mots-clés → priorité). En phase 3 : Claude API.

---

## Base de données (Supabase)

### Schéma

```sql
-- Profils (étend auth.users)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id),
  username         TEXT UNIQUE NOT NULL,
  avatar_url       TEXT,
  xp               INTEGER DEFAULT 0,
  level            INTEGER DEFAULT 1,
  streak_current   INTEGER DEFAULT 0,
  streak_longest   INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tâches
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(id),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Amitiés
CREATE TABLE friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES profiles(id),
  addressee_id  UUID NOT NULL REFERENCES profiles(id),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Défis
CREATE TABLE challenges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id       UUID NOT NULL REFERENCES profiles(id),
  challenged_id       UUID NOT NULL REFERENCES profiles(id),
  title               TEXT NOT NULL,
  metric              TEXT NOT NULL CHECK (metric IN ('tasks_completed','xp_earned')),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled')),
  challenger_message  TEXT,
  challenged_message  TEXT,
  winner_id           UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id),
  type       TEXT NOT NULL CHECK (type IN ('friend_request','challenge_received','challenge_result','level_up')),
  payload    JSONB DEFAULT '{}',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS

```sql
-- profiles : lecture publique, écriture sur son propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- tasks : CRUD uniquement sur ses propres tâches
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all" ON tasks TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- friendships : visible si participant
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select" ON friendships FOR SELECT TO authenticated
  USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()));
CREATE POLICY "friendships_insert" ON friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = (SELECT auth.uid()));
CREATE POLICY "friendships_update" ON friendships FOR UPDATE TO authenticated
  USING (addressee_id = (SELECT auth.uid()));

-- challenges : visible si participant, créable uniquement en tant que challenger
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select" ON challenges FOR SELECT TO authenticated
  USING (challenger_id = (SELECT auth.uid()) OR challenged_id = (SELECT auth.uid()));
CREATE POLICY "challenges_insert" ON challenges FOR INSERT TO authenticated
  WITH CHECK (challenger_id = (SELECT auth.uid()));
CREATE POLICY "challenges_update" ON challenges FOR UPDATE TO authenticated
  USING (challenger_id = (SELECT auth.uid()) OR challenged_id = (SELECT auth.uid()));

-- notifications : uniquement les siennes
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all" ON notifications TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
```

**Realtime** activé uniquement sur `notifications`.

---

## Social features

### Leaderboard
Classement des amis par XP sur 3 périodes (semaine / mois / all-time). Rafraîchi à chaque visite — pas de temps réel nécessaire. Chaque entrée affiche : username, avatar, level, XP de la période, streak actuel.

### Flow amitié
```
Recherche par username
  → envoi demande (friendship: pending)
  → notification in-app → acceptation ou refus
  → si accepté : apparaît dans le leaderboard
```

### Flow challenge
```
Challenger : choisit ami + métrique + dates + message?
  → challenge: PENDING
  → notification → adversaire accepte (+ message?) ou refuse
  → si accepté : challenge: ACTIVE
  → à end_date : edge function calcule winner → challenge: COMPLETED
```

---

## Injection de dépendances Angular

```typescript
// core/di-tokens.ts
export const TASK_REPOSITORY      = new InjectionToken<ITaskRepository>('TaskRepository')
export const PROFILE_REPOSITORY   = new InjectionToken<IUserProfileRepository>('ProfileRepository')
export const CHALLENGE_REPOSITORY = new InjectionToken<IChallengeRepository>('ChallengeRepository')
export const TASK_PARSER          = new InjectionToken<ITaskParser>('TaskParser')

// app.config.ts
providers: [
  { provide: TASK_REPOSITORY,      useClass: SupabaseTaskRepository },
  { provide: PROFILE_REPOSITORY,   useClass: SupabaseProfileRepository },
  { provide: CHALLENGE_REPOSITORY, useClass: SupabaseChallengeRepository },
  { provide: TASK_PARSER,          useClass: LocalTaskParser },  // phase 3 → ClaudeTaskParser
]
```

---

## GitHub workflow

### Branches
```
main      ← production, protégée
develop   ← intégration continue
feat/X    ← features
fix/X     ← bugfixes
chore/X   ← setup, config, tooling
```

### Issues prévues (dans l'ordre d'implémentation)

**Phase 1**
```
[chore] Setup Angular project + Clean Architecture structure
[chore] Setup Supabase + schéma DB + RLS
[feat] Auth (sign up, sign in, sign out)
[feat] Create & complete task (UX guidée 2 étapes)
[feat] XP + level system
[feat] Streak system
[feat] Dashboard gamification
```

**Phase 2**
```
[feat] Friend requests
[feat] Leaderboard
[feat] Challenges (launch + accept + resolve)
[feat] Notifications in-app (realtime)
```

**Phase 3**
```
[feat] AI task parser (Claude API)
```

### Conventions de commit
```
feat(tasks): add complete-task use case
feat(gamification): implement xp reward and level thresholds
chore(infra): setup supabase client and di tokens
fix(streak): reset streak when gap > 1 day
```

---

## Diagrammes

### ERD

```mermaid
erDiagram
    profiles {
        uuid id PK
        text username
        integer xp
        integer level
        integer streak_current
        integer streak_longest
        date last_activity_date
    }
    tasks {
        uuid id PK
        uuid owner_id FK
        text title
        text status
        text priority
        date due_date
        timestamptz completed_at
    }
    friendships {
        uuid id PK
        uuid requester_id FK
        uuid addressee_id FK
        text status
    }
    challenges {
        uuid id PK
        uuid challenger_id FK
        uuid challenged_id FK
        text metric
        text status
        text challenger_message
        text challenged_message
        uuid winner_id FK
    }
    notifications {
        uuid id PK
        uuid user_id FK
        text type
        jsonb payload
        boolean read
    }

    profiles ||--o{ tasks : "owns"
    profiles ||--o{ friendships : "requests"
    profiles ||--o{ challenges : "challenges"
    profiles ||--o{ notifications : "receives"
```

### Flow — CompleteTask

```mermaid
flowchart TD
    A[CompleteTask appelé] --> B[task.complete]
    B --> C[Calcul XP\npriority × streak bonus]
    C --> D[streak.evaluate today]
    D --> E{Activité hier?}
    E -->|oui| F[streak++]
    E -->|non et aujourd'hui| G[streak maintenu]
    E -->|non et gap > 1j| H[streak reset à 1]
    F --> I[profile.applyXP]
    G --> I
    H --> I
    I --> J{Seuil level franchi?}
    J -->|oui| K[level++\nlevelUp: true]
    J -->|non| L[levelUp: false]
    K --> M[Persist task + profile]
    L --> M
    M --> N[Retour: task, xpEarned,\nlevelUp, streak]
```

### Flow — Challenge lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING : LaunchChallenge\n+ message?
    PENDING --> ACTIVE : AcceptChallenge\n+ message?
    PENDING --> CANCELLED : RejectChallenge
    ACTIVE --> COMPLETED : end_date atteinte\nResolveChallenge
    ACTIVE --> CANCELLED : Annulation mutuelle
    COMPLETED --> [*]
    CANCELLED --> [*]
```
