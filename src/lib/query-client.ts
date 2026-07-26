import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError } from '@/types/api-error';
import { handleApiError } from '@/lib/error-utils';

/**
 * Single QueryClient instance for the app, in its own module (not main.tsx)
 * so it can be imported outside the React tree — e.g. by auth-context's
 * logout() to purge cached data, which can't use useQueryClient() because
 * it lives above QueryClientProvider.
 */

const mutationCache = new MutationCache({
  onSuccess: (_data, _variables, _context, mutation) => {
    const meta = mutation.meta;
    if (meta?.successMessage && meta?.showSuccessToast !== false) {
      toast.success(meta.successMessage);
    }
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      // Optimizaciones para reducir re-fetches innecesarios
      staleTime: 2 * 60 * 1000, // 2 minutos - datos considerados frescos
      gcTime: 5 * 60 * 1000, // 5 minutos - tiempo en cache
      refetchOnWindowFocus: false, // No re-fetch al enfocar ventana
      refetchOnMount: false, // No re-fetch al montar si hay datos frescos
      retry: (failureCount, error: unknown) => {
        // No reintentar errores del cliente (4xx)
        if (ApiError.isApiError(error) && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        // Fallback para errores no-ApiError con status
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // No reintentar mutaciones por defecto
      onError: (error) => handleApiError(error), // Manejo global de errores (overrideable per-mutation)
    },
  },
});
