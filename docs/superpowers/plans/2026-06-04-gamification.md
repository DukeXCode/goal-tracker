# Gamification Implementation Plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XP, levels, and achievements to the goal tracker app to motivate consistent engagement without pressuring daily use.

**Architecture:** Server-side XP calculation in Hono route handlers. New `user_stats` and `achievements` tables in D1. Frontend displays level/progress on dashboard, XP toasts on actions, and an achievements sub-page. No streaks, no animations that slow workflow.

**Tech Stack:** Hono (API), D1/SQLite (database), React 19 + TanStack Query (frontend), Tailwind CSS v4, TypeScript, shared types via `@goal-tracker/shared`.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `apps/api/src/db/migrations/004_gamification.sql` | Database migration for `user_stats` and `achievements` tables |
| `apps/api/src/lib/gamification.ts` | XP calculation, level computation, achievement checking logic |
| `apps/api/src/routes/gamification.ts` | API routes: `GET /stats`, `GET /achievements` |
| `apps/web/src/hooks/useGamification.ts` | React hook for fetching gamification state |
| `apps/web/src/components/XpToast.tsx` | Transient "+XP" toast component |
| `apps/web/src/components/LevelBadge.tsx` | Reusable level number badge |
| `apps/web/src/components/LevelProgressBar.tsx` | Thin XP progress bar |
| `apps/web/src/components/AchievementCard.tsx` | Achievement display card (earned/locked) |
| `apps/web/src/pages/AchievementsPage.tsx` | Full achievements list page |

### Modified Files
| File | Changes |
|------|---------|
| `apps/api/src/db/schema.sql` | Add `user_stats` and `achievements` table definitions |
| `apps/api/src/index.ts` | Mount gamification routes with auth middleware |
| `apps/api/src/routes/goals.ts` | Award XP on status change to `in_progress` and `completed` |
| `apps/api/src/routes/journal.ts` | Award XP on journal entry creation |
| `apps/api/src/routes/coaching.ts` | Award XP on coaching session completion |
| `packages/shared/src/types.ts` | Add gamification types (`UserStats`, `Achievement`, `GamificationResponse`) |
| `apps/web/src/lib/api.ts` | Add gamification API methods |
| `apps/web/src/pages/DashboardPage.tsx` | Add level badge, progress bar, and achievements link |
| `apps/web/src/components/Layout.tsx` | Add level badge to sidebar user area |
| `apps/web/src/App.tsx` | Add `/achievements` route |

---

## Phase 1: XP System (Core)

### Task 1: Database Migration

**Files:**
- Create: `apps/api/src/db/migrations/004_gamification.sql`
- Modify: `apps/api/src/db/schema.sql`

- [ ] **Step 1: Create migration file**

```sql
-- apps/api/src/db/migrations/004_gamification.sql

CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT PRIMARY KEY DEFAULT 'single_user',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  achievement_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  earned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);
```

- [ ] **Step 2: Append to schema.sql**

Add the following to the end of `apps/api/src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT PRIMARY KEY DEFAULT 'single_user',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  achievement_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  earned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);
```

- [ ] **Step 3: Run migration locally**

```bash
cd apps/api && npx wrangler d1 execute goal-tracker-db --local --file=../src/db/migrations/004_gamification.sql
```

Expected: Tables created successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/migrations/004_gamification.sql apps/api/src/db/schema.sql
git commit -m "feat: add gamification database tables (user_stats, achievements)"
```

---

### Task 2: Shared Types

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Add gamification types**

Append to the end of `packages/shared/src/types.ts`:

```typescript
// Gamification types
export interface UserStats {
  id: string;
  xp: number;
  level: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string | null;
  created_at: string;
}

export interface GamificationStats {
  user_stats: UserStats;
  xp_to_next_level: number;
  xp_in_current_level: number;
}

export interface GamificationAction {
  xp_awarded: number;
  total_xp: number;
  new_level: number | null;
  achievements_unlocked: Achievement[];
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat: add gamification shared types"
```

---

### Task 3: Gamification Logic Library

**Files:**
- Create: `apps/api/src/lib/gamification.ts`

- [ ] **Step 1: Create gamification library**

```typescript
// apps/api/src/lib/gamification.ts
import type { Bindings } from "../index";
import type { GamificationAction, Achievement } from "@goal-tracker/shared";

const XP_VALUES = {
  GOAL_COMPLETED: 50,
  GOAL_IN_PROGRESS: 10,
  JOURNAL_ENTRY: 20,
  COACHING_SESSION: 20,
} as const;

const ACHIEVEMENT_DEFINITIONS = [
  {
    achievement_key: "first_step",
    title: "First Step",
    description: "Complete your first goal",
    icon: "footprint",
  },
  {
    achievement_key: "goal_setter",
    title: "Goal Setter",
    description: "Create 5 goals",
    icon: "bullseye",
  },
  {
    achievement_key: "finisher",
    title: "Finisher",
    description: "Complete 5 goals",
    icon: "flag",
  },
  {
    achievement_key: "reflectionist",
    title: "Reflectionist",
    description: "Write 10 journal entries",
    icon: "book",
  },
  {
    achievement_key: "consistent",
    title: "Consistent",
    description: "Write 20 journal entries",
    icon: "clock",
  },
  {
    achievement_key: "in_session",
    title: "In Session",
    description: "Complete 3 coaching sessions",
    icon: "chat",
  },
  {
    achievement_key: "level_5",
    title: "Level 5",
    description: "Reach level 5",
    icon: "star",
  },
  {
    achievement_key: "level_10",
    title: "Level 10",
    description: "Reach level 10",
    icon: "crown",
  },
  {
    achievement_key: "centurion",
    title: "Centurion",
    description: "Earn 1,000 total XP",
    icon: "medal",
  },
] as const;

function calculateLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 100;
  let totalXpUsed = 0;

  while (totalXpUsed + xpNeeded <= xp) {
    totalXpUsed += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }

  return level;
}

function getXpForNextLevel(level: number): number {
  return level * 100;
}

function getXpInCurrentLevel(xp: number, level: number): number {
  let totalXpUsed = 0;
  for (let l = 1; l < level; l++) {
    totalXpUsed += l * 100;
  }
  return xp - totalXpUsed;
}

export async function awardXp(
  db: D1Database,
  amount: number
): Promise<GamificationAction> {
  // Ensure user_stats row exists
  await db
    .prepare(
      `INSERT OR IGNORE INTO user_stats (id, xp, level, updated_at) VALUES ('single_user', 0, 1, datetime('now'))`
    )
    .run();

  // Get current stats
  const stats = await db
    .prepare("SELECT * FROM user_stats WHERE id = 'single_user'")
    .first<{ xp: number; level: number }>();

  const currentXp = stats?.xp ?? 0;
  const currentLevel = stats?.level ?? 1;
  const newTotalXp = currentXp + amount;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > currentLevel;

  // Update stats
  await db
    .prepare(
      `UPDATE user_stats SET xp = ?, level = ?, updated_at = datetime('now') WHERE id = 'single_user'`
    )
    .bind(newTotalXp, newLevel)
    .run();

  // Check achievements
  const unlockedAchievements = await checkAchievements(db, newTotalXp, newLevel);

  return {
    xp_awarded: amount,
    total_xp: newTotalXp,
    new_level: leveledUp ? newLevel : null,
    achievements_unlocked: unlockedAchievements,
  };
}

async function checkAchievements(
  db: D1Database,
  totalXp: number,
  level: number
): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];

  // Ensure achievements are seeded
  await seedAchievements(db);

  // Get current achievements
  const achievements = await db
    .prepare("SELECT * FROM achievements WHERE earned_at IS NULL")
    .all<{ achievement_key: string }>();

  const earnedKeys = new Set(
    (
      await db
        .prepare("SELECT achievement_key FROM achievements WHERE earned_at IS NOT NULL")
        .all<{ achievement_key: string }>()
    ).results.map((a) => a.achievement_key)
  );

  for (const achievement of achievements.results) {
    if (earnedKeys.has(achievement.achievement_key)) continue;

    const shouldEarn = await checkAchievementCondition(
      db,
      achievement.achievement_key,
      totalXp,
      level
    );

    if (shouldEarn) {
      const now = new Date().toISOString();
      await db
        .prepare(
          "UPDATE achievements SET earned_at = ? WHERE achievement_key = ?"
        )
        .bind(now, achievement.achievement_key)
        .run();

      const earned = await db
        .prepare(
          "SELECT * FROM achievements WHERE achievement_key = ?"
        )
        .bind(achievement.achievement_key)
        .first<Achievement>();

      if (earned) unlocked.push(earned);
    }
  }

  return unlocked;
}

async function checkAchievementCondition(
  db: D1Database,
  key: string,
  totalXp: number,
  level: number
): Promise<boolean> {
  switch (key) {
    case "first_step": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM goals WHERE status = 'completed'")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 1;
    }
    case "goal_setter": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM goals")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 5;
    }
    case "finisher": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM goals WHERE status = 'completed'")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 5;
    }
    case "reflectionist": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM journal_entries")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 10;
    }
    case "consistent": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM journal_entries")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 20;
    }
    case "in_session": {
      const count = await db
        .prepare("SELECT COUNT(*) as count FROM coaching_sessions")
        .first<{ count: number }>();
      return (count?.count ?? 0) >= 3;
    }
    case "level_5":
      return level >= 5;
    case "level_10":
      return level >= 10;
    case "centurion":
      return totalXp >= 1000;
    default:
      return false;
  }
}

async function seedAchievements(db: D1Database): Promise<void> {
  const existing = await db
    .prepare("SELECT COUNT(*) as count FROM achievements")
    .first<{ count: number }>();

  if ((existing?.count ?? 0) > 0) return;

  const now = new Date().toISOString();
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO achievements (id, achievement_key, title, description, icon, earned_at, created_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?)`
      )
      .bind(id, def.achievement_key, def.title, def.description, def.icon, now)
      .run();
  }
}

export async function getStats(db: D1Database) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO user_stats (id, xp, level, updated_at) VALUES ('single_user', 0, 1, datetime('now'))`
    )
    .run();

  const stats = await db
    .prepare("SELECT * FROM user_stats WHERE id = 'single_user'")
    .first<{ id: string; xp: number; level: number; updated_at: string }>();

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;

  return {
    user_stats: stats ?? { id: "single_user", xp: 0, level: 1, updated_at: now },
    xp_to_next_level: getXpForNextLevel(level),
    xp_in_current_level: getXpInCurrentLevel(xp, level),
  };
}

export async function getAchievements(db: D1Database) {
  await seedAchievements(db);

  const achievements = await db
    .prepare("SELECT * FROM achievements ORDER BY earned_at DESC NULLS LAST, created_at ASC")
    .all<Achievement>();

  return achievements.results;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/gamification.ts
git commit -m "feat: add gamification logic library (XP, levels, achievements)"
```

---

### Task 4: Gamification API Routes

**Files:**
- Create: `apps/api/src/routes/gamification.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create gamification routes**

```typescript
// apps/api/src/routes/gamification.ts
import { Hono } from "hono";
import type { Bindings } from "../index";
import { getStats, getAchievements } from "../lib/gamification";

export const gamificationRoutes = new Hono<{ Bindings: Bindings }>();

gamificationRoutes.get("/stats", async (c) => {
  const stats = await getStats(c.env.DB);
  return c.json({ data: stats });
});

gamificationRoutes.get("/achievements", async (c) => {
  const achievements = await getAchievements(c.env.DB);
  return c.json({ data: achievements });
});
```

- [ ] **Step 2: Mount routes in index.ts**

Add import and route mounting to `apps/api/src/index.ts`:

After the line `import { authMiddleware } from "./middleware/auth";`, add:
```typescript
import { gamificationRoutes } from "./routes/gamification";
```

After the line `app.use("/api/coaching/*", authMiddleware);`, add:
```typescript
app.use("/api/gamification/*", authMiddleware);
```

After the line `app.route("/api/coaching", coachingRoutes);`, add:
```typescript
app.route("/api/gamification", gamificationRoutes);
```

- [ ] **Step 3: Verify server starts**

```bash
cd apps/api && npx wrangler dev --port 8787
```

Expected: Server starts without errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/gamification.ts apps/api/src/index.ts
git commit -m "feat: add gamification API routes (/stats, /achievements)"
```

---

### Task 5: Award XP in Goal Routes

**Files:**
- Modify: `apps/api/src/routes/goals.ts`

- [ ] **Step 1: Import gamification library**

Add at the top of `apps/api/src/routes/goals.ts`:
```typescript
import { awardXp } from "../lib/gamification";
```

- [ ] **Step 2: Award XP on status change to in_progress**

In the `goalRoutes.put("/:id")` handler, after the line `const now = new Date().toISOString();` and before the `UPDATE` query, add XP award logic:

```typescript
  // Award XP for status changes
  let gamificationResult = null;
  if (body.status && body.status !== existing.status) {
    if (body.status === "in_progress" && existing.status === "not_started") {
      gamificationResult = await awardXp(c.env.DB, 10);
    } else if (body.status === "completed" && existing.status !== "completed") {
      gamificationResult = await awardXp(c.env.DB, 50);
    }
  }
```

- [ ] **Step 3: Include gamification in response**

Change the return statement from:
```typescript
  return c.json({ data: updated });
```
To:
```typescript
  return c.json({
    data: gamificationResult
      ? { ...updated, gamification: gamificationResult }
      : updated,
  });
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/goals.ts
git commit -m "feat: award XP on goal status changes (in_progress: 10, completed: 50)"
```

---

### Task 6: Award XP in Journal Routes

**Files:**
- Modify: `apps/api/src/routes/journal.ts`

- [ ] **Step 1: Import gamification library**

Add at the top of `apps/api/src/routes/journal.ts`:
```typescript
import { awardXp } from "../lib/gamification";
```

- [ ] **Step 2: Award XP on journal entry creation**

In the `journalRoutes.post("/")` handler, before the final `return c.json({ data: created }, 201);`, add:

```typescript
  // Award XP for journal entry
  const gamificationResult = await awardXp(c.env.DB, 20);
```

- [ ] **Step 3: Include gamification in response**

Change the return statement from:
```typescript
  return c.json({ data: created }, 201);
```
To:
```typescript
  return c.json({
    data: { ...created, gamification: gamificationResult },
  }, 201);
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/journal.ts
git commit -m "feat: award XP on journal entry creation (20 XP)"
```

---

### Task 7: Award XP in Coaching Routes

**Files:**
- Modify: `apps/api/src/routes/coaching.ts`

- [ ] **Step 1: Import gamification library**

Add at the top of `apps/api/src/routes/coaching.ts`:
```typescript
import { awardXp } from "../lib/gamification";
```

- [ ] **Step 2: Award XP on coaching session completion**

In the `coachingRoutes.post("/sessions/complete")` handler, before the final return statement that returns the session data, add:

```typescript
  // Award XP for coaching session
  const gamificationResult = await awardXp(c.env.DB, 20);
```

- [ ] **Step 3: Include gamification in response**

Change the return statement from:
```typescript
  return c.json({ data }, 201);
```
To:
```typescript
  return c.json({
    data: { ...data, gamification: gamificationResult },
  }, 201);
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/coaching.ts
git commit -m "feat: award XP on coaching session completion (20 XP)"
```

---

### Task 8: Frontend API Client

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add gamification types import**

Add to the imports at the top of `apps/web/src/lib/api.ts`:
```typescript
import type {
  // ... existing imports ...
  GamificationStats,
  GamificationAction,
  Achievement,
} from "@goal-tracker/shared";
```

- [ ] **Step 2: Add gamification API methods**

Add to the `api` object, after the `coaching` section:

```typescript
  gamification: {
    getStats: () =>
      request<{ data: GamificationStats }>("/gamification/stats"),
    getAchievements: () =>
      request<{ data: Achievement[] }>("/gamification/achievements"),
  },
```

- [ ] **Step 3: Update response types for actions that return gamification**

The goal update, journal create, and coaching complete endpoints now return gamification data. Update the API methods to reflect this:

In `api.goals.update`, change the return type from `{ data: Goal }` to `{ data: Goal & { gamification?: GamificationAction } }`.

In `api.journal.create`, change the return type from `{ data: JournalEntry }` to `{ data: JournalEntry & { gamification?: GamificationAction } }`.

In `api.coaching.sessions.complete`, change the return type from `{ data: CoachingSessionWithTopics }` to `{ data: CoachingSessionWithTopics & { gamification?: GamificationAction } }`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat: add gamification API client methods"
```

---

### Task 9: Gamification Hook

**Files:**
- Create: `apps/web/src/hooks/useGamification.ts`

- [ ] **Step 1: Create useGamification hook**

```typescript
// apps/web/src/hooks/useGamification.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useGamification() {
  const statsQuery = useQuery({
    queryKey: ["gamification", "stats"],
    queryFn: async () => (await api.gamification.getStats()).data,
  });

  const achievementsQuery = useQuery({
    queryKey: ["gamification", "achievements"],
    queryFn: async () => (await api.gamification.getAchievements()).data,
  });

  return {
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    achievements: achievementsQuery.data ?? [],
    achievementsLoading: achievementsQuery.isLoading,
    refresh: () => {
      statsQuery.refetch();
      achievementsQuery.refetch();
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/useGamification.ts
git commit -m "feat: add useGamification hook"
```

---

### Task 10: Level Badge Component

**Files:**
- Create: `apps/web/src/components/LevelBadge.tsx`

- [ ] **Step 1: Create LevelBadge component**

```typescript
// apps/web/src/components/LevelBadge.tsx
export default function LevelBadge({
  level,
  size = "sm",
}: {
  level: number;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div
      className={`${sizeClasses} rounded-full bg-accent flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {level}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/LevelBadge.tsx
git commit -m "feat: add LevelBadge component"
```

---

### Task 11: Level Progress Bar Component

**Files:**
- Create: `apps/web/src/components/LevelProgressBar.tsx`

- [ ] **Step 1: Create LevelProgressBar component**

```typescript
// apps/web/src/components/LevelProgressBar.tsx
export default function LevelProgressBar({
  currentXp,
  nextLevelXp,
}: {
  currentXp: number;
  nextLevelXp: number;
}) {
  const percentage = Math.min((currentXp / nextLevelXp) * 100, 100);

  return (
    <div className="w-full">
      <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-tertiary">{currentXp} XP</span>
        <span className="text-xs text-text-tertiary">{nextLevelXp} XP</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/LevelProgressBar.tsx
git commit -m "feat: add LevelProgressBar component"
```

---

### Task 12: XP Toast Component

**Files:**
- Create: `apps/web/src/components/XpToast.tsx`

- [ ] **Step 1: Create XpToast component**

```typescript
// apps/web/src/components/XpToast.tsx
import { useEffect, useState } from "react";

export default function XpToast({
  amount,
  onDone,
}: {
  amount: number;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-surface-secondary border border-border-primary rounded-lg px-4 py-2 shadow-lg shadow-black/20">
        <span className="text-sm font-semibold text-accent">+{amount} XP</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add fade-in animation to Tailwind config**

Add to `apps/web/src/index.css` or the appropriate Tailwind config file:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/XpToast.tsx apps/web/src/index.css
git commit -m "feat: add XpToast component with fade-in animation"
```

---

### Task 13: Integrate XP Toasts in Frontend

**Files:**
- Modify: `apps/web/src/hooks/useGoals.ts`
- Modify: `apps/web/src/hooks/useJournalEntries.ts`
- Modify: `apps/web/src/hooks/useCoachingSessions.ts`

- [ ] **Step 1: Add XP state to useGoals hook**

In `apps/web/src/hooks/useGoals.ts`, add state for XP toast:

```typescript
import { useState } from "react";
```

Add at the top of the `useGoals` function:
```typescript
const [xpToast, setXpToast] = useState<number | null>(null);
```

- [ ] **Step 2: Update updateGoal to capture XP**

Change the `updateGoal` function to:
```typescript
  const updateGoal = async (id: string, input: UpdateGoalInput) => {
    const res = await api.goals.update(id, input);
    await invalidate();
    if (res.data.gamification) {
      setXpToast(res.data.gamification.xp_awarded);
    }
    return res.data;
  };
```

- [ ] **Step 3: Return xpToast from useGoals**

Add to the return object:
```typescript
  return {
    goals: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh: () => query.refetch(),
    xpToast,
    clearXpToast: () => setXpToast(null),
  };
```

- [ ] **Step 4: Apply same pattern to useJournalEntries**

In `apps/web/src/hooks/useJournalEntries.ts`:

Add import and state:
```typescript
import { useState } from "react";
```
```typescript
const [xpToast, setXpToast] = useState<number | null>(null);
```

Update `createEntry`:
```typescript
  const createEntry = async (input: CreateJournalEntryInput) => {
    const res = await api.journal.create(input);
    await invalidate();
    if (res.data.gamification) {
      setXpToast(res.data.gamification.xp_awarded);
    }
    return res.data;
  };
```

Add to return:
```typescript
    xpToast,
    clearXpToast: () => setXpToast(null),
```

- [ ] **Step 5: Apply same pattern to useCoachingSessions**

In `apps/web/src/hooks/useCoachingSessions.ts`:

Add import and state:
```typescript
import { useState } from "react";
```
```typescript
const [xpToast, setXpToast] = useState<number | null>(null);
```

Update `completeSession`:
```typescript
  const completeSession = async (input: CompleteSessionInput) => {
    const res = await api.coaching.sessions.complete(input);
    await invalidate();
    if (res.data.gamification) {
      setXpToast(res.data.gamification.xp_awarded);
    }
    return res.data;
  };
```

Add to return:
```typescript
    xpToast,
    clearXpToast: () => setXpToast(null),
```

- [ ] **Step 6: Render XpToast in DashboardPage**

In `apps/web/src/pages/DashboardPage.tsx`:

Add import:
```typescript
import XpToast from "../components/XpToast";
```

Get xpToast from hooks (this requires passing xpToast up or using a shared state - for now, we'll add the toast to individual pages that trigger XP).

- [ ] **Step 7: Add XpToast to GoalsPage**

In `apps/web/src/pages/GoalsPage.tsx`:

Add import:
```typescript
import XpToast from "../components/XpToast";
```

Get xpToast and clearXpToast from useGoals, render XpToast conditionally.

- [ ] **Step 8: Add XpToast to JournalPage**

In `apps/web/src/pages/JournalPage.tsx`:

Add import and render XpToast when xpToast is set.

- [ ] **Step 9: Add XpToast to CoachingPage**

In `apps/web/src/pages/CoachingPage.tsx`:

Add import and render XpToast when xpToast is set.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/hooks/useGoals.ts apps/web/src/hooks/useJournalEntries.ts apps/web/src/hooks/useCoachingSessions.ts apps/web/src/pages/GoalsPage.tsx apps/web/src/pages/JournalPage.tsx apps/web/src/pages/CoachingPage.tsx
git commit -m "feat: integrate XP toasts across goal, journal, and coaching pages"
```

---

### Task 14: Dashboard Gamification Display

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add gamification imports**

Add to imports in `DashboardPage.tsx`:
```typescript
import { useGamification } from "../hooks/useGamification";
import LevelBadge from "../components/LevelBadge";
import LevelProgressBar from "../components/LevelProgressBar";
```

- [ ] **Step 2: Use gamification hook**

Add inside the component:
```typescript
  const { stats, statsLoading } = useGamification();
```

- [ ] **Step 3: Add gamification section to dashboard**

After the existing `<div>` containing the page title, add:

```typescript
      {/* Gamification Stats */}
      {!statsLoading && stats && (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5">
          <div className="flex items-center gap-3 mb-3">
            <LevelBadge level={stats.user_stats.level} size="md" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">
                  Level {stats.user_stats.level}
                </span>
                <span className="text-sm text-text-tertiary">
                  {stats.user_stats.xp} total XP
                </span>
              </div>
            </div>
            <Link
              to="/achievements"
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Achievements
            </Link>
          </div>
          <LevelProgressBar
            currentXp={stats.xp_in_current_level}
            nextLevelXp={stats.xp_to_next_level}
          />
        </div>
      )}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/DashboardPage.tsx
git commit -m "feat: add gamification stats to dashboard (level, XP, progress bar)"
```

---

### Task 15: Sidebar Level Badge

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`

- [ ] **Step 1: Add gamification imports**

Add to imports in `Layout.tsx`:
```typescript
import { useGamification } from "../hooks/useGamification";
import LevelBadge from "./LevelBadge";
```

- [ ] **Step 2: Use gamification hook**

Add inside the component:
```typescript
  const { stats } = useGamification();
```

- [ ] **Step 3: Add level badge to sidebar**

In the sidebar, find the user/logout section at the bottom. Before the logout button, add:

```typescript
          {stats && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <LevelBadge level={stats.user_stats.level} />
              <span className="text-sm text-text-secondary">
                Level {stats.user_stats.level}
              </span>
            </div>
          )}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/Layout.tsx
git commit -m "feat: add level badge to sidebar"
```

---

## Phase 2: Achievements

### Task 16: Achievement Card Component

**Files:**
- Create: `apps/web/src/components/AchievementCard.tsx`

- [ ] **Step 1: Create AchievementCard component**

```typescript
// apps/web/src/components/AchievementCard.tsx
import type { Achievement } from "@goal-tracker/shared";

const iconMap: Record<string, string> = {
  footprint: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  bullseye: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  flag: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
  book: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  clock: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  crown: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  medal: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  const earned = !!achievement.earned_at;
  const iconPath = iconMap[achievement.icon] ?? iconMap.star;

  return (
    <div
      className={`bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5 transition-all ${
        earned ? "" : "opacity-40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            earned ? "bg-accent-muted" : "bg-surface-tertiary"
          }`}
        >
          <svg
            className={`w-5 h-5 ${earned ? "text-accent" : "text-text-tertiary"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d={iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">
            {achievement.title}
          </h4>
          <p className="text-xs text-text-tertiary mt-0.5">
            {achievement.description}
          </p>
          {earned && achievement.earned_at && (
            <p className="text-xs text-accent mt-1">
              Earned {formatDate(achievement.earned_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/AchievementCard.tsx
git commit -m "feat: add AchievementCard component"
```

---

### Task 17: Achievements Page

**Files:**
- Create: `apps/web/src/pages/AchievementsPage.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create AchievementsPage**

```typescript
// apps/web/src/pages/AchievementsPage.tsx
import { useNavigate } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import AchievementCard from "../components/AchievementCard";

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { achievements, achievementsLoading } = useGamification();

  const earned = achievements.filter((a) => !!a.earned_at);
  const locked = achievements.filter((a) => !a.earned_at);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-text-primary">Achievements</h2>
        <p className="text-sm text-text-tertiary mt-1">
          {earned.length} of {achievements.length} unlocked
        </p>
      </div>

      {achievementsLoading && (
        <div className="flex items-center gap-2 text-text-tertiary py-8">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {!achievementsLoading && earned.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Earned
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earned.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {!achievementsLoading && locked.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Locked
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add route to App.tsx**

Add import:
```typescript
import AchievementsPage from "./pages/AchievementsPage";
```

Add route inside the authenticated `<Route element={<RequireAuth><Layout /></RequireAuth>}>` block:
```typescript
<Route path="/achievements" element={<AchievementsPage />} />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/AchievementsPage.tsx apps/web/src/App.tsx
git commit -m "feat: add achievements page with route"
```

---

## Phase 3: Polish

### Task 18: Retroactive XP Backfill

**Files:**
- Create: `apps/api/src/db/migrations/005_backfill_xp.sql`

- [ ] **Step 1: Create backfill migration**

```sql
-- apps/api/src/db/migrations/005_backfill_xp.sql
-- Retroactive XP calculation for existing data
-- This is a one-time migration to award XP for pre-gamification activity

-- Count existing completed goals (50 XP each)
-- Count existing journal entries (20 XP each)
-- Count existing coaching sessions (20 XP each)
-- Note: This migration is run manually after deployment

-- Example backfill query (run manually):
-- INSERT INTO user_stats (id, xp, level) VALUES ('single_user', 
--   (SELECT (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 50) + 
--          (SELECT COUNT(*) * 20 FROM journal_entries) + 
--          (SELECT COUNT(*) * 20 FROM coaching_sessions) FROM goals), 
--   1)
-- ON CONFLICT(id) DO UPDATE SET xp = excluded.xp;
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/db/migrations/005_backfill_xp.sql
git commit -m "feat: add retroactive XP backfill migration"
```

---

### Task 19: Dashboard Summary Stats

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add summary stats section**

After the gamification stats section in DashboardPage, add a summary row:

```typescript
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {goals.filter((g) => g.status === "completed").length}
          </p>
          <p className="text-xs text-text-tertiary mt-1">Goals Completed</p>
        </div>
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">{entries.length}</p>
          <p className="text-xs text-text-tertiary mt-1">Journal Entries</p>
        </div>
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">{sessions.length}</p>
          <p className="text-xs text-text-tertiary mt-1">Coaching Sessions</p>
        </div>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/DashboardPage.tsx
git commit -m "feat: add summary stats to dashboard"
```

---

### Task 20: Run Migration and Test

- [ ] **Step 1: Run local migration**

```bash
cd apps/api && npx wrangler d1 execute goal-tracker-db --local --file=../src/db/migrations/004_gamification.sql
```

- [ ] **Step 2: Start dev server**

```bash
cd /home/duke/code/goal-tracker && bun run dev
```

- [ ] **Step 3: Test XP earning**

1. Create a goal → should NOT earn XP (not_started)
2. Change goal to in_progress → should show "+10 XP" toast
3. Complete the goal → should show "+50 XP" toast
4. Write a journal entry → should show "+20 XP" toast
5. Complete a coaching session → should show "+20 XP" toast

- [ ] **Step 4: Test level progression**

- [ ] **Step 5: Test achievements page**

- [ ] **Step 6: Deploy to production**

```bash
cd apps/api && npx wrangler d1 execute goal-tracker-db --remote --file=../src/db/migrations/004_gamification.sql
cd apps/api && npx wrangler deploy
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete gamification system (XP, levels, achievements)"
```

---

## Summary

**Total Tasks:** 20
**Estimated Time:** 2-3 hours

**Phase 1 (XP System):** Tasks 1-15
- Database tables, shared types, XP logic, API routes, frontend integration

**Phase 2 (Achievements):** Tasks 16-17
- Achievement cards, achievements page

**Phase 3 (Polish):** Tasks 18-20
- Backfill migration, summary stats, testing, deployment

**Key Decisions:**
- XP is never deducted on deletion
- No streaks (user preference)
- Level curve: level × 100 XP
- 9 achievements total
- Server-side XP calculation only
- Minimal visual treatment (accent color, thin progress bar, subtle toasts)
