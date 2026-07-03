import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent redundant api reload requests on window refocus
      retry: (failureCount, error) => {
        // Do not retry on client-side status code errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Max retry attempts for structural or connection issues
        return failureCount < 2;
      },
      staleTime: 3 * 60 * 1000, // Data remains fresh for 3 minutes before prompting background re-fetch
      cacheTime: 10 * 60 * 1000, // Retain query cache in memory for 10 minutes
    },
    mutations: {
      retry: false, // Mutations (create/update/delete) should fail immediately rather than retrying
    },
  },
});

export default queryClient;
