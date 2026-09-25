import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useDocumentTypeTemplates } from "@/hooks/useAssetTypes"
import { getTemplateById } from "@/services/templates"
import type { TemplateSectionSnapshot } from "@/components/sections/build-template-section-update-payload"

export interface DocumentTypeFormSectionOption {
  id: string
  name: string
  order: number
  templateId: string
  templateName: string
}

/**
 * TemplateSections de tipo formulario (`type === "form"`) de TODAS las
 * plantillas vinculadas al tipo de activo — para elegir el blueprint de
 * `new_section_template_section_id` de una `LifecycleElaborationConfig`: el
 * backend clona los `form_fields` de la sección elegida para armar las
 * secciones que la elaboración crea con acción `add`.
 *
 * Mismo recorrido que `useDocumentTypeDependencyFields` (documentTypeId →
 * plantillas vinculadas → `getTemplateById` por cada una), comparte la query
 * key `["template", templateId]` con ese hook, con
 * `assets-types-template-section-conditions.tsx` y con la matriz de secciones
 * — no duplica el fetch de plantilla. A diferencia de aquel, acá el resultado
 * son las SECCIONES (no los campos): un `new_section_template_section_id` es
 * un id de sección, no de campo.
 *
 * Con más de una plantilla vinculada, dos secciones con el mismo nombre en
 * plantillas distintas son ids distintos — `templateName` se expone para que
 * el selector las distinga (agrupar o prefijar), nunca para deduplicar.
 */
export function useDocumentTypeFormSections(
  documentTypeId: string,
  organizationId: string,
  enabled: boolean = true,
) {
  const {
    data: linkedTemplatesData,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useDocumentTypeTemplates(documentTypeId, enabled)
  const linkedTemplates = linkedTemplatesData?.data ?? []

  const templateQueries = useQueries({
    queries: linkedTemplates.map((lt) => ({
      queryKey: ["template", lt.template_id],
      queryFn: () => getTemplateById(lt.template_id, organizationId),
      enabled: enabled && !!organizationId && !!lt.template_id,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoadingTemplates = templateQueries.some((q) => q.isLoading)
  const isErrorTemplates = isErrorLinks || templateQueries.some((q) => q.isError)

  const sections = useMemo<DocumentTypeFormSectionOption[]>(() => {
    return linkedTemplates.flatMap((lt, index) => {
      const templateData = templateQueries[index]?.data as
        | { sections?: TemplateSectionSnapshot[]; template_sections?: TemplateSectionSnapshot[] }
        | undefined
      const raw = templateData?.sections ?? templateData?.template_sections ?? []
      return raw
        .filter((s) => s.type === "form")
        .map((s) => ({
          id: s.id,
          name: s.name,
          order: s.order ?? 0,
          templateId: lt.template_id,
          templateName: lt.template_name,
        }))
    })
    // `templateQueries` no es una dependencia estable (nueva referencia en cada
    // render de useQueries) — se deriva de sus `.data`, que sí lo son.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedTemplates, ...templateQueries.map((q) => q.data)])

  return {
    sections,
    templateCount: linkedTemplates.length,
    isLoading: isLoadingLinks || isLoadingTemplates,
    isError: isErrorTemplates,
  }
}
