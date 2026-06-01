import { Hono } from "hono";
import type { Bindings } from "../index";
import type {
  CoachingTopic,
  CreateCoachingTopicInput,
  UpdateCoachingTopicInput,
  CompleteSessionInput,
  UpdateCoachingSessionInput,
} from "@goal-tracker/shared";
import {
  QueryError,
  listCoachingTopics,
  createCoachingTopic,
  listCoachingSessions,
  getCoachingSession,
  completeSession,
} from "../db/queries";

export const coachingRoutes = new Hono<{ Bindings: Bindings }>();

coachingRoutes.get("/topics", async (c) => {
  const data = await listCoachingTopics(c.env.DB, c.req.query("status") ?? "pending");
  return c.json({ data });
});

coachingRoutes.post("/topics", async (c) => {
  const body = await c.req.json<CreateCoachingTopicInput>();

  try {
    const created = await createCoachingTopic(c.env.DB, body);
    return c.json({ data: created }, 201);
  } catch (e) {
    if (e instanceof QueryError) {
      return c.json({ error: e.message }, e.status);
    }
    throw e;
  }
});

coachingRoutes.put("/topics/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateCoachingTopicInput>();

  const existing = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE id = ?"
  )
    .bind(id)
    .first<CoachingTopic>();

  if (!existing) {
    return c.json({ error: "Topic not found" }, 404);
  }

  const title = body.title?.trim() ?? existing.title;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    "UPDATE coaching_topics SET title = ?, updated_at = ? WHERE id = ?"
  )
    .bind(title, now, id)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE id = ?"
  )
    .bind(id)
    .first<CoachingTopic>();

  return c.json({ data: updated });
});

coachingRoutes.delete("/topics/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM coaching_topics WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Topic not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM coaching_topics WHERE id = ?")
    .bind(id)
    .run();

  return c.body(null, 204);
});

coachingRoutes.get("/sessions", async (c) => {
  const data = await listCoachingSessions(c.env.DB);
  return c.json({ data });
});

coachingRoutes.get("/sessions/:id", async (c) => {
  const data = await getCoachingSession(c.env.DB, c.req.param("id"));

  if (!data) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({ data });
});

coachingRoutes.post("/sessions/complete", async (c) => {
  const body = await c.req.json<CompleteSessionInput>();

  try {
    const data = await completeSession(c.env.DB, body);
    return c.json({ data }, 201);
  } catch (e) {
    if (e instanceof QueryError) {
      return c.json({ error: e.message }, e.status);
    }
    throw e;
  }
});

coachingRoutes.put("/sessions/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateCoachingSessionInput>();

  const existing = await c.env.DB.prepare(
    "SELECT id FROM coaching_sessions WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Session not found" }, 404);
  }

  if (!body.session_date) {
    return c.json({ error: "session_date is required" }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE coaching_sessions SET session_date = ? WHERE id = ?"
  )
    .bind(body.session_date, id)
    .run();

  return c.json({ data: { ...existing, session_date: body.session_date } });
});

coachingRoutes.delete("/sessions/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM coaching_sessions WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Session not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM coaching_sessions WHERE id = ?")
    .bind(id)
    .run();

  return c.body(null, 204);
});
