-- 006_goal_xp_tracking.sql
-- Tracks which goals have already awarded XP to prevent double-awarding

ALTER TABLE goals ADD COLUMN xp_awarded INTEGER NOT NULL DEFAULT 0;
