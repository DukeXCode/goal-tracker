import { Hono } from "hono";
import type { Bindings } from "../index";
import type {
  CoachingTopic,
  CoachingSession,
  CoachingSessionWithTopics,
  CreateCoachingTopicInput,
  UpdateCoachingTopicInput,
  CompleteSessionInput,
  UpdateCoachingSessionInput,
} from "@goal-tracker/shared";
import { awardXp } from "../lib/gamification";

export const coachingRoutes = new Hono<{ Bindings: Bindings }>();

coachingRoutes.get("/topics", async (c) => {
  const status = c.req.query("status") ?? "pending";
  let query = "SELECT * FROM coaching_topics";
  if (status === "pending") {
    query += " WHERE session_id IS NULL";
  } else if (status === "discussed") {
    query += " WHERE session_id IS NOT NULL";
  }
  query += " ORDER BY created_at ASC";

  const result = await c.env.DB.prepare(query).all<CoachingTopic>();
  return c.json({ data: result.results });
});

coachingRoutes.post("/topics", async (c) => {
  const body = await c.req.json<CreateCoachingTopicInput>();

  if (!body.title?.trim()) {
    return c.json({ error: "Title is required" }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO coaching_topics (id, title, session_id, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?)`
  )
    .bind(id, body.title.trim(), now, now)
    .run();

  const created = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE id = ?"
  )
    .bind(id)
    .first<CoachingTopic>();

  return c.json({ data: created }, 201);
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
  const sessions = await c.env.DB.prepare(
    "SELECT * FROM coaching_sessions ORDER BY session_date DESC"
  ).all<CoachingSession>();

  if (!sessions.results.length) {
    return c.json({ data: [] });
  }

  const topics = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE session_id IS NOT NULL ORDER BY created_at ASC"
  ).all<CoachingTopic>();

  const grouped = new Map<string, CoachingTopic[]>();
  for (const t of topics.results) {
    if (!t.session_id) continue;
    const arr = grouped.get(t.session_id) ?? [];
    arr.push(t);
    grouped.set(t.session_id, arr);
  }

  const data: CoachingSessionWithTopics[] = sessions.results.map((s) => ({
    ...s,
    topics: grouped.get(s.id) ?? [],
  }));

  return c.json({ data });
});

coachingRoutes.get("/sessions/:id", async (c) => {
  const id = c.req.param("id");

  const session = await c.env.DB.prepare(
    "SELECT * FROM coaching_sessions WHERE id = ?"
  )
    .bind(id)
    .first<CoachingSession>();

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const topics = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE session_id = ? ORDER BY created_at ASC"
  )
    .bind(id)
    .all<CoachingTopic>();

  const data: CoachingSessionWithTopics = {
    ...session,
    topics: topics.results,
  };

  return c.json({ data });
});

coachingRoutes.post("/sessions/complete", async (c) => {
  const body = await c.req.json<CompleteSessionInput>();

  if (!Array.isArray(body.topic_ids) || body.topic_ids.length === 0) {
    return c.json({ error: "Select at least one topic" }, 400);
  }

  const placeholders = body.topic_ids.map(() => "?").join(",");
  const found = await c.env.DB.prepare(
    `SELECT id FROM coaching_topics WHERE session_id IS NULL AND id IN (${placeholders})`
  )
    .bind(...body.topic_ids)
    .all<{ id: string }>();

  if (found.results.length !== body.topic_ids.length) {
    return c.json(
      { error: "Some topics are missing or already attached to a session" },
      400
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const sessionDate = body.session_date ?? now;

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO coaching_sessions (id, session_date, created_at) VALUES (?, ?, ?)"
    ).bind(id, sessionDate, now),
    c.env.DB.prepare(
      `UPDATE coaching_topics SET session_id = ?, updated_at = ? WHERE id IN (${placeholders})`
    ).bind(id, now, ...body.topic_ids),
  ]);

  const session = await c.env.DB.prepare(
    "SELECT * FROM coaching_sessions WHERE id = ?"
  )
    .bind(id)
    .first<CoachingSession>();

  const topics = await c.env.DB.prepare(
    "SELECT * FROM coaching_topics WHERE session_id = ? ORDER BY created_at ASC"
  )
    .bind(id)
    .all<CoachingTopic>();

  const data: CoachingSessionWithTopics = {
    ...(session as CoachingSession),
    topics: topics.results,
  };

  // Award XP for coaching session
  const gamificationResult = await awardXp(c.env.DB, 20);

  return c.json({
    data: { ...data, gamification: gamificationResult },
  }, 201);
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
