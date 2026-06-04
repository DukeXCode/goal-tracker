import { useState, useMemo } from "react";
import type { GoalStatus } from "@goal-tracker/shared";
import { useGoals } from "../hooks/useGoals";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import GoalCard from "../components/GoalCard";
import GoalForm from "../components/GoalForm";
import XpToast from "../components/XpToast";

const statusFilters: { label: string; value: GoalStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useLocalStorageState<GoalStatus | undefined>(
    "goals.statusFilter",
    undefined,
  );
  const [dateFilter, setDateFilter] = useLocalStorageState<"today" | "next7days" | "future" | null>(
    "goals.dateFilter",
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const { goals, loading, error, createGoal, updateGoal, deleteGoal, xpToast, clearXpToast } = useGoals(statusFilter);

  const filteredGoals = useMemo(() => {
    if (!dateFilter) return goals;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekOut = new Date(today.getTime() + 7 * 86400000);
    return goals.filter((g) => {
      if (!g.target_date) return false;
      const d = new Date(g.target_date);
      if (dateFilter === "today") return d >= today && d < tomorrow;
      if (dateFilter === "next7days") return d >= today && d < weekOut;
      return d >= weekOut;
    });
  }, [goals, dateFilter]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? "Close" : "New Goal"}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <GoalForm
            onSubmit={async (data) => {
              await createGoal(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-accent-muted text-accent"
                : "bg-surface-tertiary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-border-primary mx-1 hidden md:block" />
        {(["today", "next7days", "future"] as const).map((df) => (
          <button
            key={df}
            onClick={() => setDateFilter(dateFilter === df ? null : df)}
            className={`px-3 py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === df
                ? "bg-accent-muted text-accent"
                : "bg-surface-tertiary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {df === "today" ? "Today" : df === "next7days" ? "Next 7 Days" : "In the Future"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-text-tertiary py-8">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-danger-muted px-3 py-2 text-sm text-danger">{error}</div>
      )}

      {!loading && filteredGoals.length === 0 && (
        <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
          <p className="text-sm text-text-tertiary">
            {dateFilter && goals.length > 0
              ? `No goals with a target date ${dateFilter === "today" ? "today" : dateFilter === "next7days" ? "in the next 7 days" : "more than 7 days out"}.`
              : "No goals found. Create one to get started!"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDelete={deleteGoal}
            onStatusChange={(id, status) => updateGoal(id, { status })}
          />
        ))}
      </div>

      {xpToast && <XpToast amount={xpToast} onDone={clearXpToast} />}
    </div>
  );
}
