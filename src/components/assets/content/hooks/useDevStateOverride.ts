/**
 * Previsualización de estados en desarrollo (no hay Storybook): lee un query param
 * (`?state=`, `?sourcesState=`, `?banner=`) y devuelve el valor si es válido. Fuera de
 * `import.meta.env.DEV` siempre devuelve `null`, así que en producción no tiene efecto.
 *
 * Lee `window.location.search` (no `useSearchParams`) para no exigir un Router en quien lo use;
 * el valor se lee en cada render, suficiente para una herramienta de desarrollo.
 *
 * Ejemplo: `/asset/<id>?state=importFailed`.
 */
export function useDevStateOverride<T extends string>(
  param: string,
  isValid: (value: unknown) => value is T,
  enabled: boolean = import.meta.env.DEV,
): T | null {
  if (!enabled || typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(param);
  return isValid(value) ? value : null;
}
