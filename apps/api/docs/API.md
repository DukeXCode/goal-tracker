# Goal Tracker API

> A goal tracking API with journal entries and AI coaching sessions. All responses are wrapped in `{ data: T }` on success or `{ error: string }` on failure.

## Authentication

Most endpoints require a JWT token. Obtain one via `POST /api/auth/login`, then include it in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Response Format

All responses are wrapped in a standard envelope:

- **Success:** `{ "data": <result> }`
- **Error:** `{ "error": "<message>" }`

## Health

### **`GET`** `/api/health`

**Health Check** — Returns the API health status. No authentication required.

- **Auth:** Not required
- **Status Code:** `200`

#### Example Response

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

## Auth

### **`POST`** `/api/auth/login`

**Login** — Authenticate with username and password to receive a JWT token. The token is valid for 7 days.

- **Auth:** Not required
- **Status Code:** `200`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `username` | `string` | Yes | The username | — |
| `password` | `string` | Yes | The password | — |

#### Example Request

```json
{
  "username": "admin",
  "password": "changeme"
}
```

#### Example Response

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### **`GET`** `/api/auth/me`

**Get Current User** — Returns the currently authenticated user's username from the JWT token.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Example Response

```json
{
  "data": {
    "username": "admin"
  }
}
```

---

## Goals

### **`GET`** `/api/goals`

**List Goals** — Returns all goals ordered by creation date (newest first). Optionally filter by status.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Query Parameters

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `status` | `not_started | in_progress | completed` | No | Filter goals by status | — |

#### Example Response

```json
{
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
}
```

---

### **`GET`** `/api/goals/:id`

**Get Goal** — Returns a single goal by its ID.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Example Response

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "in_progress",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-15T14:30:00.000Z"
  }
}
```

---

### **`POST`** `/api/goals`

**Create Goal** — Create a new goal. The `title` field is required and must be non-empty after trimming.

- **Auth:** Required (JWT)
- **Status Code:** `201`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | Yes | Goal title | — |
| `description` | `string` | No | Goal description | "" |
| `status` | `not_started | in_progress | completed` | No | Goal status | "not_started" |
| `target_date` | `string | null` | No | Target completion date (ISO 8601) | null |

#### Example Request

```json
{
  "title": "Learn TypeScript",
  "description": "Complete the TypeScript tutorial",
  "target_date": "2026-06-30"
}
```

#### Example Response

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "not_started",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-01T10:00:00.000Z"
  }
}
```

---

### **`PUT`** `/api/goals/:id`

**Update Goal** — Update an existing goal. Only provided fields are updated; omitted fields keep their current values.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | No | Goal title | — |
| `description` | `string` | No | Goal description | — |
| `status` | `not_started | in_progress | completed` | No | Goal status | — |
| `target_date` | `string | null` | No | Target completion date (ISO 8601) | — |

#### Example Request

```json
{
  "status": "completed"
}
```

#### Example Response

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Learn TypeScript",
    "description": "Complete the TypeScript tutorial",
    "status": "completed",
    "target_date": "2026-06-30",
    "created_at": "2026-05-01T10:00:00.000Z",
    "updated_at": "2026-05-20T09:00:00.000Z"
  }
}
```

---

### **`DELETE`** `/api/goals/:id`

**Delete Goal** — Delete a goal by its ID. Associated journal entries will have their `goal_id` set to null.

- **Auth:** Required (JWT)
- **Status Code:** `204`

#### Example Response

```
(no content)
```

---

## Journal

### **`GET`** `/api/journal`

**List Journal Entries** — Returns all journal entries ordered by creation date (newest first). Optionally filter by linked goal.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Query Parameters

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `goal_id` | `string` | No | Filter entries by linked goal ID | — |

#### Example Response

```json
{
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
}
```

---

### **`GET`** `/api/journal/:id`

**Get Journal Entry** — Returns a single journal entry by its ID.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Example Response

```json
{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "good",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-15T18:00:00.000Z"
  }
}
```

---

### **`POST`** `/api/journal`

**Create Journal Entry** — Create a new journal entry. The `title` field is required. If `goal_id` is provided, it must reference an existing goal.

- **Auth:** Required (JWT)
- **Status Code:** `201`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | Yes | Entry title | — |
| `content` | `string` | No | Entry content/body | "" |
| `mood` | `great | good | okay | bad | terrible | null` | No | How you're feeling | null |
| `goal_id` | `string | null` | No | Link to a goal | null |

#### Example Request

```json
{
  "title": "Made progress today",
  "content": "Finished chapter 3 of the tutorial.",
  "mood": "good",
  "goal_id": "a1b2c3d4-..."
}
```

#### Example Response

```json
{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "good",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-15T18:00:00.000Z"
  }
}
```

---

### **`PUT`** `/api/journal/:id`

**Update Journal Entry** — Update an existing journal entry. If `goal_id` is provided and non-null, the referenced goal must exist.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | No | Entry title | — |
| `content` | `string` | No | Entry content/body | — |
| `mood` | `great | good | okay | bad | terrible | null` | No | How you're feeling | — |
| `goal_id` | `string | null` | No | Link to a goal | — |

#### Example Request

```json
{
  "mood": "great"
}
```

#### Example Response

```json
{
  "data": {
    "id": "f5e6d7c8-...",
    "title": "Made progress today",
    "content": "Finished chapter 3 of the tutorial.",
    "mood": "great",
    "goal_id": "a1b2c3d4-...",
    "created_at": "2026-05-15T18:00:00.000Z",
    "updated_at": "2026-05-16T09:00:00.000Z"
  }
}
```

---

### **`DELETE`** `/api/journal/:id`

**Delete Journal Entry** — Delete a journal entry by its ID.

- **Auth:** Required (JWT)
- **Status Code:** `204`

#### Example Response

```
(no content)
```

---

## Coaching

### **`GET`** `/api/coaching/topics`

**List Coaching Topics** — Returns coaching topics. By default, returns only pending topics (not yet discussed). Use `status` to filter.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Query Parameters

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `status` | `pending | discussed | all` | No | Filter by topic status | "pending" |

#### Example Response

```json
{
  "data": [
    {
      "id": "t1o2p3i4-...",
      "title": "How to stay motivated?",
      "session_id": null,
      "created_at": "2026-05-10T10:00:00.000Z",
      "updated_at": "2026-05-10T10:00:00.000Z"
    }
  ]
}
```

---

### **`POST`** `/api/coaching/topics`

**Create Coaching Topic** — Create a new coaching topic. Topics are always created as "pending" (not linked to any session).

- **Auth:** Required (JWT)
- **Status Code:** `201`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | Yes | Topic title | — |

#### Example Request

```json
{
  "title": "How to stay motivated?"
}
```

#### Example Response

```json
{
  "data": {
    "id": "t1o2p3i4-...",
    "title": "How to stay motivated?",
    "session_id": null,
    "created_at": "2026-05-10T10:00:00.000Z",
    "updated_at": "2026-05-10T10:00:00.000Z"
  }
}
```

---

### **`PUT`** `/api/coaching/topics/:id`

**Update Coaching Topic** — Update a coaching topic's title. The `session_id` is managed by the session completion endpoint.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `title` | `string` | No | Topic title | — |

#### Example Request

```json
{
  "title": "How to stay motivated long-term?"
}
```

#### Example Response

```json
{
  "data": {
    "id": "t1o2p3i4-...",
    "title": "How to stay motivated long-term?",
    "session_id": null,
    "created_at": "2026-05-10T10:00:00.000Z",
    "updated_at": "2026-05-12T11:00:00.000Z"
  }
}
```

---

### **`DELETE`** `/api/coaching/topics/:id`

**Delete Coaching Topic** — Delete a coaching topic by its ID.

- **Auth:** Required (JWT)
- **Status Code:** `204`

#### Example Response

```
(no content)
```

---

### **`GET`** `/api/coaching/sessions`

**List Coaching Sessions** — Returns all coaching sessions ordered by date (newest first), with their associated topics nested inside.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Example Response

```json
{
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
}
```

---

### **`GET`** `/api/coaching/sessions/:id`

**Get Coaching Session** — Returns a single coaching session with its associated topics.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Example Response

```json
{
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
}
```

---

### **`POST`** `/api/coaching/sessions/complete`

**Complete Coaching Session** — Complete a coaching session by grouping pending topics into a new session. All provided `topic_ids` must reference pending topics (not already attached to a session). This operation is atomic — the session is created and topics are linked in a single database transaction.

- **Auth:** Required (JWT)
- **Status Code:** `201`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `topic_ids` | `string[]` | Yes | Array of pending topic IDs to include in this session | — |
| `session_date` | `string` | No | Session date (ISO 8601) | current time |

#### Example Request

```json
{
  "topic_ids": ["t1o2p3i4-...", "t5p6o7p8-..."],
  "session_date": "2026-05-20T10:00:00.000Z"
}
```

#### Example Response

```json
{
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
}
```

---

### **`PUT`** `/api/coaching/sessions/:id`

**Update Coaching Session** — Update a coaching session's date.

- **Auth:** Required (JWT)
- **Status Code:** `200`

#### Request Body

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `session_date` | `string` | Yes | New session date (ISO 8601) | — |

#### Example Request

```json
{
  "session_date": "2026-05-25T14:00:00.000Z"
}
```

#### Example Response

```json
{
  "data": {
    "id": "s1e2s3s4-...",
    "session_date": "2026-05-25T14:00:00.000Z",
    "created_at": "2026-05-20T10:00:00.000Z"
  }
}
```

---

### **`DELETE`** `/api/coaching/sessions/:id`

**Delete Coaching Session** — Delete a coaching session by its ID. Associated topics revert to "pending" status (their `session_id` is set to null).

- **Auth:** Required (JWT)
- **Status Code:** `204`

#### Example Response

```
(no content)
```

---

## Data Schemas

### Goal

A tracking goal with title, description, status, and optional target date.

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `id` | `string` | Yes | UUID identifier | — |
| `title` | `string` | Yes | Goal title | — |
| `description` | `string` | Yes | Goal description | — |
| `status` | `not_started | in_progress | completed` | Yes | Current status | — |
| `target_date` | `string | null` | No | Target completion date | — |
| `created_at` | `string` | Yes | Creation timestamp (ISO 8601) | — |
| `updated_at` | `string` | Yes | Last update timestamp (ISO 8601) | — |

### JournalEntry

A journal entry with optional mood and goal linkage.

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `id` | `string` | Yes | UUID identifier | — |
| `title` | `string` | Yes | Entry title | — |
| `content` | `string` | Yes | Entry content/body | — |
| `mood` | `great | good | okay | bad | terrible | null` | No | Mood rating | — |
| `goal_id` | `string | null` | No | Linked goal ID | — |
| `created_at` | `string` | Yes | Creation timestamp (ISO 8601) | — |
| `updated_at` | `string` | Yes | Last update timestamp (ISO 8601) | — |

### CoachingTopic

A coaching topic. Pending topics have `session_id: null`; discussed topics are linked to a session.

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `id` | `string` | Yes | UUID identifier | — |
| `title` | `string` | Yes | Topic title | — |
| `session_id` | `string | null` | No | Linked session ID (null = pending) | — |
| `created_at` | `string` | Yes | Creation timestamp (ISO 8601) | — |
| `updated_at` | `string` | Yes | Last update timestamp (ISO 8601) | — |

### CoachingSession

A coaching session containing discussed topics.

| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| `id` | `string` | Yes | UUID identifier | — |
| `session_date` | `string` | Yes | Session date (ISO 8601) | — |
| `created_at` | `string` | Yes | Creation timestamp (ISO 8601) | — |
| `topics` | `CoachingTopic[]` | Yes | Topics discussed in this session | — |
