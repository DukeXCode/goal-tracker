// apps/web/src/components/LevelBadge.tsx
export default function LevelBadge({
  level,
  size = "sm",
}: {
  level: number;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div
      className={`${sizeClasses} rounded-full bg-accent flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {level}
    </div>
  );
}
