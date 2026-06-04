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
