import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workOrderApi from '../services/workOrderApi';

/**
 * Hook to retrieve all work orders with filters (caching, search).
 */
export const useWorkOrdersQuery = (params = {}) => {
  return useQuery({
    queryKey: ['work-orders', params],
    queryFn: () => workOrderApi.getWorkOrders(params),
  });
};

/**
 * Hook to load available workers/employees for task assignments.
 */
export const useWorkersQuery = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: workOrderApi.getWorkers,
  });
};

/**
 * Hook to update a work order (status transitions, assignee settings).
 */
export const useUpdateWorkOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => workOrderApi.updateWorkOrder(id, data),
    onSuccess: (data, variables) => {
      // Invalidate work orders and specific manufacturing order details to synchronize statuses
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      if (data?.manufacturing_order_id) {
        queryClient.invalidateQueries({ queryKey: ['manufacturing-order', data.manufacturing_order_id] });
      }
    },
  });
};
