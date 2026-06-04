// apps/web/src/components/LevelProgressBar.tsx
export default function LevelProgressBar({
  currentXp,
  nextLevelXp,
}: {
  currentXp: number;
  nextLevelXp: number;
}) {
  const percentage = Math.min((currentXp / nextLevelXp) * 100, 100);

  return (
    <div className="w-full">
      <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-tertiary">{currentXp} XP</span>
        <span className="text-xs text-text-tertiary">{nextLevelXp} XP</span>
      </div>
    </div>
  );
}
