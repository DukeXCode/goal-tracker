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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!goal) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/goals")}
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        &larr; Back to Goals
      </button>

      {editing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{goal.title}</h2>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
          {goal.description && (
            <p className="text-gray-600 mb-4">{goal.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Status: {statusLabels[goal.status]}</span>
            {goal.target_date && (
              <span>
                Target: {new Date(goal.target_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Journal Entries
          </h3>
          <button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showEntryForm ? "Close" : "New Entry"}
          </button>
        </div>

        {showEntryForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
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
          <p className="text-sm text-gray-500">
            No journal entries for this goal yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
