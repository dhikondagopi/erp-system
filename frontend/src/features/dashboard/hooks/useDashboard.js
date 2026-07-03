import { useQuery } from '@tanstack/react-query';
import dashboardApi from '../services/dashboardApi';

/**
 * Hook to retrieve the full dashboard analytics summary.
 * Refreshes every 2 minutes automatically.
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
};
