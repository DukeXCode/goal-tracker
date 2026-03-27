import { useState, useEffect } from "react";
import type {
  JournalEntry,
  Mood,
  CreateJournalEntryInput,
  Goal,
} from "@goal-tracker/shared";
import { api } from "../lib/api";

const moods: { value: Mood; emoji: string }[] = [
  { value: "great", emoji: "😄" },
  { value: "good", emoji: "🙂" },
  { value: "okay", emoji: "😐" },
  { value: "bad", emoji: "😟" },
  { value: "terrible", emoji: "😢" },
];

export default function JournalEntryForm({
  initialData,
  defaultGoalId,
  onSubmit,
  onCancel,
}: {
  initialData?: JournalEntry;
  defaultGoalId?: string;
  onSubmit: (data: CreateJournalEntryInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [mood, setMood] = useState<Mood | null>(initialData?.mood ?? null);
  const [goalId, setGoalId] = useState(initialData?.goal_id ?? defaultGoalId ?? "");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.goals.list().then((res) => setGoals(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        mood,
        goal_id: goalId || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Entry title..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Write your thoughts..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mood
          </label>
          <div className="flex gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  mood === m.value
                    ? "bg-blue-100 ring-2 ring-blue-500"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                title={m.value}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Linked Goal
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">None</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting
            ? "Saving..."
            : initialData
              ? "Update Entry"
              : "Create Entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
