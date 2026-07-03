import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import vendorApi from '../services/vendorApi';

/**
 * Hook to retrieve vendors list with pagination and search.
 */
export const useVendorsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => vendorApi.getVendors(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch detailed vendor profile by UUID.
 */
export const useVendorDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getVendorById(id),
    enabled: !!id,
  });
};

/**
 * Hook to trigger vendor registration.
 */
export const useCreateVendorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorApi.createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

/**
 * Hook to trigger vendor profile updates.
 */
export const useUpdateVendorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => vendorApi.updateVendor(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id] });
    },
  });
};

/**
 * Hook to trigger vendor deletion.
 */
export const useDeleteVendorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorApi.deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};
