import { useState } from "react";
import { useJournalEntries } from "../hooks/useJournalEntries";
import JournalEntryCard from "../components/JournalEntryCard";
import JournalEntryForm from "../components/JournalEntryForm";

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const { entries, loading, error, createEntry, deleteEntry } =
    useJournalEntries();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Journal</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? "Close" : "New Entry"}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6">
          <JournalEntryForm
            onSubmit={async (data) => {
              await createEntry(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

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

      {!loading && entries.length === 0 && (
        <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
          <p className="text-sm text-text-tertiary">
            No journal entries yet. Start writing!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {entries.map((entry) => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            onDelete={deleteEntry}
          />
        ))}
      </div>
    </div>
  );
}
