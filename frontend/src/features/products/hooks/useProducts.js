import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productApi from '../services/productApi';

/**
 * Hook to retrieve products list with caching, pagination, and filters.
 */
export const useProductsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getProducts(params),
    keepPreviousData: true, // Keep loading smooth during pagination updates
  });
};

/**
 * Hook to fetch detailed product metadata by UUID.
 */
export const useProductDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProductById(id),
    enabled: !!id, // Prevent trigger on empty/null parameters
  });
};

/**
 * Hook to trigger product creation.
 */
export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      // Invalidate list queries to refresh the directory
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/**
 * Hook to trigger product metadata updates.
 */
export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productApi.updateProduct(id, data),
    onSuccess: (data, variables) => {
      // Invalidate matching lists and specific detail caches
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
};

/**
 * Hook to trigger product deletion.
 */
export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      // Invalidate list queries to refresh directory entries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
