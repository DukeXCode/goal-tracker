import { useState } from "react";
import { useCoachingTopics } from "../hooks/useCoachingTopics";
import { useCoachingSessions } from "../hooks/useCoachingSessions";

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("de-DE");
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
    deleteSession,
  } = useCoachingSessions();

  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
        Coaching
      </h2>

      {/* Next Session */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Next Session
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {pendingTopics.length} topic{pendingTopics.length === 1 ? "" : "s"}
          </span>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a topic for next session..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        {topicsLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        )}
        {topicsError && (
          <p className="text-sm text-red-500 dark:text-red-400">{topicsError}</p>
        )}

        {!topicsLoading && pendingTopics.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No topics yet. Add one above to start prepping for your next session.
          </p>
        )}

        {pendingTopics.length > 0 && (
          <ul className="space-y-2">
            {pendingTopics.map((topic) => (
              <li
                key={topic.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  id={`topic-${topic.id}`}
                  checked={selected.has(topic.id)}
                  onChange={() => toggleSelect(topic.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`topic-${topic.id}`}
                  className="flex-1 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {topic.title}
                </label>
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendingTopics.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selected.size} selected
            </span>
            <button
              onClick={handleComplete}
              disabled={completing || selected.size === 0}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? "Completing..." : "Complete Session"}
            </button>
          </div>
        )}
      </section>

      {/* Session Log */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Session Log
        </h3>

        {sessionsLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        )}
        {sessionsError && (
          <p className="text-sm text-red-500 dark:text-red-400">{sessionsError}</p>
        )}

        {!sessionsLoading && sessions.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No completed sessions yet.
          </p>
        )}

        <div className="space-y-3">
          {sessions.map((session) => {
            const isOpen = expanded.has(session.id);
            return (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleExpanded(session.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
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
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(session.session_date)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {session.topics.length} topic
                      {session.topics.length === 1 ? "" : "s"}
                    </span>
                  </div>
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
                    className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Delete
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-11">
                    {session.topics.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No topics recorded.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {session.topics.map((t) => (
                          <li
                            key={t.id}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-green-500 mt-0.5">✓</span>
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
  );
}
