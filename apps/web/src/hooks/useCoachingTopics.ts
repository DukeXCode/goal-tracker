import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CoachingTopic,
  CreateCoachingTopicInput,
  UpdateCoachingTopicInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useCoachingTopics(status: "pending" | "discussed" = "pending") {
  const qc = useQueryClient();
  const key = ["coaching-topics", status];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.coaching.topics.list(status)).data,
    initialData: () => qc.getQueryData<CoachingTopic[]>(key),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["coaching-topics"] });
    qc.invalidateQueries({ queryKey: ["coaching-sessions"] });
  };

  const createTopic = async (input: CreateCoachingTopicInput) => {
    const res = await api.coaching.topics.create(input);
    await invalidate();
    return res.data;
  };

  const updateTopic = async (id: string, input: UpdateCoachingTopicInput) => {
    const res = await api.coaching.topics.update(id, input);
    await invalidate();
    return res.data;
  };

  const deleteTopic = async (id: string) => {
    await api.coaching.topics.delete(id);
    await invalidate();
  };

  return {
    topics: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createTopic,
    updateTopic,
    deleteTopic,
    refresh: () => query.refetch(),
  };
}
