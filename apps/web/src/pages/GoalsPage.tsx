import { useState, useMemo } from "react";
import type { GoalStatus } from "@goal-tracker/shared";
import { useGoals } from "../hooks/useGoals";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import GoalCard from "../components/GoalCard";
import GoalForm from "../components/GoalForm";

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
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals(statusFilter);

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
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
        >
          {showForm ? "Close" : "New Goal"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
                ? "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
        {(["today", "next7days", "future"] as const).map((df) => (
          <button
            key={df}
            onClick={() => setDateFilter(dateFilter === df ? null : df)}
            className={`px-3 py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === df
                ? "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
            }`}
          >
            {df === "today" ? "Today" : df === "next7days" ? "Next 7 Days" : "In the Future"}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

      {!loading && filteredGoals.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dateFilter && goals.length > 0
            ? `No goals with a target date ${dateFilter === "today" ? "today" : dateFilter === "next7days" ? "in the next 7 days" : "more than 7 days out"}.`
            : "No goals found. Create one to get started!"}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDelete={deleteGoal}
            onStatusChange={(id, status) => updateGoal(id, { status })}
          />
        ))}
      </div>
    </div>
  );
}
