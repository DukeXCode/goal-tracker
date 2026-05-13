import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Goal, GoalStatus } from "@goal-tracker/shared";

const statusColors: Record<string, string> = {
  not_started: "bg-surface-tertiary text-text-secondary",
  in_progress: "bg-warning-muted text-warning",
  completed: "bg-success-muted text-success",
};

const statusDots: Record<string, string> = {
  not_started: "bg-text-tertiary",
  in_progress: "bg-warning",
  completed: "bg-success",
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
  const navigate = useNavigate();
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
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5 hover:border-border-hover transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
          {goal.title}
        </span>
        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer hover:ring-2 hover:ring-accent/30 transition-all ${statusColors[goal.status]}`}
          >
            {statusLabels[goal.status]}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-surface-tertiary border border-border-primary rounded-lg shadow-xl shadow-black/30 z-10 py-1 min-w-[140px]">
              {allStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s !== goal.status && onStatusChange) {
                      onStatusChange(goal.id, s);
                    }
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                    s === goal.status
                      ? "text-text-tertiary"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusDots[s]}`} />
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {goal.description && (
        <p className="text-sm text-text-tertiary mb-3 line-clamp-2">
          {goal.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        {goal.target_date ? (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(goal.target_date).toLocaleDateString("de-DE")}
          </span>
        ) : (
          <span />
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
            className="text-text-tertiary hover:text-danger transition-colors md:opacity-0 md:group-hover:opacity-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
