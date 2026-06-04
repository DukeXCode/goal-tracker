// apps/web/src/components/AchievementCard.tsx
import type { Achievement } from "@goal-tracker/shared";

const iconMap: Record<string, string> = {
  footprint: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  bullseye: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  flag: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
  book: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  clock: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  crown: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  medal: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  const earned = !!achievement.earned_at;
  const iconPath = iconMap[achievement.icon] ?? iconMap.star;

  return (
    <div
      className={`bg-surface-secondary rounded-xl border border-border-primary p-4 md:p-5 transition-all ${
        earned ? "" : "opacity-40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            earned ? "bg-accent-muted" : "bg-surface-tertiary"
          }`}
        >
          <svg
            className={`w-5 h-5 ${earned ? "text-accent" : "text-text-tertiary"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d={iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">
            {achievement.title}
          </h4>
          <p className="text-xs text-text-tertiary mt-0.5">
            {achievement.description}
          </p>
          {earned && achievement.earned_at && (
            <p className="text-xs text-accent mt-1">
              Earned {formatDate(achievement.earned_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
