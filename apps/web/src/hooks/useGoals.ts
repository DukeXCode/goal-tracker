import { useState, useEffect, useCallback } from "react";
import type { Goal, GoalStatus, CreateGoalInput, UpdateGoalInput } from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useGoals(statusFilter?: GoalStatus) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.goals.list(statusFilter);
      setGoals(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGoal = async (input: CreateGoalInput) => {
    const res = await api.goals.create(input);
    await refresh();
    return res.data;
  };

  const updateGoal = async (id: string, input: UpdateGoalInput) => {
    const res = await api.goals.update(id, input);
    await refresh();
    return res.data;
  };

  const deleteGoal = async (id: string) => {
    await api.goals.delete(id);
    await refresh();
  };

  return { goals, loading, error, createGoal, updateGoal, deleteGoal, refresh };
}
