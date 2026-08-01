/** Return the best display label for an execution: version_major.minor.patch first, then version, then name. */
export function getExecutionDisplayLabel(
  execution: {
    version?: string | null
    version_major?: number | null
    version_minor?: number | null
    version_patch?: number | null
    name?: string
  } | null | undefined
): string {
  if (!execution) return '';
  if (execution.version_major != null) {
    return `v${execution.version_major}.${execution.version_minor ?? 0}.${execution.version_patch ?? 0}`;
  }
  if (execution.version) return `v${execution.version}`;
  return execution.name || '';
}
