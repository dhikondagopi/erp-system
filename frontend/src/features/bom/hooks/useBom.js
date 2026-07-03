import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bomApi from '../services/bomApi';

/**
 * Hook to retrieve BoM recipes list with caching, pagination, and filters.
 */
export const useBomsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['boms', params],
    queryFn: () => bomApi.getBoms(params),
    keepPreviousData: true, // Keep UI smooth during pagination transitions
  });
};

/**
 * Hook to fetch detailed BoM recipe by UUID (includes component items & costs).
 */
export const useBomDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: () => bomApi.getBomById(id),
    enabled: !!id, // Only run if ID is valid
  });
};

/**
 * Hook to fetch BoM recipe by Finished Good product ID.
 */
export const useBomByFinishedGoodQuery = (finishedGoodId) => {
  return useQuery({
    queryKey: ['bom-product', finishedGoodId],
    queryFn: () => bomApi.getBomByFinishedGoodId(finishedGoodId),
    enabled: !!finishedGoodId, // Only run if product ID is valid
  });
};

/**
 * Hook to trigger BoM recipe creation.
 */
export const useCreateBomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bomApi.createBom,
    onSuccess: () => {
      // Invalidate both lists and detail caches
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
  });
};

/**
 * Hook to trigger updates to an existing BoM recipe.
 */
export const useUpdateBomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bomApi.updateBom(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['bom', variables.id] });
      if (data?.finished_good_id) {
        queryClient.invalidateQueries({ queryKey: ['bom-product', data.finished_good_id] });
      }
    },
  });
};

/**
 * Hook to delete a BoM recipe.
 */
export const useDeleteBomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bomApi.deleteBom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
  });
};
