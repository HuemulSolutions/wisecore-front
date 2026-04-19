import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Wraps a mutation function so that the specified query keys are refetched
 * **before** the returned promise resolves.
 *
 * Because TanStack Query keeps `mutation.isPending = true` until the
 * `mutationFn` promise settles, any dialog that binds its loading indicator
 * to `isPending` will keep showing the spinner until the fresh data is ready.
 *
 * @example
 * ```ts
 * const mutation = useMutation({
 *   mutationFn: withRefresh(
 *     (comment?: string) => completeStep(executionId, stepId, orgId, comment),
 *     queryClient,
 *     () => [['document-content', fileId], ['document', fileId]],
 *   ),
 *   onSuccess: () => setDialogOpen(false),   // data is already fresh here
 * });
 * ```
 */
export function withRefresh<TVariables, TResult>(
  fn: (variables: TVariables) => Promise<TResult>,
  queryClient: QueryClient,
  queryKeys: () => QueryKey[],
): (variables: TVariables) => Promise<TResult> {
  return async (variables: TVariables) => {
    const result = await fn(variables);
    await Promise.all(
      queryKeys().map((key) => queryClient.refetchQueries({ queryKey: key })),
    );
    return result;
  };
}
