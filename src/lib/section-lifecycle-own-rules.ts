import type { SectionAccessByStep, SectionRoleAccessByStep } from "@/hooks/useTemplateSectionLifecycleAccess"

/**
 * Una sección con al menos una fila configurada (global o por rol, en
 * cualquier step) deja de heredar el permiso del documento en TODAS sus
 * celdas, incluidas las que quedaron sin configurar — ver
 * ia context/permisos-seccion-lifecycle-guide.md §1.
 *
 * Extraído de `assets-types-template-sections-matrix.tsx` (donde vivía como
 * `useCallback` local no exportado) para reusarlo desde la pestaña
 * "Estructura" de plantillas sin duplicar la lógica.
 */
export function sectionHasOwnRules(
  accessBySection: ReadonlyMap<string, SectionAccessByStep>,
  roleAccessBySection: ReadonlyMap<string, SectionRoleAccessByStep>,
  sectionId: string,
): boolean {
  const accessByStep = accessBySection.get(sectionId)
  const roleAccessByStep = roleAccessBySection.get(sectionId)
  return (
    (accessByStep?.size ?? 0) > 0 ||
    [...(roleAccessByStep?.values() ?? [])].some((byRole) => byRole.size > 0)
  )
}
