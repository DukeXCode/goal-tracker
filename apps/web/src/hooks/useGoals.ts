import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Goal, GoalStatus, CreateGoalInput, UpdateGoalInput } from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useGoals(statusFilter?: GoalStatus) {
  const qc = useQueryClient();
  const key = ["goals", statusFilter ?? "all"];
  const [xpToast, setXpToast] = useState<number | null>(null);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.goals.list(statusFilter)).data,
    initialData: () => qc.getQueryData<Goal[]>(key),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["goals"] });
  const invalidateGamification = () => qc.invalidateQueries({ queryKey: ["gamification"] });

  const createGoal = async (input: CreateGoalInput) => {
    const res = await api.goals.create(input);
    await invalidate();
    return res.data;
  };

  const updateGoal = async (id: string, input: UpdateGoalInput) => {
    const res = await api.goals.update(id, input);
    await invalidate();
    if (res.data.gamification) {
      setXpToast(res.data.gamification.xp_awarded);
      await invalidateGamification();
    }
    return res.data;
  };

  const deleteGoal = async (id: string) => {
    await api.goals.delete(id);
    await invalidate();
  };

  return {
    goals: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh: () => query.refetch(),
    xpToast,
    clearXpToast: () => setXpToast(null),
  };
}
