import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Goal } from "@goal-tracker/shared";
import { api } from "../lib/api";
import { useJournalEntries } from "../hooks/useJournalEntries";
import GoalForm from "../components/GoalForm";
import JournalEntryCard from "../components/JournalEntryCard";
import JournalEntryForm from "../components/JournalEntryForm";

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusStyles: Record<string, string> = {
  not_started: "bg-surface-tertiary text-text-secondary",
  in_progress: "bg-warning-muted text-warning",
  completed: "bg-success-muted text-success",
};

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const { entries, createEntry, deleteEntry } = useJournalEntries(id);

  useEffect(() => {
    if (!id) return;
    api.goals
      .get(id)
      .then((res) => setGoal(res.data))
      .catch(() => navigate("/goals"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
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
  if (!goal) return null;

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
              const res = await api.goals.update(goal.id, data);
              setGoal(res.data);
              setEditing(false);
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
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyles[goal.status]}`}>
              {statusLabels[goal.status]}
            </span>
            {goal.target_date && (
              <span className="text-text-tertiary flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(goal.target_date).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
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
