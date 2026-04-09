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
  great: "bg-green-100 text-green-700 dark:bg-green-800/60 dark:text-green-300",
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-300",
  okay: "bg-yellow-100 text-yellow-700 dark:bg-yellow-800/60 dark:text-yellow-300",
  bad: "bg-orange-100 text-orange-700 dark:bg-orange-800/60 dark:text-orange-300",
  terrible: "bg-red-100 text-red-700 dark:bg-red-800/60 dark:text-red-300",
};

export default function JournalEntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link
          to={`/journal/${entry.id}`}
          className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {entry.title}
        </Link>
        {entry.mood && (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${moodColors[entry.mood]}`}
          >
            {moodEmoji[entry.mood]} {entry.mood}
          </span>
        )}
      </div>
      {entry.content && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {entry.content.slice(0, 150)}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>{new Date(entry.created_at).toLocaleDateString("de-DE")}</span>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
