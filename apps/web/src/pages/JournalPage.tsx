import { useState } from "react";
import { useJournalEntries } from "../hooks/useJournalEntries";
import JournalEntryCard from "../components/JournalEntryCard";
import JournalEntryForm from "../components/JournalEntryForm";

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const { entries, loading, error, createEntry, deleteEntry } =
    useJournalEntries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Journal</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
        >
          {showForm ? "Close" : "New Entry"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <JournalEntryForm
            onSubmit={async (data) => {
              await createEntry(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No journal entries yet. Start writing!
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
