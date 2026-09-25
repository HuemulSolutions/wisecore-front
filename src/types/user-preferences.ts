/**
 * Endpoint genérico de preferencias de usuario — blob JSON opaco por clave,
 * scope usuario × organización (X-Org-Id). Ver
 * `ia context/persistencia-estado-ui-guide.md` para cuándo usar esto en vez
 * de un hook simple con localStorage.
 */
export interface UserPreference<T = unknown> {
  key: string
  value: T
  updated_at: string
}

export interface UserPreferenceResponse<T = unknown> {
  data: UserPreference<T>
}

export interface SetUserPreferenceRequest<T = unknown> {
  value: T
}

/** Claves conocidas. El backend acepta cualquier string no vacío (hasta 200 chars). */
export type UserPreferenceKey =
  | 'tree-expanded'
  | 'external-systems-tree-expanded'
  | 'tree-remember-expanded'
  | 'media-view-mode'
  | 'language'

/**
 * Shape de `value` para `tree-expanded` (carpetas abiertas en la biblioteca
 * de activos — compartida por el sidebar de `/asset` y los pickers de
 * activos) y para `external-systems-tree-expanded` (misma shape, sistemas
 * expandidos en `/external-systems`, clave propia). Ver
 * ia context/arbol-biblioteca-activos-guide.md.
 */
export interface TreeExpandedPreference {
  expanded: string[]
}

/** Shape de `value` para `tree-remember-expanded` (switch del sheet de Preferencias). */
export interface TreeRememberExpandedPreference {
  enabled: boolean
}

/** Shape de `value` para `media-view-mode` (modo de vista por defecto de las galerías de media). */
export interface MediaViewModePreference {
  mode: 'grid' | 'list'
}

/** Shape de `value` para `language` — scope usuario × organización: puede diferir entre orgs. */
export interface LanguagePreference {
  language: 'en' | 'es'
}
