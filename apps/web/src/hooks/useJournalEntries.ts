import { useState, useEffect, useCallback } from "react";
import type {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

export function useJournalEntries(goalId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.journal.list(goalId);
      setEntries(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEntry = async (input: CreateJournalEntryInput) => {
    const res = await api.journal.create(input);
    await refresh();
    return res.data;
  };

  const updateEntry = async (id: string, input: UpdateJournalEntryInput) => {
    const res = await api.journal.update(id, input);
    await refresh();
    return res.data;
  };

  const deleteEntry = async (id: string) => {
    await api.journal.delete(id);
    await refresh();
  };

  return { entries, loading, error, createEntry, updateEntry, deleteEntry, refresh };
}
