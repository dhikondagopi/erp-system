import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inventoryApi from '../services/inventoryApi';

/**
 * Hook to retrieve current inventory levels listing.
 */
export const useInventoryQuery = (params = {}) => {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.getInventoryLevels(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to retrieve global transaction ledger history records.
 */
export const useStockLedgerQuery = (params = {}) => {
  return useQuery({
    queryKey: ['stock-ledger', params],
    queryFn: () => inventoryApi.getStockLedger(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to perform manual stock levels adjustments.
 */
export const useAdjustStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: () => {
      // Invalidate both inventory levels and transaction ledger lists
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // unit_cost changes might propagate
    },
  });
};
