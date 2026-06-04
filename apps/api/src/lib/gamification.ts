// apps/api/src/lib/gamification.ts
import type { GamificationAction, Achievement } from "@goal-tracker/shared";

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

  // Get unearned achievements
  const achievements = await db
    .prepare("SELECT * FROM achievements WHERE earned_at IS NULL")
    .all<{ id: string; achievement_key: string }>();

  for (const achievement of achievements.results) {
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
    user_stats: stats ?? { id: "single_user", xp: 0, level: 1, updated_at: new Date().toISOString() },
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
