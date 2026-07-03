import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import purchaseApi from '../services/purchaseApi';

/**
 * Hook to retrieve purchase orders list with pagination and filters.
 */
export const usePurchaseOrdersQuery = (params = {}) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseApi.getPurchaseOrders(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch detailed purchase order by ID.
 */
export const usePurchaseOrderDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseApi.getPurchaseOrderById(id),
    enabled: !!id,
  });
};

/**
 * Hook to draft a new purchase order.
 */
export const useCreatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};

/**
 * Hook to update purchase order status (Send, Receive, Cancel).
 */
export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => purchaseApi.updateOrderStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
      // Invalidate products, inventory and dashboards since status change triggers updates:
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
