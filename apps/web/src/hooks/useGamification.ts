// apps/web/src/hooks/useGamification.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useGamification() {
  const statsQuery = useQuery({
    queryKey: ["gamification", "stats"],
    queryFn: async () => (await api.gamification.getStats()).data,
  });

  const achievementsQuery = useQuery({
    queryKey: ["gamification", "achievements"],
    queryFn: async () => (await api.gamification.getAchievements()).data,
  });

  return {
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    achievements: achievementsQuery.data ?? [],
    achievementsLoading: achievementsQuery.isLoading,
    refresh: () => {
      statsQuery.refetch();
      achievementsQuery.refetch();
    },
  };
}
