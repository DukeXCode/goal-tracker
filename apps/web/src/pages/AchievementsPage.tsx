// apps/web/src/pages/AchievementsPage.tsx
import { useNavigate } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import AchievementCard from "../components/AchievementCard";

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { achievements, achievementsLoading } = useGamification();

  const earned = achievements.filter((a) => !!a.earned_at);
  const locked = achievements.filter((a) => !a.earned_at);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-text-primary">Achievements</h2>
        <p className="text-sm text-text-tertiary mt-1">
          {earned.length} of {achievements.length} unlocked
        </p>
      </div>

      {achievementsLoading && (
        <div className="flex items-center gap-2 text-text-tertiary py-8">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {!achievementsLoading && earned.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Earned
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earned.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {!achievementsLoading && locked.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Locked
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
