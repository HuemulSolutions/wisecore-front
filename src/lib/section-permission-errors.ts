import { isErrorCode } from '@/lib/error-utils'

export const SECTION_LIFECYCLE_PERMISSION_DENIED = 'SECTION_LIFECYCLE_PERMISSION_DENIED'
export const LIFECYCLE_PERMISSION_DENIED = 'LIFECYCLE_PERMISSION_DENIED'

/**
 * El backend rechazó la escritura porque el usuario ya no tiene `edit` sobre
 * esta sección: `SECTION_LIFECYCLE_PERMISSION_DENIED` (la sección tiene filas
 * propias de `template_section_lifecycle_access` y ninguna le da acceso) o
 * `LIFECYCLE_PERMISSION_DENIED` (cayó al permiso de documento y tampoco lo
 * tiene ahí). El front puede tener el botón habilitado por estado stale — usar
 * junto con una invalidación de `document-content` para que la UI se
 * autocorrija a solo lectura en vez de quedar en un loop de reintento inútil.
 */
export function isSectionPermissionDeniedError(error: unknown): boolean {
  return isErrorCode(error, SECTION_LIFECYCLE_PERMISSION_DENIED) || isErrorCode(error, LIFECYCLE_PERMISSION_DENIED)
}
