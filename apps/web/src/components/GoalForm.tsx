import { useState, useRef } from "react";
import type { Goal, GoalStatus, CreateGoalInput } from "@goal-tracker/shared";

function toISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function displayToISO(display: string) {
  const match = display.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

const quickDates = [
  { label: "Today", value: () => toISODate(new Date()) },
  {
    label: "Next Week",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return toISODate(d);
    },
  },
  {
    label: "Next Month",
    value: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return toISODate(d);
    },
  },
];

export default function GoalForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Goal;
  onSubmit: (data: CreateGoalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState<GoalStatus>(initialData?.status ?? "not_started");
  const [targetDate, setTargetDate] = useState(initialData?.target_date ?? "");
  const [dateInput, setDateInput] = useState(isoToDisplay(initialData?.target_date ?? ""));
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const setDateFromISO = (iso: string) => {
    setTargetDate(iso);
    setDateInput(isoToDisplay(iso));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        target_date: targetDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          placeholder="What do you want to achieve?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          placeholder="Describe your goal..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as GoalStatus)}
          className="w-full px-3 py-2.5 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Target Date
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={dateInput}
              onChange={(e) => {
                const val = e.target.value;
                setDateInput(val);
                const iso = displayToISO(val);
                if (iso) setTargetDate(iso);
                else if (val === "") setTargetDate("");
              }}
              placeholder="dd.MM.yyyy"
              className="w-36 px-3 py-2 pr-9 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
            <input
              ref={datePickerRef}
              type="date"
              value={targetDate}
              onChange={(e) => setDateFromISO(e.target.value)}
              className="sr-only"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => datePickerRef.current?.showPicker()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1.5">
            {quickDates.map((qd) => (
              <button
                key={qd.label}
                type="button"
                onClick={() => setDateFromISO(qd.value())}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  targetDate === qd.value()
                    ? "bg-accent-muted text-accent"
                    : "bg-surface-tertiary text-text-secondary hover:bg-surface-hover border border-border-primary"
                }`}
              >
                {qd.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving..." : initialData ? "Update Goal" : "Create Goal"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-surface-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-hover border border-border-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
