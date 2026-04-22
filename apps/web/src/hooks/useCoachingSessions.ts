import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CoachingSessionWithTopics,
  CompleteSessionInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useCoachingSessions() {
  const qc = useQueryClient();
  const key = ["coaching-sessions"];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.coaching.sessions.list()).data,
    initialData: () => qc.getQueryData<CoachingSessionWithTopics[]>(key),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["coaching-sessions"] });
    qc.invalidateQueries({ queryKey: ["coaching-topics"] });
  };

  const completeSession = async (input: CompleteSessionInput) => {
    const res = await api.coaching.sessions.complete(input);
    await invalidate();
    return res.data;
  };

  const deleteSession = async (id: string) => {
    await api.coaching.sessions.delete(id);
    await invalidate();
  };

  return {
    sessions: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    completeSession,
    deleteSession,
    refresh: () => query.refetch(),
  };
}
