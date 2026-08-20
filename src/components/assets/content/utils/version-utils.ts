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

/** Solo el número `major.minor.patch`, sin el prefijo `v` — null cuando la ejecución no trae numeración (nombre libre). */
export function getExecutionVersionNumber(
  execution: { version_major?: number | null; version_minor?: number | null; version_patch?: number | null } | null | undefined
): string | null {
  if (!execution || execution.version_major == null) return null;
  return `${execution.version_major}.${execution.version_minor ?? 0}.${execution.version_patch ?? 0}`;
}

/**
 * Label compacto para UI sin monoespaciada: `v1.0.7` cuando hay numeración, o el nombre libre
 * tal cual cuando no la hay — a diferencia de `getExecutionDisplayLabel`, nunca antepone una
 * `v` a un nombre libre (evita el falso "vUltima version").
 */
export function getExecutionCompactLabel(
  execution: {
    version?: string | null
    version_major?: number | null
    version_minor?: number | null
    version_patch?: number | null
    name?: string
  } | null | undefined
): string {
  if (!execution) return '';
  const number = getExecutionVersionNumber(execution);
  if (number != null) return `v${number}`;
  return execution.version || execution.name || '';
}
