import { useQuery } from '@tanstack/react-query';
import auditApi from '../services/auditApi';

/**
 * Hook to retrieve paginated, filtered audit log records.
 * @param {Object} params - Query params: userId, action, entityType, page, limit, startDate, endDate
 */
export const useAuditLogsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditApi.getLogs(params),
    keepPreviousData: true,
  });
};
