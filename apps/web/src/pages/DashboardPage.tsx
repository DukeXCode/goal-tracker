import { Link } from "react-router-dom";
import { useGoals } from "../hooks/useGoals";
import { useJournalEntries } from "../hooks/useJournalEntries";
import JournalEntryCard from "../components/JournalEntryCard";

export default function DashboardPage() {
  const { goals, loading: goalsLoading } = useGoals();
  const { entries, loading: entriesLoading } = useJournalEntries();

  const notStarted = goals.filter((g) => g.status === "not_started").length;
  const inProgress = goals.filter((g) => g.status === "in_progress").length;
  const completed = goals.filter((g) => g.status === "completed").length;

  const recentEntries = entries.slice(0, 5);

  if (goalsLoading || entriesLoading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your goals and journal at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Goals" value={goals.length} color="blue" />
        <StatCard label="Not Started" value={notStarted} color="gray" />
        <StatCard label="In Progress" value={inProgress} color="amber" />
        <StatCard label="Completed" value={completed} color="green" />
      </div>

      <div className="flex gap-3">
        <Link
          to="/goals"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
        >
          New Goal
        </Link>
        <Link
          to="/journal"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          New Journal Entry
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Journal Entries
        </h3>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No journal entries yet. Start writing!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEntries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
    gray: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
    green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
