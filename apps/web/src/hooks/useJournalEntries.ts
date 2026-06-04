import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useJournalEntries(goalId?: string) {
  const qc = useQueryClient();
  const key = ["journal", goalId ?? "all"];
  const [xpToast, setXpToast] = useState<number | null>(null);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.journal.list(goalId)).data,
    initialData: () => qc.getQueryData<JournalEntry[]>(key),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["journal"] });

  const createEntry = async (input: CreateJournalEntryInput) => {
    const res = await api.journal.create(input);
    await invalidate();
    if (res.data.gamification) {
      setXpToast(res.data.gamification.xp_awarded);
    }
    return res.data;
  };

  const updateEntry = async (id: string, input: UpdateJournalEntryInput) => {
    const res = await api.journal.update(id, input);
    await invalidate();
    return res.data;
  };

  const deleteEntry = async (id: string) => {
    await api.journal.delete(id);
    await invalidate();
  };

  return {
    entries: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh: () => query.refetch(),
    xpToast,
    clearXpToast: () => setXpToast(null),
  };
}
