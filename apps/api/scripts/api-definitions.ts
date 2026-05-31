export interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export interface EndpointExample {
  request?: string;
  response: string;
}

export interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  auth: boolean;
  group: string;
  queryParams?: Field[];
  requestBody?: Field[];
  responseFields?: Field[];
  responseType: string;
  statusCode: number;
  example: EndpointExample;
}

export const apiTitle = "Goal Tracker API";
export const apiVersion = "0.0.1";
export const apiDescription = "A goal tracking API with journal entries and AI coaching sessions. All responses are wrapped in `{ data: T }` on success or `{ error: string }` on failure.";
export const baseUrl = "/api";

export const endpoints: Endpoint[] = [
  // ── Health ──────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/health",
    title: "Health Check",
    description: "Returns the API health status. No authentication required.",
    auth: false,
    group: "Health",
    responseType: "object",
    statusCode: 200,
    example: {
      response: `{
  "data": {
    "status": "ok"
  }
}`,
    },
  },

  // ── Auth ────────────────────────────────────────────────
  {
    method: "POST",
    path: "/api/auth/login",
    title: "Login",
    description: "Authenticate with username and password to receive a JWT token. The token is valid for 7 days.",
    auth: false,
    group: "Auth",
    requestBody: [
      { name: "username", type: "string", required: true, description: "The username" },
      { name: "password", type: "string", required: true, description: "The password" },
    ],
    responseType: "object",
    statusCode: 200,
    example: {
      request: `{
  "username": "admin",
  "password": "changeme"
}`,
      response: `{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}`,
    },
  },
  {
    method: "GET",
    path: "/api/auth/me",
    title: "Get Current User",
    description: "Returns the currently authenticated user's username from the JWT token.",
    auth: true,
    group: "Auth",
    responseType: "object",
    statusCode: 200,
    example: {
      response: `{
  "data": {
    "username": "admin"
  }
}`,
    },
  },

  // ── Goals ───────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/goals",
    title: "List Goals",
    description: "Returns all goals ordered by creation date (newest first). Optionally filter by status.",
    auth: true,
    group: "Goals",
    queryParams: [
      { name: "status", type: "not_started | in_progress | completed", required: false, description: "Filter goals by status" },
    ],
    responseType: "array",
    statusCode: 200,
    example: {
      response: `{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Learn TypeScript",
      "description": "Complete the TypeScript tutorial",
      "status": "in_progress",
      "target_date": "2026-06-30",
      "created_at": "2026-05-01T10:00:00.000Z",
      "updated_at": "2026-05-15T14:30:00.000Z"
    }
  ]
}`,
    },
  },
  {
    method: "GET",
    path: "/api/goals/:id",
    title: "Get Goal",
    description: "Returns a single goal by its ID.",
    auth: true,
    group: "Goals",
    responseType: "object",
    statusCode: 200,
    example: {
      response: `{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "in_progress",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-15T14:30:00.000Z"
  }
}`,
    },
  },
  {
    method: "POST",
    path: "/api/goals",
    title: "Create Goal",
    description: "Create a new goal. The `title` field is required and must be non-empty after trimming.",
    auth: true,
    group: "Goals",
    requestBody: [
      { name: "title", type: "string", required: true, description: "Goal title" },
      { name: "description", type: "string", required: false, description: "Goal description", default: "\"\"" },
      { name: "status", type: "not_started | in_progress | completed", required: false, description: "Goal status", default: "\"not_started\"" },
      { name: "target_date", type: "string | null", required: false, description: "Target completion date (ISO 8601)", default: "null" },
    ],
    responseType: "object",
    statusCode: 201,
    example: {
      request: `{
  "title": "Learn TypeScript",
  "description": "Complete the TypeScript tutorial",
  "target_date": "2026-06-30"
}`,
      response: `{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "not_started",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-01T10:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "PUT",
    path: "/api/goals/:id",
    title: "Update Goal",
    description: "Update an existing goal. Only provided fields are updated; omitted fields keep their current values.",
    auth: true,
    group: "Goals",
    requestBody: [
      { name: "title", type: "string", required: false, description: "Goal title" },
      { name: "description", type: "string", required: false, description: "Goal description" },
      { name: "status", type: "not_started | in_progress | completed", required: false, description: "Goal status" },
      { name: "target_date", type: "string | null", required: false, description: "Target completion date (ISO 8601)" },
    ],
    responseType: "object",
    statusCode: 200,
    example: {
      request: `{
  "status": "completed"
}`,
      response: `{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "completed",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-20T09:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "DELETE",
    path: "/api/goals/:id",
    title: "Delete Goal",
    description: "Delete a goal by its ID. Associated journal entries will have their `goal_id` set to null.",
    auth: true,
    group: "Goals",
    responseType: "void",
    statusCode: 204,
    example: {
      response: "(no content)",
    },
  },

  // ── Journal ─────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/journal",
    title: "List Journal Entries",
    description: "Returns all journal entries ordered by creation date (newest first). Optionally filter by linked goal.",
    auth: true,
    group: "Journal",
    queryParams: [
      { name: "goal_id", type: "string", required: false, description: "Filter entries by linked goal ID" },
    ],
    responseType: "array",
    statusCode: 200,
    example: {
      response: `{
  "data": [
    {
      "id": "f5e6d7c8-...",
      "title": "Made progress today",
      "content": "Finished chapter 3 of the tutorial.",
      "mood": "good",
      "goal_id": "a1b2c3d4-...",
      "created_at": "2026-05-15T18:00:00.000Z",
      "updated_at": "2026-05-15T18:00:00.000Z"
    }
  ]
}`,
    },
  },
  {
    method: "GET",
    path: "/api/journal/:id",
    title: "Get Journal Entry",
    description: "Returns a single journal entry by its ID.",
    auth: true,
    group: "Journal",
    responseType: "object",
    statusCode: 200,
    example: {
      response: `{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "good",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-15T18:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "POST",
    path: "/api/journal",
    title: "Create Journal Entry",
    description: "Create a new journal entry. The `title` field is required. If `goal_id` is provided, it must reference an existing goal.",
    auth: true,
    group: "Journal",
    requestBody: [
      { name: "title", type: "string", required: true, description: "Entry title" },
      { name: "content", type: "string", required: false, description: "Entry content/body", default: "\"\"" },
      { name: "mood", type: "great | good | okay | bad | terrible | null", required: false, description: "How you're feeling", default: "null" },
      { name: "goal_id", type: "string | null", required: false, description: "Link to a goal", default: "null" },
    ],
    responseType: "object",
    statusCode: 201,
    example: {
      request: `{
  "title": "Made progress today",
  "content": "Finished chapter 3 of the tutorial.",
  "mood": "good",
  "goal_id": "a1b2c3d4-..."
}`,
      response: `{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "good",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-15T18:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "PUT",
    path: "/api/journal/:id",
    title: "Update Journal Entry",
    description: "Update an existing journal entry. If `goal_id` is provided and non-null, the referenced goal must exist.",
    auth: true,
    group: "Journal",
    requestBody: [
      { name: "title", type: "string", required: false, description: "Entry title" },
      { name: "content", type: "string", required: false, description: "Entry content/body" },
      { name: "mood", type: "great | good | okay | bad | terrible | null", required: false, description: "How you're feeling" },
      { name: "goal_id", type: "string | null", required: false, description: "Link to a goal" },
    ],
    responseType: "object",
    statusCode: 200,
    example: {
      request: `{
  "mood": "great"
}`,
      response: `{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "great",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-16T09:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "DELETE",
    path: "/api/journal/:id",
    title: "Delete Journal Entry",
    description: "Delete a journal entry by its ID.",
    auth: true,
    group: "Journal",
    responseType: "void",
    statusCode: 204,
    example: {
      response: "(no content)",
    },
  },

  // ── Coaching Topics ─────────────────────────────────────
  {
    method: "GET",
    path: "/api/coaching/topics",
    title: "List Coaching Topics",
    description: "Returns coaching topics. By default, returns only pending topics (not yet discussed). Use `status` to filter.",
    auth: true,
    group: "Coaching",
    queryParams: [
      { name: "status", type: "pending | discussed | all", required: false, description: "Filter by topic status", default: "\"pending\"" },
    ],
    responseType: "array",
    statusCode: 200,
    example: {
      response: `{
  "data": [
    {
      "id": "t1o2p3i4-...",
      "title": "How to stay motivated?",
      "session_id": null,
      "created_at": "2026-05-10T10:00:00.000Z",
      "updated_at": "2026-05-10T10:00:00.000Z"
    }
  ]
}`,
    },
  },
  {
    method: "POST",
    path: "/api/coaching/topics",
    title: "Create Coaching Topic",
    description: "Create a new coaching topic. Topics are always created as \"pending\" (not linked to any session).",
    auth: true,
    group: "Coaching",
    requestBody: [
      { name: "title", type: "string", required: true, description: "Topic title" },
    ],
    responseType: "object",
    statusCode: 201,
    example: {
      request: `{
  "title": "How to stay motivated?"
}`,
      response: `{
  "data": {
    "id": "t1o2p3i4-...",
    "title": "How to stay motivated?",
    "session_id": null,
    "created_at": "2026-05-10T10:00:00.000Z",
    "updated_at": "2026-05-10T10:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "PUT",
    path: "/api/coaching/topics/:id",
    title: "Update Coaching Topic",
    description: "Update a coaching topic's title. The `session_id` is managed by the session completion endpoint.",
    auth: true,
    group: "Coaching",
    requestBody: [
      { name: "title", type: "string", required: false, description: "Topic title" },
    ],
    responseType: "object",
    statusCode: 200,
    example: {
      request: `{
  "title": "How to stay motivated long-term?"
}`,
      response: `{
  "data": {
    "id": "t1o2p3i4-...",
    "title": "How to stay motivated long-term?",
    "session_id": null,
    "created_at": "2026-05-10T10:00:00.000Z",
    "updated_at": "2026-05-12T11:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "DELETE",
    path: "/api/coaching/topics/:id",
    title: "Delete Coaching Topic",
    description: "Delete a coaching topic by its ID.",
    auth: true,
    group: "Coaching",
    responseType: "void",
    statusCode: 204,
    example: {
      response: "(no content)",
    },
  },

  // ── Coaching Sessions ───────────────────────────────────
  {
    method: "GET",
    path: "/api/coaching/sessions",
    title: "List Coaching Sessions",
    description: "Returns all coaching sessions ordered by date (newest first), with their associated topics nested inside.",
    auth: true,
    group: "Coaching",
    responseType: "array",
    statusCode: 200,
    example: {
      response: `{
  "data": [
    {
      "id": "s1e2s3s4-...",
      "session_date": "2026-05-20T10:00:00.000Z",
      "created_at": "2026-05-20T10:00:00.000Z",
      "topics": [
        {
          "id": "t1o2p3i4-...",
          "title": "How to stay motivated?",
          "session_id": "s1e2s3s4-...",
          "created_at": "2026-05-10T10:00:00.000Z",
          "updated_at": "2026-05-20T10:00:00.000Z"
        }
      ]
    }
  ]
}`,
    },
  },
  {
    method: "GET",
    path: "/api/coaching/sessions/:id",
    title: "Get Coaching Session",
    description: "Returns a single coaching session with its associated topics.",
    auth: true,
    group: "Coaching",
    responseType: "object",
    statusCode: 200,
    example: {
      response: `{
  "data": {
    "id": "s1e2s3s4-...",
    "session_date": "2026-05-20T10:00:00.000Z",
    "created_at": "2026-05-20T10:00:00.000Z",
    "topics": [
      {
        "id": "t1o2p3i4-...",
        "title": "How to stay motivated?",
        "session_id": "s1e2s3s4-...",
        "created_at": "2026-05-10T10:00:00.000Z",
        "updated_at": "2026-05-20T10:00:00.000Z"
      }
    ]
  }
}`,
    },
  },
  {
    method: "POST",
    path: "/api/coaching/sessions/complete",
    title: "Complete Coaching Session",
    description:
      "Complete a coaching session by grouping pending topics into a new session. All provided `topic_ids` must reference pending topics (not already attached to a session). This operation is atomic — the session is created and topics are linked in a single database transaction.",
    auth: true,
    group: "Coaching",
    requestBody: [
      { name: "topic_ids", type: "string[]", required: true, description: "Array of pending topic IDs to include in this session" },
      { name: "session_date", type: "string", required: false, description: "Session date (ISO 8601)", default: "current time" },
    ],
    responseType: "object",
    statusCode: 201,
    example: {
      request: `{
  "topic_ids": ["t1o2p3i4-...", "t5p6o7p8-..."],
  "session_date": "2026-05-20T10:00:00.000Z"
}`,
      response: `{
  "data": {
    "id": "s1e2s3s4-...",
    "session_date": "2026-05-20T10:00:00.000Z",
    "created_at": "2026-05-20T10:00:00.000Z",
    "topics": [
      {
        "id": "t1o2p3i4-...",
        "title": "How to stay motivated?",
        "session_id": "s1e2s3s4-...",
        "created_at": "2026-05-10T10:00:00.000Z",
        "updated_at": "2026-05-20T10:00:00.000Z"
      },
      {
        "id": "t5p6o7p8-...",
        "title": "Dealing with setbacks",
        "session_id": "s1e2s3s4-...",
        "created_at": "2026-05-11T10:00:00.000Z",
        "updated_at": "2026-05-20T10:00:00.000Z"
      }
    ]
  }
}`,
    },
  },
  {
    method: "PUT",
    path: "/api/coaching/sessions/:id",
    title: "Update Coaching Session",
    description: "Update a coaching session's date.",
    auth: true,
    group: "Coaching",
    requestBody: [
      { name: "session_date", type: "string", required: true, description: "New session date (ISO 8601)" },
    ],
    responseType: "object",
    statusCode: 200,
    example: {
      request: `{
  "session_date": "2026-05-25T14:00:00.000Z"
}`,
      response: `{
  "data": {
    "id": "s1e2s3s4-...",
    "session_date": "2026-05-25T14:00:00.000Z",
    "created_at": "2026-05-20T10:00:00.000Z"
  }
}`,
    },
  },
  {
    method: "DELETE",
    path: "/api/coaching/sessions/:id",
    title: "Delete Coaching Session",
    description:
      "Delete a coaching session by its ID. Associated topics revert to \"pending\" status (their `session_id` is set to null).",
    auth: true,
    group: "Coaching",
    responseType: "void",
    statusCode: 204,
    example: {
      response: "(no content)",
    },
  },
];

export const groups = ["Health", "Auth", "Goals", "Journal", "Coaching"];

export const schemas: Record<string, { description: string; fields: Field[] }> = {
  Goal: {
    description: "A tracking goal with title, description, status, and optional target date.",
    fields: [
      { name: "id", type: "string", required: true, description: "UUID identifier" },
      { name: "title", type: "string", required: true, description: "Goal title" },
      { name: "description", type: "string", required: true, description: "Goal description" },
      { name: "status", type: "not_started | in_progress | completed", required: true, description: "Current status" },
      { name: "target_date", type: "string | null", required: false, description: "Target completion date" },
      { name: "created_at", type: "string", required: true, description: "Creation timestamp (ISO 8601)" },
      { name: "updated_at", type: "string", required: true, description: "Last update timestamp (ISO 8601)" },
    ],
  },
  JournalEntry: {
    description: "A journal entry with optional mood and goal linkage.",
    fields: [
      { name: "id", type: "string", required: true, description: "UUID identifier" },
      { name: "title", type: "string", required: true, description: "Entry title" },
      { name: "content", type: "string", required: true, description: "Entry content/body" },
      { name: "mood", type: "great | good | okay | bad | terrible | null", required: false, description: "Mood rating" },
      { name: "goal_id", type: "string | null", required: false, description: "Linked goal ID" },
      { name: "created_at", type: "string", required: true, description: "Creation timestamp (ISO 8601)" },
      { name: "updated_at", type: "string", required: true, description: "Last update timestamp (ISO 8601)" },
    ],
  },
  CoachingTopic: {
    description: "A coaching topic. Pending topics have `session_id: null`; discussed topics are linked to a session.",
    fields: [
      { name: "id", type: "string", required: true, description: "UUID identifier" },
      { name: "title", type: "string", required: true, description: "Topic title" },
      { name: "session_id", type: "string | null", required: false, description: "Linked session ID (null = pending)" },
      { name: "created_at", type: "string", required: true, description: "Creation timestamp (ISO 8601)" },
      { name: "updated_at", type: "string", required: true, description: "Last update timestamp (ISO 8601)" },
    ],
  },
  CoachingSession: {
    description: "A coaching session containing discussed topics.",
    fields: [
      { name: "id", type: "string", required: true, description: "UUID identifier" },
      { name: "session_date", type: "string", required: true, description: "Session date (ISO 8601)" },
      { name: "created_at", type: "string", required: true, description: "Creation timestamp (ISO 8601)" },
      { name: "topics", type: "CoachingTopic[]", required: true, description: "Topics discussed in this session" },
    ],
  },
};
