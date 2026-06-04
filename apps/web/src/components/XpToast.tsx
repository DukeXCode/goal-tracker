// apps/web/src/components/XpToast.tsx
import { useEffect, useState } from "react";

export default function XpToast({
  amount,
  onDone,
}: {
  amount: number;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-surface-secondary border border-border-primary rounded-lg px-4 py-2 shadow-lg shadow-black/20">
        <span className="text-sm font-semibold text-accent">+{amount} XP</span>
      </div>
    </div>
  );
}
