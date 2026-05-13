import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { JournalEntry, Goal } from "@goal-tracker/shared";
import { api } from "../lib/api";
import JournalEntryForm from "../components/JournalEntryForm";
import Markdown from "../components/Markdown";

const moodEmoji: Record<string, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😟",
  terrible: "😢",
};

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [linkedGoal, setLinkedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.journal
      .get(id)
      .then(async (res) => {
        setEntry(res.data);
        if (res.data.goal_id) {
          const goalRes = await api.goals.get(res.data.goal_id);
          setLinkedGoal(goalRes.data);
        }
      })
      .catch(() => navigate("/journal"))
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
  if (!entry) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      <button
        onClick={() => navigate("/journal")}
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Journal
      </button>

      {editing ? (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <JournalEntryForm
            initialData={entry}
            onSubmit={async (data) => {
              const res = await api.journal.update(entry.id, data);
              setEntry(res.data);
              if (res.data.goal_id) {
                const goalRes = await api.goals.get(res.data.goal_id);
                setLinkedGoal(goalRes.data);
              } else {
                setLinkedGoal(null);
              }
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                {entry.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-text-tertiary">
                <span>
                  {new Date(entry.created_at).toLocaleDateString("de-DE")}
                </span>
                {entry.mood && (
                  <span className="flex items-center gap-1">
                    {moodEmoji[entry.mood]} Feeling {entry.mood}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>

          {linkedGoal && (
            <div className="mb-4 px-3 py-2 bg-accent-subtle rounded-lg text-sm border border-accent/20">
              Linked to:{" "}
              <Link
                to={`/goals/${linkedGoal.id}`}
                className="text-accent font-medium hover:underline"
              >
                {linkedGoal.title}
              </Link>
            </div>
          )}

          <div className="text-text-secondary">
            {entry.content ? (
              <Markdown content={entry.content} />
            ) : (
              <span className="text-text-tertiary italic">No content</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
