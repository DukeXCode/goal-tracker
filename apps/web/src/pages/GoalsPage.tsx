import { useState } from "react";
import type { GoalStatus } from "@goal-tracker/shared";
import { useGoals } from "../hooks/useGoals";
import GoalCard from "../components/GoalCard";
import GoalForm from "../components/GoalForm";

const filters: { label: string; value: GoalStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<GoalStatus | undefined>();
  const [showForm, setShowForm] = useState(false);
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals(statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Close" : "New Goal"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <GoalForm
            onSubmit={async (data) => {
              await createGoal(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && goals.length === 0 && (
        <p className="text-sm text-gray-500">No goals found. Create one to get started!</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
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
