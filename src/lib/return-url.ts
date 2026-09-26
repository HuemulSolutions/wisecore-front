/**
 * Única fuente de verdad de `sessionStorage.returnUrl` (la ruta a la que volver
 * tras el login o tras recuperar la sesión).
 *
 * Antes se escribía y leía en cinco lugares sin sanear (riesgo documentado en
 * `ia context/rbac-audit-guide.md`: un `returnUrl` con host externo era un open
 * redirect). Ahora solo se aceptan rutas relativas al frontend.
 */
const KEY = 'returnUrl'

// Empieza con "/" pero no con "//" ni "/\" (redirect a otro host), sin esquema.
const RELATIVE_PATH = /^\/(?![/\\])[^\s]*$/

/**
 * Devuelve la ruta si es relativa y segura; `null` en cualquier otro caso
 * (`//evil.com`, `https://…`, `javascript:…`, `..`, vacío).
 */
export function sanitizeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  const candidate = String(raw).trim()
  if (!RELATIVE_PATH.test(candidate)) return null
  const pathOnly = candidate.split(/[?#]/, 1)[0]
  if (pathOnly.includes(':') || pathOnly.split('/').includes('..')) return null
  return candidate
}

/** Rutas que no vale la pena recordar (son el destino por defecto). */
const IGNORED_PATHS = new Set(['/', '/home', '/login'])

export function saveReturnUrl(path: string | null | undefined): void {
  const safe = sanitizeReturnPath(path)
  if (!safe) return
  const pathOnly = safe.split(/[?#]/, 1)[0]
  if (IGNORED_PATHS.has(pathOnly) || pathOnly.startsWith('/auth/')) return
  try {
    sessionStorage.setItem(KEY, safe)
  } catch {
    /* storage no disponible (modo privado): la vuelta será a /home */
  }
}

export function peekReturnUrl(): string | null {
  try {
    return sanitizeReturnPath(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

/** Lee y borra. Devuelve `null` si no había una ruta válida. */
export function consumeReturnUrl(): string | null {
  const value = peekReturnUrl()
  clearReturnUrl()
  return value
}

export function clearReturnUrl(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

// Las organizaciones se identifican por UUID en el primer segmento de la ruta.
const ORG_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `true` si la ruta es de una organización distinta de `organizationId`
 * (`/<otraOrg>/...`). Las rutas sin organización (`/home`, `/settings`) no lo son.
 * Tras un cambio de organización, navegar a una ruta de la anterior hace que la
 * sincronización URL↔contexto de `AppLayout` vuelva a seleccionarla.
 */
export function pathBelongsToOtherOrg(path: string | null | undefined, organizationId: string): boolean {
  if (!path) return false
  const firstSegment = path.split(/[?#]/, 1)[0].split('/')[1] ?? ''
  return ORG_SEGMENT.test(firstSegment) && firstSegment.toLowerCase() !== organizationId.toLowerCase()
}

/** Ruta actual del navegador (pathname + search) para guardar como vuelta. */
export function currentPath(): string {
  return window.location.pathname + window.location.search
}
