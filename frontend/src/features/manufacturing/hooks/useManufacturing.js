import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import manufacturingApi from '../services/manufacturingApi';

const QUERY_KEY = 'manufacturing-orders';

/**
 * Query hook: fetch paginated manufacturing orders.
 */
export const useManufacturingOrdersQuery = (params = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => manufacturingApi.getAll(params),
    keepPreviousData: true,
    staleTime: 30_000,
  });

/**
 * Query hook: fetch a single manufacturing order by ID.
 */
export const useManufacturingOrderQuery = (id) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => manufacturingApi.getById(id),
    enabled: !!id,
    staleTime: 15_000,
  });

/**
 * Mutation hook: create a new manufacturing order.
 */
export const useCreateManufacturingOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moData) => manufacturingApi.create(moData),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

/**
 * Mutation hook: transition a manufacturing order status.
 */
export const useUpdateMoStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => manufacturingApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
