import { useState, useEffect, useCallback } from "react";
import type {
  CoachingTopic,
  CreateCoachingTopicInput,
  UpdateCoachingTopicInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useCoachingTopics(status: "pending" | "discussed" = "pending") {
  const [topics, setTopics] = useState<CoachingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.coaching.topics.list(status);
      setTopics(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTopic = async (input: CreateCoachingTopicInput) => {
    const res = await api.coaching.topics.create(input);
    await refresh();
    return res.data;
  };

  const updateTopic = async (id: string, input: UpdateCoachingTopicInput) => {
    const res = await api.coaching.topics.update(id, input);
    await refresh();
    return res.data;
  };

  const deleteTopic = async (id: string) => {
    await api.coaching.topics.delete(id);
    await refresh();
  };

  return { topics, loading, error, createTopic, updateTopic, deleteTopic, refresh };
}
