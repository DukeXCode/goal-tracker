import { useState, useEffect } from "react";
import type {
  JournalEntry,
  Mood,
  CreateJournalEntryInput,
  Goal,
} from "@goal-tracker/shared";
import { api } from "../lib/api";
import Markdown from "./Markdown";

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
  const [preview, setPreview] = useState(false);
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
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          placeholder="Entry title..."
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            Content
          </label>
          <div className="flex gap-0.5 bg-surface-tertiary rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                !preview
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                preview
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        {preview ? (
          <div className="w-full min-h-[10rem] px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary overflow-auto">
            {content ? (
              <Markdown content={content} />
            ) : (
              <p className="text-text-tertiary italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary font-mono focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            placeholder="Write in markdown... **bold**, *italic*, # headings, - lists, etc."
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Mood
          </label>
          <div className="flex gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                  mood === m.value
                    ? "bg-accent-muted ring-2 ring-accent"
                    : "bg-surface-tertiary hover:bg-surface-hover border border-border-primary"
                }`}
                title={m.value}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Linked Goal
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
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
          className="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
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
          className="px-4 py-2.5 bg-surface-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-hover border border-border-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
