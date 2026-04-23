import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  CoachingTopic,
  CoachingSessionWithTopics,
  CreateCoachingTopicInput,
  UpdateCoachingTopicInput,
  CompleteSessionInput,
} from "@goal-tracker/shared";
import { getStoredToken } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = `${API_URL}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:unauthorized"));
    throw new Error("Unauthorized");
  }
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
  coaching: {
    topics: {
      list: (status: "pending" | "discussed" = "pending") =>
        request<{ data: CoachingTopic[] }>(
          `/coaching/topics?status=${status}`
        ),
      create: (input: CreateCoachingTopicInput) =>
        request<{ data: CoachingTopic }>("/coaching/topics", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id: string, input: UpdateCoachingTopicInput) =>
        request<{ data: CoachingTopic }>(`/coaching/topics/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        }),
      delete: (id: string) =>
        request<void>(`/coaching/topics/${id}`, { method: "DELETE" }),
    },
    sessions: {
      list: () =>
        request<{ data: CoachingSessionWithTopics[] }>("/coaching/sessions"),
      get: (id: string) =>
        request<{ data: CoachingSessionWithTopics }>(
          `/coaching/sessions/${id}`
        ),
      complete: (input: CompleteSessionInput) =>
        request<{ data: CoachingSessionWithTopics }>(
          "/coaching/sessions/complete",
          {
            method: "POST",
            body: JSON.stringify(input),
          }
        ),
      delete: (id: string) =>
        request<void>(`/coaching/sessions/${id}`, { method: "DELETE" }),
    },
  },
};
