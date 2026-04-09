import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Goal, GoalStatus } from "@goal-tracker/shared";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-800/60 dark:text-green-300",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const allStatuses: GoalStatus[] = ["not_started", "in_progress", "completed"];

export default function GoalCard({
  goal,
  onDelete,
  onStatusChange,
}: {
  goal: Goal;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: GoalStatus) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Link
          to={`/goals/${goal.id}`}
          className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {goal.title}
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 transition-all ${statusColors[goal.status]}`}
          >
            {statusLabels[goal.status]}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              {allStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s !== goal.status && onStatusChange) {
                      onStatusChange(goal.id, s);
                    }
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                    s === goal.status
                      ? "bg-gray-50 text-gray-400 dark:bg-gray-600 dark:text-gray-500"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    s === "not_started" ? "bg-gray-400" : s === "in_progress" ? "bg-blue-500" : "bg-green-500"
                  }`} />
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {goal.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {goal.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        {goal.target_date && (
          <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
        )}
        {!goal.target_date && <span />}
        {onDelete && (
          <button
            onClick={() => onDelete(goal.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
