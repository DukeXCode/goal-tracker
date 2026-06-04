import { Hono } from "hono";
import type { Bindings } from "../index";
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntry,
} from "@goal-tracker/shared";
import { awardXp } from "../lib/gamification";

export const journalRoutes = new Hono<{ Bindings: Bindings }>();

journalRoutes.get("/", async (c) => {
  const goalId = c.req.query("goal_id");
  let query = "SELECT * FROM journal_entries";
  const params: string[] = [];

  if (goalId) {
    query += " WHERE goal_id = ?";
    params.push(goalId);
  }

  query += " ORDER BY created_at DESC";

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<JournalEntry>();
  return c.json({ data: result.results });
});

journalRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    "SELECT * FROM journal_entries WHERE id = ?"
  )
    .bind(id)
    .first<JournalEntry>();

  if (!result) {
    return c.json({ error: "Journal entry not found" }, 404);
  }

  return c.json({ data: result });
});

journalRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateJournalEntryInput>();

  if (!body.title?.trim()) {
    return c.json({ error: "Title is required" }, 400);
  }

  if (body.goal_id) {
    const goal = await c.env.DB.prepare("SELECT id FROM goals WHERE id = ?")
      .bind(body.goal_id)
      .first();
    if (!goal) {
      return c.json({ error: "Referenced goal not found" }, 400);
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO journal_entries (id, title, content, mood, goal_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.title.trim(),
      body.content?.trim() ?? "",
      body.mood ?? null,
      body.goal_id ?? null,
      now,
      now
    )
    .run();

  const created = await c.env.DB.prepare(
    "SELECT * FROM journal_entries WHERE id = ?"
  )
    .bind(id)
    .first<JournalEntry>();

  // Award XP for journal entry
  const gamificationResult = await awardXp(c.env.DB, 20);

  return c.json({
    data: { ...created, gamification: gamificationResult },
  }, 201);
});

journalRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateJournalEntryInput>();

  const existing = await c.env.DB.prepare(
    "SELECT * FROM journal_entries WHERE id = ?"
  )
    .bind(id)
    .first<JournalEntry>();

  if (!existing) {
    return c.json({ error: "Journal entry not found" }, 404);
  }

  if (body.goal_id) {
    const goal = await c.env.DB.prepare("SELECT id FROM goals WHERE id = ?")
      .bind(body.goal_id)
      .first();
    if (!goal) {
      return c.json({ error: "Referenced goal not found" }, 400);
    }
  }

  const title = body.title?.trim() ?? existing.title;
  const content = body.content?.trim() ?? existing.content;
  const mood = body.mood !== undefined ? body.mood : existing.mood;
  const goal_id = body.goal_id !== undefined ? body.goal_id : existing.goal_id;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE journal_entries SET title = ?, content = ?, mood = ?, goal_id = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(title, content, mood, goal_id, now, id)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM journal_entries WHERE id = ?"
  )
    .bind(id)
    .first<JournalEntry>();

  return c.json({ data: updated });
});

journalRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM journal_entries WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Journal entry not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM journal_entries WHERE id = ?")
    .bind(id)
    .run();
  return c.body(null, 204);
});
