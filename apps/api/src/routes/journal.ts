import { Hono } from "hono";
import type { Bindings } from "../index";
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntry,
} from "@goal-tracker/shared";
import {
  QueryError,
  listJournalEntries,
  getJournalEntry,
  createJournalEntry,
} from "../db/queries";

export const journalRoutes = new Hono<{ Bindings: Bindings }>();

journalRoutes.get("/", async (c) => {
  const data = await listJournalEntries(c.env.DB, c.req.query("goal_id"));
  return c.json({ data });
});

journalRoutes.get("/:id", async (c) => {
  const result = await getJournalEntry(c.env.DB, c.req.param("id"));

  if (!result) {
    return c.json({ error: "Journal entry not found" }, 404);
  }

  return c.json({ data: result });
});

journalRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateJournalEntryInput>();

  try {
    const created = await createJournalEntry(c.env.DB, body);
    return c.json({ data: created }, 201);
  } catch (e) {
    if (e instanceof QueryError) {
      return c.json({ error: e.message }, e.status);
    }
    throw e;
  }
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
