import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { toast } from 'sonner';

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

const queryCache = new QueryCache({
  onError: (error, query) => {
    // Solo fallo de primera carga: si ya hay datos en cache, este error es
    // un refetch en background (staleTime vencido, refocus, etc.) y no debe
    // interrumpir con un toast — la UI que consume el query decide cómo
    // mostrarlo (loading state, error state propio).
    if (query.state.data !== undefined) return;
    // Opt-out por query para páginas con su propio error state
    // (content-error-state.tsx, auth-types-error-state.tsx, etc.)
    if (query.meta?.showErrorToast === false) return;

    handleApiError(error);
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Optimizaciones para reducir re-fetches innecesarios
      staleTime: 2 * 60 * 1000, // 2 minutos - datos considerados frescos
      gcTime: 5 * 60 * 1000, // 5 minutos - tiempo en cache
      refetchOnWindowFocus: false, // No re-fetch al enfocar ventana
      // Dos palancas distintas para "no volver a pedir un endpoint ya
      // caído" — react-query las trata por separado según si la query TUVO
      // datos alguna vez (`query.state.data !== undefined`) o no
      // (verificado en node_modules/@tanstack/query-core .../queryObserver.js,
      // shouldLoadOnMount/shouldFetchOnMount):
      //
      // - `retryOnMount: false` — la que importa en el caso más común (un
      //   endpoint caído desde el primer mount, `data` nunca se pobló).
      //   Sin esto, CADA mount de un observer sobre una query en error
      //   ('error' status, sin datos) cuenta como "intento nuevo" y
      //   dispara un fetch — con `retry: false` no reintenta *dentro* de
      //   ese fetch, pero el mount en sí ya es indistinguible de un
      //   reintento manual. Con varios componentes suscritos al mismo
      //   queryKey (ver useMyWork, llamado tanto en home.tsx como dentro de
      //   HomeMyWorkTab) cualquier remonte de cualquiera de ellos vuelve a
      //   disparar los 3 fetches — así se ve un "loop infinito" de 500s.
      // - `refetchOnMount` — solo aplica cuando la query SÍ tuvo éxito
      //   antes y un refetch posterior en background falló; acá si el
      //   remonte encuentra status 'error' tampoco reintenta.
      refetchOnMount: (query) => query.state.status !== 'error',
      retryOnMount: false,
      // Sin reintentos automáticos para ningún status: un 5xx no se pide 3
      // veces más solo (multiplicaba x4 cada fallo de backend); igual que los
      // 4xx, lo resuelve el reintento explícito del usuario.
      retry: false,
    },
    mutations: {
      retry: false, // No reintentar mutaciones por defecto
      onError: (error) => handleApiError(error), // Manejo global de errores (overrideable per-mutation)
    },
  },
});
