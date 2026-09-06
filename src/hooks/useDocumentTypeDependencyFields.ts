import { useCallback, useMemo, useRef } from "react"
import { useQueries } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { useDocumentTypeTemplates } from "@/hooks/useAssetTypes"
import { getTemplateById } from "@/services/templates"
import { QUESTION_TYPE } from "@/components/sections/question-type-meta"
import type { SectionFormField } from "@/types/sections/core"
import type { TemplateSectionSnapshot } from "@/components/sections/build-template-section-update-payload"

interface TemplateFormFieldsResult {
  templateId: string
  templateName: string
  fields: SectionFormField[]
}

/**
 * Campos de formulario disponibles para condicionar un `LifecycleStep`, agregados
 * de TODAS las plantillas vinculadas al tipo de activo — a diferencia del
 * `depends_on` de sección/pregunta, acá no hay "sección anterior" contra la cual
 * filtrar: el step vive en el document_type, no en la secuencia de una plantilla.
 *
 * Un `field_id` solo existe de verdad si la plantilla que efectivamente se usó
 * para crear el documento lo tiene (ver aviso del backend en el spec de
 * `depends_on` de LifecycleStep). Con más de una plantilla vinculada, un campo
 * presente en solo algunas deja el step inaplicable en silencio para los
 * documentos creados con las que no lo tienen — `presenceByFieldId` es lo que
 * permite advertir eso en el picker (ver `fieldWarningFor` de
 * `SectionFormFieldDependencyEditor`, consumido en
 * `assets-types-lifecycle-step-conditions.tsx`).
 *
 * Mismo criterio que `availableFieldsFor` en
 * `assets-types-template-section-conditions.tsx` y `sectionDependencyFields` en
 * `sections-form.tsx`: solo secciones `type === "form"`, sin las preguntas
 * puramente visuales (`etiqueta`). Comparte query key (`["template", templateId]`)
 * con esos dos puntos de entrada — no duplica el fetch de plantilla.
 */
export function useDocumentTypeDependencyFields(documentTypeId: string, enabled: boolean = true) {
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""

  const {
    data: linkedTemplatesData,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
    refetch: refetchLinkedTemplates,
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

  const perTemplate = useMemo<TemplateFormFieldsResult[]>(() => {
    return linkedTemplates.map((lt, index) => {
      const templateData = templateQueries[index]?.data as
        | { sections?: TemplateSectionSnapshot[]; template_sections?: TemplateSectionSnapshot[] }
        | undefined
      const sections = templateData?.sections ?? templateData?.template_sections ?? []
      const fields = sections
        .filter((s) => s.type === "form")
        .flatMap((s) => s.form_fields ?? [])
        .filter((f) => f.question_type !== QUESTION_TYPE.label)
      return { templateId: lt.template_id, templateName: lt.template_name, fields }
    })
    // `templateQueries` no es una dependencia estable (nueva referencia en cada
    // render de useQueries) — se deriva de sus `.data`, que sí lo son.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedTemplates, ...templateQueries.map((q) => q.data)])

  const templateCount = linkedTemplates.length

  const { fields, presenceByFieldId, templateNames } = useMemo(() => {
    const byId = new Map<string, SectionFormField>()
    const presence = new Map<string, Set<string>>()
    const names = new Map<string, string>()

    for (const t of perTemplate) {
      names.set(t.templateId, t.templateName)
      for (const f of t.fields) {
        if (!byId.has(f.field_id)) byId.set(f.field_id, f)
        if (!presence.has(f.field_id)) presence.set(f.field_id, new Set())
        presence.get(f.field_id)!.add(t.templateId)
      }
    }

    // Campos completos (presentes en todas las plantillas vinculadas) primero —
    // el picker los ofrece antes que los parciales.
    const sorted = Array.from(byId.values()).sort((a, b) => {
      const aComplete = (presence.get(a.field_id)?.size ?? 0) === templateCount
      const bComplete = (presence.get(b.field_id)?.size ?? 0) === templateCount
      if (aComplete === bComplete) return 0
      return aComplete ? -1 : 1
    })

    return { fields: sorted, presenceByFieldId: presence, templateNames: names }
  }, [perTemplate, templateCount])

  // Identidad estable (deps `[]`): el `refetch` inline anterior se recreaba en
  // cada render, lo que podía romper cualquier consumidor que dependa de su
  // referencia (p. ej. un `useCallback`/`useEffect` con `refetch` en las deps
  // reaccionando en cada render — causa exacta del loop infinito que tuvo
  // `LifecycleStepConditions` antes del fix). El ref siempre lee las queries
  // más recientes sin cambiar la identidad de la función publicada.
  const refetchRef = useRef<() => void>(() => {})
  refetchRef.current = () => {
    void refetchLinkedTemplates()
    templateQueries.forEach((q) => void q.refetch())
  }
  const refetch = useCallback(() => refetchRef.current(), [])

  return {
    fields,
    presenceByFieldId,
    templateNames,
    templateCount,
    isLoading: isLoadingLinks || isLoadingTemplates,
    isError: isErrorTemplates,
    refetch,
  }
}
