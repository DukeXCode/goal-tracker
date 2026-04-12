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

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!entry) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      <button
        onClick={() => navigate("/journal")}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        &larr; Back to Journal
      </button>

      {editing ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {entry.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {new Date(entry.created_at).toLocaleDateString("de-DE")}
                </span>
                {entry.mood && (
                  <span>
                    {moodEmoji[entry.mood]} Feeling {entry.mood}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>

          {linkedGoal && (
            <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-sm">
              Linked to:{" "}
              <Link
                to={`/goals/${linkedGoal.id}`}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {linkedGoal.title}
              </Link>
            </div>
          )}

          <div className="text-gray-700 dark:text-gray-300">
            {entry.content ? (
              <Markdown content={entry.content} />
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic">No content</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
