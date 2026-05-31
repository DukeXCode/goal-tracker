import { useState, useRef } from "react";
import { useCoachingTopics } from "../hooks/useCoachingTopics";
import { useCoachingSessions } from "../hooks/useCoachingSessions";

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("de-DE");
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

export default function CoachingPage() {
  const {
    topics: pendingTopics,
    loading: topicsLoading,
    error: topicsError,
    createTopic,
    deleteTopic,
    refresh: refreshTopics,
  } = useCoachingTopics("pending");

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    completeSession,
    updateSession,
    deleteSession,
  } = useCoachingSessions();

  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editDateInput, setEditDateInput] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const editDatePickerRef = useRef<HTMLInputElement>(null);

  const setEditDateFromISO = (iso: string) => {
    setEditTargetDate(iso);
    setEditDateInput(isoToDisplay(iso));
  };

  const handleSaveSessionDate = async () => {
    if (!editingSessionId || !editTargetDate) return;
    setSavingDate(true);
    try {
      await updateSession(editingSessionId, { session_date: editTargetDate });
      setEditingSessionId(null);
    } finally {
      setSavingDate(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleExpanded = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      await createTopic({ title });
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
    await deleteTopic(id);
  };

  const handleComplete = async () => {
    if (selected.size === 0) return;
    setCompleting(true);
    try {
      await completeSession({ topic_ids: Array.from(selected) });
      setSelected(new Set());
      await refreshTopics();
    } finally {
      setCompleting(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session? Its topics will return to the backlog."))
      return;
    await deleteSession(id);
    await refreshTopics();
  };

  const editingSession = editingSessionId
    ? sessions.find((s) => s.id === editingSessionId)
    : null;

  return (
    <>
      <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl font-bold text-text-primary">Coaching</h2>

      {/* Next Session */}
      <section className="bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            Next Session
          </h3>
          <span className="text-xs font-medium text-text-tertiary bg-surface-tertiary px-2 py-1 rounded-md">
            {pendingTopics.length} topic{pendingTopics.length === 1 ? "" : "s"}
          </span>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a topic for next session..."
            className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border-primary bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        {topicsLoading && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}
        {topicsError && (
          <div className="rounded-lg bg-danger-muted px-3 py-2 text-sm text-danger">{topicsError}</div>
        )}

        {!topicsLoading && pendingTopics.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">
            No topics yet. Add one above to start prepping for your next session.
          </p>
        )}

        {pendingTopics.length > 0 && (
          <ul className="space-y-2">
            {pendingTopics.map((topic) => (
              <li
                key={topic.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  selected.has(topic.id)
                    ? "bg-accent-subtle border-accent/30"
                    : "bg-surface-tertiary border-border-primary"
                }`}
              >
                <input
                  type="checkbox"
                  id={`topic-${topic.id}`}
                  checked={selected.has(topic.id)}
                  onChange={() => toggleSelect(topic.id)}
                  className="w-4 h-4 rounded border-border-primary text-accent focus:ring-accent bg-surface-primary"
                />
                <label
                  htmlFor={`topic-${topic.id}`}
                  className="flex-1 text-sm text-text-primary cursor-pointer"
                >
                  {topic.title}
                </label>
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="text-xs text-text-tertiary hover:text-danger transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendingTopics.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-border-primary">
            <span className="text-xs text-text-tertiary">
              {selected.size} selected
            </span>
            <button
              onClick={handleComplete}
              disabled={completing || selected.size === 0}
              className="px-4 py-2 bg-success/90 text-white text-sm font-semibold rounded-lg hover:bg-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? "Completing..." : "Complete Session"}
            </button>
          </div>
        )}
      </section>

      {/* Session Log */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Session Log
        </h3>

        {sessionsLoading && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}
        {sessionsError && (
          <div className="rounded-lg bg-danger-muted px-3 py-2 text-sm text-danger">{sessionsError}</div>
        )}

        {!sessionsLoading && sessions.length === 0 && (
          <div className="rounded-xl border border-border-primary bg-surface-secondary p-8 text-center">
            <p className="text-sm text-text-tertiary">
              No completed sessions yet.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {sessions.map((session) => {
            const isOpen = expanded.has(session.id);
            return (
              <div
                key={session.id}
                className="bg-surface-secondary rounded-xl border border-border-primary overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(session.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-text-tertiary transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-sm font-medium text-text-primary">
                      {formatDate(session.session_date)}
                    </span>
                    <span className="text-xs font-medium text-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded-md">
                      {session.topics.length} topic
                      {session.topics.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const iso = session.session_date.includes("T")
                          ? session.session_date.split("T")[0]
                          : session.session_date.split(" ")[0];
                        setEditTargetDate(iso);
                        setEditDateInput(isoToDisplay(iso));
                        setEditingSessionId(session.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          const iso = session.session_date.includes("T")
                            ? session.session_date.split("T")[0]
                            : session.session_date.split(" ")[0];
                          setEditTargetDate(iso);
                          setEditDateInput(isoToDisplay(iso));
                          setEditingSessionId(session.id);
                        }
                      }}
                      className="text-xs text-text-tertiary hover:text-accent transition-colors cursor-pointer"
                    >
                      Edit
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }
                      }}
                      className="text-xs text-text-tertiary hover:text-danger transition-colors cursor-pointer"
                    >
                      Delete
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-11 border-t border-border-primary pt-3">
                    {session.topics.length === 0 ? (
                      <p className="text-sm text-text-tertiary">
                        No topics recorded.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {session.topics.map((t) => (
                          <li
                            key={t.id}
                            className="text-sm text-text-secondary flex items-start gap-2"
                          >
                            <span className="text-success mt-0.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>{t.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>

      {editingSessionId && editingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setEditingSessionId(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-surface-secondary rounded-xl border border-border-primary p-6 w-full max-w-sm mx-4 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Edit Session Date
            </h3>

            <div className="relative mb-4">
              <input
                type="text"
                value={editDateInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditDateInput(val);
                  const iso = displayToISO(val);
                  if (iso) setEditTargetDate(iso);
                  else if (val === "") setEditTargetDate("");
                }}
                placeholder="dd.MM.yyyy"
                className="w-full px-3 py-2.5 pr-9 border border-border-primary rounded-lg text-sm bg-surface-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
              <input
                ref={editDatePickerRef}
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditDateFromISO(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => editDatePickerRef.current?.showPicker()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingSessionId(null)}
                className="px-4 py-2.5 bg-surface-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-hover border border-border-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSessionDate}
                disabled={savingDate || !editTargetDate}
                className="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {savingDate ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
