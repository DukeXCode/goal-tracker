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

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-sm text-text-tertiary mt-1">Your goals and journal at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Goals" value={goals.length} variant="purple" />
        <StatCard label="Not Started" value={notStarted} variant="neutral" />
        <StatCard label="In Progress" value={inProgress} variant="warning" />
        <StatCard label="Completed" value={completed} variant="success" />
      </div>

      <div className="flex gap-3">
        <Link
          to="/goals"
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          New Goal
        </Link>
        <Link
          to="/journal"
          className="px-4 py-2.5 bg-surface-tertiary hover:bg-surface-hover text-text-secondary text-sm font-medium rounded-lg border border-border-primary transition-colors"
        >
          New Journal Entry
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Recent Journal Entries
        </h3>
        {recentEntries.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
            <p className="text-sm text-text-tertiary">
              No journal entries yet. Start writing!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
  variant,
}: {
  label: string;
  value: number;
  variant: "purple" | "neutral" | "warning" | "success";
}) {
  const styles = {
    purple: "border-accent/30 bg-accent-subtle",
    neutral: "border-border-primary bg-surface-secondary",
    warning: "border-warning/30 bg-warning-muted",
    success: "border-success/30 bg-success-muted",
  };

  const valueColors = {
    purple: "text-accent",
    neutral: "text-text-primary",
    warning: "text-warning",
    success: "text-success",
  };

  return (
    <div className={`rounded-xl border p-4 md:p-5 ${styles[variant]}`}>
      <p className="text-xs md:text-sm font-medium text-text-tertiary">{label}</p>
      <p className={`text-2xl md:text-3xl font-bold mt-1 ${valueColors[variant]}`}>{value}</p>
    </div>
  );
}
