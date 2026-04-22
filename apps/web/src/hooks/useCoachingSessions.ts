import { useState, useEffect, useCallback } from "react";
import type {
  CoachingSessionWithTopics,
  CompleteSessionInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useCoachingSessions() {
  const [sessions, setSessions] = useState<CoachingSessionWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.coaching.sessions.list();
      setSessions(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeSession = async (input: CompleteSessionInput) => {
    const res = await api.coaching.sessions.complete(input);
    await refresh();
    return res.data;
  };

  const deleteSession = async (id: string) => {
    await api.coaching.sessions.delete(id);
    await refresh();
  };

  return { sessions, loading, error, completeSession, deleteSession, refresh };
}
