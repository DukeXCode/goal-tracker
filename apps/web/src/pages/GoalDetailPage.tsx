import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Goal } from "@goal-tracker/shared";
import { api } from "../lib/api";
import { useJournalEntries } from "../hooks/useJournalEntries";
import GoalForm from "../components/GoalForm";
import JournalEntryCard from "../components/JournalEntryCard";
import JournalEntryForm from "../components/JournalEntryForm";

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: goal, isLoading } = useQuery({
    queryKey: ["goal", id],
    queryFn: async () => (await api.goals.get(id!)).data,
    enabled: !!id,
    initialData: () => {
      const cached = qc.getQueryData<Goal[]>(["goals", "all"]);
      return cached?.find((g) => g.id === id);
    },
  });

  const [editing, setEditing] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const { entries, createEntry, deleteEntry } = useJournalEntries(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary py-12">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }
  if (!goal) {
    navigate("/goals");
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <button
        onClick={() => navigate("/goals")}
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Goals
      </button>

      {editing ? (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <GoalForm
            initialData={goal}
            onSubmit={async (data) => {
              await api.goals.update(goal.id, data);
              qc.invalidateQueries({ queryKey: ["goals"] });
              navigate("/goals");
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary">{goal.title}</h2>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
          {goal.description && (
            <p className="text-text-secondary mb-4">{goal.description}</p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Journal Entries
          </h3>
          <button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {showEntryForm ? "Close" : "New Entry"}
          </button>
        </div>

        {showEntryForm && (
          <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6 mb-4">
            <JournalEntryForm
              defaultGoalId={id}
              onSubmit={async (data) => {
                await createEntry(data);
                setShowEntryForm(false);
              }}
              onCancel={() => setShowEntryForm(false)}
            />
          </div>
        )}

        {entries.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
            <p className="text-sm text-text-tertiary">
              No journal entries for this goal yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
