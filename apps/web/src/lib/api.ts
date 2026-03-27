import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@goal-tracker/shared";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  goals: {
    list: (status?: string) =>
      request<{ data: Goal[] }>(`/goals${status ? `?status=${status}` : ""}`),
    get: (id: string) => request<{ data: Goal }>(`/goals/${id}`),
    create: (input: CreateGoalInput) =>
      request<{ data: Goal }>("/goals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateGoalInput) =>
      request<{ data: Goal }>(`/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<void>(`/goals/${id}`, { method: "DELETE" }),
  },
  journal: {
    list: (goalId?: string) =>
      request<{ data: JournalEntry[] }>(
        `/journal${goalId ? `?goal_id=${goalId}` : ""}`
      ),
    get: (id: string) => request<{ data: JournalEntry }>(`/journal/${id}`),
    create: (input: CreateJournalEntryInput) =>
      request<{ data: JournalEntry }>("/journal", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateJournalEntryInput) =>
      request<{ data: JournalEntry }>(`/journal/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<void>(`/journal/${id}`, { method: "DELETE" }),
  },
};
