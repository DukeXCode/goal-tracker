import type {
  Goal,
  CreateGoalInput,
  JournalEntry,
  CreateJournalEntryInput,
  CoachingTopic,
  CoachingSession,
  CoachingSessionWithTopics,
  CreateCoachingTopicInput,
  CompleteSessionInput,
} from "@goal-tracker/shared";

/**
 * Error carrying an HTTP-style status so REST routes and MCP tools can map it
 * consistently. Read + create query functions throw this on validation /
 * not-found conditions.
 */
export class QueryError extends Error {
  constructor(public status: 400 | 404, message: string) {
    super(message);
    this.name = "QueryError";
  }
}

// ── Goals ──────────────────────────────────────────────────────────────────

export async function listGoals(db: D1Database, status?: string): Promise<Goal[]> {
  let query = "SELECT * FROM goals";
  const params: string[] = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";

  const result = await db.prepare(query).bind(...params).all<Goal>();
  return result.results;
}

export async function getGoal(db: D1Database, id: string): Promise<Goal | null> {
  return db.prepare("SELECT * FROM goals WHERE id = ?").bind(id).first<Goal>();
}

export async function createGoal(db: D1Database, body: CreateGoalInput): Promise<Goal> {
  if (!body.title?.trim()) {
    throw new QueryError(400, "Title is required");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO goals (id, title, description, status, target_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.title.trim(),
      body.description?.trim() ?? "",
      body.status ?? "not_started",
      body.target_date ?? null,
      now,
      now
    )
    .run();

  return (await getGoal(db, id)) as Goal;
}

// ── Journal ────────────────────────────────────────────────────────────────

export async function listJournalEntries(
  db: D1Database,
  goalId?: string
): Promise<JournalEntry[]> {
  let query = "SELECT * FROM journal_entries";
  const params: string[] = [];
  if (goalId) {
    query += " WHERE goal_id = ?";
    params.push(goalId);
  }
  query += " ORDER BY created_at DESC";

  const result = await db.prepare(query).bind(...params).all<JournalEntry>();
  return result.results;
}

export async function getJournalEntry(
  db: D1Database,
  id: string
): Promise<JournalEntry | null> {
  return db
    .prepare("SELECT * FROM journal_entries WHERE id = ?")
    .bind(id)
    .first<JournalEntry>();
}

export async function createJournalEntry(
  db: D1Database,
  body: CreateJournalEntryInput
): Promise<JournalEntry> {
  if (!body.title?.trim()) {
    throw new QueryError(400, "Title is required");
  }

  if (body.goal_id) {
    const goal = await db
      .prepare("SELECT id FROM goals WHERE id = ?")
      .bind(body.goal_id)
      .first();
    if (!goal) {
      throw new QueryError(400, "Referenced goal not found");
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
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

  return (await getJournalEntry(db, id)) as JournalEntry;
}

// ── Coaching ─────────────────────────────────────────────────────────────────

export async function listCoachingTopics(
  db: D1Database,
  status = "pending"
): Promise<CoachingTopic[]> {
  let query = "SELECT * FROM coaching_topics";
  if (status === "pending") {
    query += " WHERE session_id IS NULL";
  } else if (status === "discussed") {
    query += " WHERE session_id IS NOT NULL";
  }
  query += " ORDER BY created_at ASC";

  const result = await db.prepare(query).all<CoachingTopic>();
  return result.results;
}

export async function createCoachingTopic(
  db: D1Database,
  body: CreateCoachingTopicInput
): Promise<CoachingTopic> {
  if (!body.title?.trim()) {
    throw new QueryError(400, "Title is required");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO coaching_topics (id, title, session_id, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?)`
    )
    .bind(id, body.title.trim(), now, now)
    .run();

  return (await db
    .prepare("SELECT * FROM coaching_topics WHERE id = ?")
    .bind(id)
    .first<CoachingTopic>()) as CoachingTopic;
}

export async function listCoachingSessions(
  db: D1Database
): Promise<CoachingSessionWithTopics[]> {
  const sessions = await db
    .prepare("SELECT * FROM coaching_sessions ORDER BY session_date DESC")
    .all<CoachingSession>();

  if (!sessions.results.length) {
    return [];
  }

  const topics = await db
    .prepare(
      "SELECT * FROM coaching_topics WHERE session_id IS NOT NULL ORDER BY created_at ASC"
    )
    .all<CoachingTopic>();

  const grouped = new Map<string, CoachingTopic[]>();
  for (const t of topics.results) {
    if (!t.session_id) continue;
    const arr = grouped.get(t.session_id) ?? [];
    arr.push(t);
    grouped.set(t.session_id, arr);
  }

  return sessions.results.map((s) => ({
    ...s,
    topics: grouped.get(s.id) ?? [],
  }));
}

export async function getCoachingSession(
  db: D1Database,
  id: string
): Promise<CoachingSessionWithTopics | null> {
  const session = await db
    .prepare("SELECT * FROM coaching_sessions WHERE id = ?")
    .bind(id)
    .first<CoachingSession>();

  if (!session) {
    return null;
  }

  const topics = await db
    .prepare(
      "SELECT * FROM coaching_topics WHERE session_id = ? ORDER BY created_at ASC"
    )
    .bind(id)
    .all<CoachingTopic>();

  return { ...session, topics: topics.results };
}

export async function completeSession(
  db: D1Database,
  body: CompleteSessionInput
): Promise<CoachingSessionWithTopics> {
  if (!Array.isArray(body.topic_ids) || body.topic_ids.length === 0) {
    throw new QueryError(400, "Select at least one topic");
  }

  const placeholders = body.topic_ids.map(() => "?").join(",");
  const found = await db
    .prepare(
      `SELECT id FROM coaching_topics WHERE session_id IS NULL AND id IN (${placeholders})`
    )
    .bind(...body.topic_ids)
    .all<{ id: string }>();

  if (found.results.length !== body.topic_ids.length) {
    throw new QueryError(
      400,
      "Some topics are missing or already attached to a session"
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const sessionDate = body.session_date ?? now;

  await db.batch([
    db
      .prepare(
        "INSERT INTO coaching_sessions (id, session_date, created_at) VALUES (?, ?, ?)"
      )
      .bind(id, sessionDate, now),
    db
      .prepare(
        `UPDATE coaching_topics SET session_id = ?, updated_at = ? WHERE id IN (${placeholders})`
      )
      .bind(id, now, ...body.topic_ids),
  ]);

  return (await getCoachingSession(db, id)) as CoachingSessionWithTopics;
}
