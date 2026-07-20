import { Link } from "react-router-dom";
import { useGoals } from "../hooks/useGoals";
import { useJournalEntries } from "../hooks/useJournalEntries";
import { useGamification } from "../hooks/useGamification";
import LevelBadge from "../components/LevelBadge";
import LevelProgressBar from "../components/LevelProgressBar";

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("de-DE");
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / 86400000);
}

function dueLabel(iso: string): { text: string; urgent: boolean } {
  const days = daysUntil(iso);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days === 1) return { text: "Due tomorrow", urgent: true };
  if (days <= 7) return { text: `Due in ${days}d`, urgent: false };
  return { text: formatDate(iso), urgent: false };
}

const statusDots: Record<string, string> = {
  not_started: "bg-text-tertiary",
  in_progress: "bg-warning",
  completed: "bg-success",
};

export default function DashboardPage() {
  const { goals, loading: goalsLoading } = useGoals();
  const { entries, loading: entriesLoading } = useJournalEntries();

  const { stats, statsLoading } = useGamification();

  const loading = goalsLoading || entriesLoading;

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

  const upcomingGoals = goals
    .filter((g) => g.status !== "completed" && g.target_date && daysUntil(g.target_date) >= 0)
    .sort((a, b) => a.target_date!.localeCompare(b.target_date!))
    .slice(0, 5);

  const lastEntry = entries.length > 0 ? entries[0] : null;

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-sm text-text-tertiary mt-1">Your goals and journal at a glance.</p>
      </div>

      {/* Gamification Stats */}
      {!statsLoading && stats && (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5">
          <div className="flex items-center gap-3 mb-3">
            <LevelBadge level={stats.user_stats.level} size="md" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">
                  Level {stats.user_stats.level}
                </span>
                <span className="text-sm text-text-tertiary">
                  {stats.user_stats.xp} total XP
                </span>
              </div>
            </div>
            <Link
              to="/achievements"
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Achievements
            </Link>
          </div>
          <LevelProgressBar
            currentXp={stats.xp_in_current_level}
            nextLevelXp={stats.xp_to_next_level}
          />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {goals.filter((g) => g.status === "completed").length}
          </p>
          <p className="text-xs text-text-tertiary mt-1">Goals Completed</p>
        </div>
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">{entries.length}</p>
          <p className="text-xs text-text-tertiary mt-1">Journal Entries</p>
        </div>
      </div>

      {/* Last Journal Entry */}
      <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Last Journal</h3>
          <Link to="/journal" className="text-xs text-accent hover:text-accent-hover transition-colors">View all</Link>
        </div>
        {lastEntry ? (
          <div>
            <Link to={`/journal/${lastEntry.id}`} className="text-base font-semibold text-text-primary hover:text-accent transition-colors">
              {lastEntry.title}
            </Link>
            <p className="text-2xl font-bold text-accent mt-1">{timeAgo(lastEntry.created_at)}</p>
            {lastEntry.content && (
              <p className="text-sm text-text-tertiary mt-2 line-clamp-2">{lastEntry.content.slice(0, 120)}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-tertiary mb-2">No entries yet</p>
            <Link to="/journal" className="text-sm text-accent hover:text-accent-hover transition-colors">Write your first entry</Link>
          </div>
        )}
      </div>

      {/* Upcoming Goals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Upcoming Goals</h3>
          <Link to="/goals" className="text-xs text-accent hover:text-accent-hover transition-colors">View all</Link>
        </div>
        {upcomingGoals.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
            <p className="text-sm text-text-tertiary">No upcoming goals with target dates.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingGoals.map((goal) => {
              const due = dueLabel(goal.target_date!);
              return (
                <Link
                  key={goal.id}
                  to={`/goals/${goal.id}`}
                  className="flex items-center gap-3 bg-surface-secondary rounded-xl border border-border-primary p-3.5 md:p-4 hover:border-border-hover transition-all group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDots[goal.status]}`} />
                  <span className="flex-1 text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    {goal.title}
                  </span>
                  <span className={`text-xs font-medium whitespace-nowrap ${due.urgent ? "text-danger" : "text-text-tertiary"}`}>
                    {due.text}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
