import { Link } from "react-router-dom";
import type { JournalEntry } from "@goal-tracker/shared";

const moodEmoji: Record<string, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😟",
  terrible: "😢",
};

const moodColors: Record<string, string> = {
  great: "bg-success-muted text-success",
  good: "bg-success-muted text-success",
  okay: "bg-warning-muted text-warning",
  bad: "bg-danger-muted text-danger",
  terrible: "bg-danger-muted text-danger",
};

export default function JournalEntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5 hover:border-border-hover transition-all group">
      <div className="flex items-start justify-between mb-2">
        <Link
          to={`/journal/${entry.id}`}
          className="text-base font-semibold text-text-primary hover:text-accent transition-colors"
        >
          {entry.title}
        </Link>
        {entry.mood && (
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${moodColors[entry.mood]}`}
          >
            {moodEmoji[entry.mood]} {entry.mood}
          </span>
        )}
      </div>
      {entry.content && (
        <p className="text-sm text-text-tertiary mb-3 line-clamp-2">
          {entry.content.slice(0, 150)}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{new Date(entry.created_at).toLocaleDateString("de-DE")}</span>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-text-tertiary hover:text-danger transition-colors md:opacity-0 md:group-hover:opacity-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
