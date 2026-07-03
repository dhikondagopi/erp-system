import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import customerApi from '../services/customerApi';

/**
 * Hook to retrieve customers list with pagination and search.
 */
export const useCustomersQuery = (params = {}) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.getCustomers(params),
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch detailed customer profile by UUID.
 */
export const useCustomerDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getCustomerById(id),
    enabled: !!id,
  });
};

/**
 * Hook to trigger customer registration.
 */
export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

/**
 * Hook to trigger customer profile updates.
 */
export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customerApi.updateCustomer(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
};

/**
 * Hook to trigger customer deletion.
 */
export const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
