/** Return the best display label for an execution: version first, then name. */
export function getExecutionDisplayLabel(
  execution: { version?: string | null; name?: string } | null | undefined
): string {
  if (!execution) return '';
  if (execution.version) return `v${execution.version}`;
  return execution.name || '';
}
