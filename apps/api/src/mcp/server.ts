import { McpServer, type ToolCallResult } from "mcp-lite";
import {
  QueryError,
  listGoals,
  getGoal,
  createGoal,
  listJournalEntries,
  getJournalEntry,
  createJournalEntry,
  listCoachingTopics,
  createCoachingTopic,
  listCoachingSessions,
  getCoachingSession,
  completeSession,
} from "../db/queries";

/** Wrap a value as a successful MCP tool result carrying pretty JSON text. */
function ok(data: unknown): ToolCallResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/** An MCP tool error result with a human-readable message. */
function fail(message: string): ToolCallResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Run a query function and map a missing result / QueryError to an MCP tool
 * error instead of letting it bubble up as a protocol-level error.
 */
async function run<T>(
  fn: () => Promise<T>,
  notFoundMessage?: string
): Promise<ToolCallResult> {
  try {
    const result = await fn();
    if (result === null && notFoundMessage) {
      return fail(notFoundMessage);
    }
    return ok(result);
  } catch (e) {
    if (e instanceof QueryError) {
      return fail(e.message);
    }
    throw e;
  }
}

/**
 * Build an MCP server exposing read + create tools backed by the given D1
 * database. Constructed per request so each tool handler closes over the
 * request's `DB` binding (the transport is stateless on Cloudflare Workers).
 */
export function createMcpServer(db: D1Database): McpServer {
  const server = new McpServer({
    name: "goal-tracker",
    version: "0.0.1",
  });

  // ── Goals ──────────────────────────────────────────────────────────────
  server.tool("list_goals", {
    description:
      "List goals, newest first. Optionally filter by status (not_started, in_progress, completed).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["not_started", "in_progress", "completed"],
          description: "Optional status filter.",
        },
      },
    },
    handler: (args: { status?: string }) => run(() => listGoals(db, args.status)),
  });

  server.tool("get_goal", {
    description: "Get a single goal by its id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Goal id." } },
      required: ["id"],
    },
    handler: (args: { id: string }) =>
      run(() => getGoal(db, args.id), "Goal not found"),
  });

  server.tool("create_goal", {
    description: "Create a new goal. Only the title is required.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Goal title (required)." },
        description: { type: "string" },
        status: {
          type: "string",
          enum: ["not_started", "in_progress", "completed"],
        },
        target_date: {
          type: "string",
          description: "Optional target date (ISO string).",
        },
      },
      required: ["title"],
    },
    handler: (args: {
      title: string;
      description?: string;
      status?: "not_started" | "in_progress" | "completed";
      target_date?: string | null;
    }) => run(() => createGoal(db, args)),
  });

  // ── Journal ──────────────────────────────────────────────────────────────
  server.tool("list_journal_entries", {
    description: "List journal entries, newest first. Optionally filter by goal_id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "Optional goal id to filter by." },
      },
    },
    handler: (args: { goal_id?: string }) =>
      run(() => listJournalEntries(db, args.goal_id)),
  });

  server.tool("get_journal_entry", {
    description: "Get a single journal entry by its id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Journal entry id." } },
      required: ["id"],
    },
    handler: (args: { id: string }) =>
      run(() => getJournalEntry(db, args.id), "Journal entry not found"),
  });

  server.tool("create_journal_entry", {
    description:
      "Create a new journal entry. Only the title is required; goal_id, if given, must reference an existing goal.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Entry title (required)." },
        content: { type: "string" },
        mood: {
          type: "string",
          enum: ["great", "good", "okay", "bad", "terrible"],
        },
        goal_id: { type: "string", description: "Optional related goal id." },
      },
      required: ["title"],
    },
    handler: (args: {
      title: string;
      content?: string;
      mood?: "great" | "good" | "okay" | "bad" | "terrible" | null;
      goal_id?: string | null;
    }) => run(() => createJournalEntry(db, args)),
  });

  // ── Coaching ─────────────────────────────────────────────────────────────
  server.tool("list_coaching_topics", {
    description:
      "List coaching topics. status: 'pending' (default, not yet discussed), 'discussed', or 'all'.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "discussed", "all"] },
      },
    },
    handler: (args: { status?: string }) =>
      run(() => listCoachingTopics(db, args.status ?? "pending")),
  });

  server.tool("create_coaching_topic", {
    description: "Create a new (pending) coaching topic to discuss in a future session.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Topic title (required)." },
      },
      required: ["title"],
    },
    handler: (args: { title: string }) => run(() => createCoachingTopic(db, args)),
  });

  server.tool("list_coaching_sessions", {
    description:
      "List coaching sessions (newest first), each with its discussed topics.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
    handler: () => run(() => listCoachingSessions(db)),
  });

  server.tool("get_coaching_session", {
    description: "Get a single coaching session, with its topics, by its id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Session id." } },
      required: ["id"],
    },
    handler: (args: { id: string }) =>
      run(() => getCoachingSession(db, args.id), "Session not found"),
  });

  server.tool("complete_session", {
    description:
      "Complete a coaching session: creates a session record and attaches the given pending topic_ids to it. Optionally set session_date (ISO string), otherwise now.",
    inputSchema: {
      type: "object",
      properties: {
        topic_ids: {
          type: "array",
          items: { type: "string" },
          description: "Ids of pending topics to attach (at least one).",
        },
        session_date: { type: "string", description: "Optional ISO date." },
      },
      required: ["topic_ids"],
    },
    handler: (args: { topic_ids: string[]; session_date?: string }) =>
      run(() => completeSession(db, args)),
  });

  return server;
}
