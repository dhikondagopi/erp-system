import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import salesApi from '../services/salesApi';

/**
 * Hook to retrieve sales orders list with pagination and filters.
 */
export const useSalesOrdersQuery = (params = {}) => {
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => salesApi.getSalesOrders(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch detailed sales order by ID.
 */
export const useSalesOrderDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesApi.getSalesOrderById(id),
    enabled: !!id,
  });
};

/**
 * Hook to draft a new sales order.
 */
export const useCreateSalesOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesApi.createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
};

/**
 * Hook to update sales order status (Confirm, Ship, Cancel).
 */
export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => salesApi.updateOrderStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order', variables.id] });
      // Since confirmation/shipment/cancellation triggers inventory updates:
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
