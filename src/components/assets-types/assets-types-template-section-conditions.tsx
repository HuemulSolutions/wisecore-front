"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Shield, X } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelCard, PanelIconButton } from "@/components/assets-types/assets-types-lifecycle-ui"
import { SectionFormFieldDependencyEditor } from "@/components/sections/section-form-field-dependency-editor"
import { sectionHasValidDependencies } from "@/components/sections/validate-form-field-dependencies"
import { QUESTION_TYPE } from "@/components/sections/question-type-meta"
import { getTemplateById } from "@/services/templates"
import { updateTemplateSection } from "@/services/template_section"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { TemplateSectionConditionsProps } from "@/types/assets"
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core"

export type { TemplateSectionConditionsProps } from "@/types/assets"

/** Fila de la lista: una sección de la plantilla (misma forma que necesita el picker de campos). */
interface ConditionSection {
  id: string
  name: string
  order: number
  type?: string
  form_fields?: SectionFormField[]
  depends_on?: FieldDependencyCondition[] | null
  show_when_inactive?: boolean
}

const SAVE_DEBOUNCE_MS = 500

/** Chip "Sección" — mismo acento morado que ya usa el módulo para secciones (ver
 * ACCESS_STYLE.edit en assets-types-template-sections-matrix.tsx y el ícono FileText
 * en assets-types-templates-panel.tsx). No hay chip compartido para esto en
 * assets-types-lifecycle-ui.tsx (StepModeBadge es gris, para "Manual"/"Automático"). */
function SectionChip() {
  const { t } = useTranslation("asset-types")
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#f3f0ff] px-2 text-[11px] font-medium text-[#6d5ae0]">
      {t("templates.conditions.sectionChip")}
    </span>
  )
}

/**
 * Tarjeta de condición de UNA sección: chip + nombre + botón quitar, y el editor de
 * condiciones reusado tal cual del dominio de secciones (mismo dato que
 * sections-form.tsx, un segundo punto de entrada). El guardado es directo por
 * sección (igual que TemplateSectionAccessMatrix), no pasa por el batch-save del
 * footer del sheet.
 */
function SectionConditionCard({
  section,
  availableFields,
  canManage,
  onSaved,
  onRemoved,
}: {
  section: ConditionSection
  availableFields: SectionFormField[]
  canManage: boolean
  onSaved: () => void
  onRemoved: (sectionId: string) => void
}) {
  const { t } = useTranslation("asset-types")
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""

  const [conditions, setConditions] = React.useState<FieldDependencyCondition[]>(section.depends_on ?? [])
  const [showWhenInactive, setShowWhenInactive] = React.useState(section.show_when_inactive ?? false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Reflejar lo que llegue del servidor tras un refetch (otra pestaña, otro editor
  // de esta misma condición en sections-form.tsx) sin pisar una edición en curso.
  const pendingRef = React.useRef(false)
  React.useEffect(() => {
    if (pendingRef.current) return
    setConditions(section.depends_on ?? [])
    setShowWhenInactive(section.show_when_inactive ?? false)
  }, [section.depends_on, section.show_when_inactive])

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const persist = React.useCallback(
    async (nextConditions: FieldDependencyCondition[], nextShowWhenInactive: boolean) => {
      setIsSaving(true)
      pendingRef.current = true
      try {
        await updateTemplateSection(
          section.id,
          // `name` es requerido por UpdateTemplateSection aunque el PUT sea parcial
          // (el resto de campos planos se conservan si no viajan): sin él responde 422.
          { name: section.name, depends_on: nextConditions, show_when_inactive: nextShowWhenInactive },
          organizationId,
        )
        onSaved()
      } catch {
        toast.error(t("templates.conditions.saveError"))
      } finally {
        setIsSaving(false)
        pendingRef.current = false
      }
    },
    [section.id, organizationId, onSaved, t],
  )

  const handleChange = (nextConditions: FieldDependencyCondition[], nextShowWhenInactive: boolean) => {
    setConditions(nextConditions)
    setShowWhenInactive(nextShowWhenInactive)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    // El backend no valida field_id a nivel de sección (ver ia context/
    // dependencias-condicionales-formularios-guide.md §3.2) — no dispara el PUT
    // mientras el estado no sea válido, para no dejar la sección inactiva en
    // silencio por una condición a medio completar. El error ya se ve inline
    // (SectionFormFieldDependencyEditor lo calcula con las mismas reglas).
    if (!sectionHasValidDependencies(nextConditions, availableFields)) return
    debounceRef.current = setTimeout(() => {
      void persist(nextConditions, nextShowWhenInactive)
    }, SAVE_DEBOUNCE_MS)
  }

  const handleRemove = async () => {
    if (!canManage || isRemoving) return
    setIsRemoving(true)
    try {
      await updateTemplateSection(
        section.id,
        { name: section.name, depends_on: [], show_when_inactive: false },
        organizationId,
      )
      onSaved()
      onRemoved(section.id)
    } catch {
      toast.error(t("templates.conditions.saveError"))
      setIsRemoving(false)
    }
  }

  return (
    <PanelCard className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <SectionChip />
          <span className="truncate text-[13px] font-medium text-[#0f172a]" title={section.name}>
            {section.name}
          </span>
          {isSaving && <Loader2 className="size-3.5 shrink-0 animate-spin text-[#94a3b8]" />}
        </div>
        {canManage && (
          <PanelIconButton
            icon={X}
            label={t("templates.conditions.removeBlock", { name: section.name })}
            onClick={handleRemove}
            disabled={isRemoving}
            tone="danger"
          />
        )}
      </div>
      <p className="pt-2 text-[11px] leading-snug text-[#94a3b8]">{t("templates.conditions.sectionHint")}</p>
      <div className="pt-2">
        <SectionFormFieldDependencyEditor
          ownFieldId=""
          instanceId={`template-section-${section.id}`}
          conditions={conditions}
          showWhenInactive={showWhenInactive}
          availableFields={availableFields}
          onChange={handleChange}
          disabled={!canManage || isRemoving}
        />
      </div>
    </PanelCard>
  )
}

/**
 * Bloque "Condiciones" de la pestaña Plantillas en la configuración de un tipo de
 * activo: lista, por sección de la plantilla, la condición que la oculta/deshabilita
 * (mismo `depends_on`/`show_when_inactive` de TemplateSection que ya se edita en
 * sections-form.tsx) — un punto de entrada centralizado en vez de tener que abrir
 * cada sección una por una. Persiste al instante por sección, igual que
 * TemplateSectionAccessMatrix; no participa del batch-save del footer del sheet.
 */
export function TemplateSectionConditions({ templateId, enabled = true }: TemplateSectionConditionsProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""
  const { canUpdate, hasAnyPermission } = useUserPermissions()

  const canReadSections = hasAnyPermission(["template_section:r", "template_section:l"])
  const canManage = canUpdate("template_section")
  const queryEnabled = enabled && !!organizationId && !!templateId && canReadSections

  const { data: templateData, isLoading } = useQuery({
    // Misma query key que TemplateSectionAccessMatrix: no duplica el fetch, y
    // ambas superficies quedan al día con la misma invalidación.
    queryKey: ["template", templateId],
    queryFn: () => getTemplateById(templateId, organizationId),
    enabled: queryEnabled,
    retry: false,
  })

  const sections = React.useMemo<ConditionSection[]>(() => {
    const raw: unknown = templateData?.sections ?? templateData?.template_sections ?? []
    if (!Array.isArray(raw)) return []
    return raw
      .map((section: ConditionSection, index: number) => ({ ...section, order: section.order ?? index }))
      .sort((a, b) => a.order - b.order)
  }, [templateData])

  // Targets del picker de campo: mismo criterio que sections-form.tsx
  // (sectionDependencyFields) — form_fields de secciones tipo form con order menor,
  // sin las preguntas puramente visuales (etiqueta/separador).
  const availableFieldsFor = React.useCallback(
    (targetOrder: number): SectionFormField[] =>
      sections
        .filter((s) => s.type === "form" && s.order < targetOrder)
        .flatMap((s) => s.form_fields ?? [])
        .filter((f) => f.question_type !== QUESTION_TYPE.label),
    [sections],
  )

  // Tarjetas visibles: arrancan con las secciones que ya tienen depends_on, más las
  // que el usuario fue agregando en esta sesión — para que una tarjeta recién
  // creada con 0 condiciones no desaparezca (no hay depends_on aún, así que no
  // sobrevive a un refetch por su cuenta).
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set())
  const visibleSectionIds = React.useMemo(() => {
    const ids = new Set(addedIds)
    for (const s of sections) {
      if (s.depends_on && s.depends_on.length > 0) ids.add(s.id)
    }
    return ids
  }, [sections, addedIds])

  const visibleSections = sections.filter((s) => visibleSectionIds.has(s.id))
  const addableSections = sections.filter((s) => !visibleSectionIds.has(s.id))

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerValue, setPickerValue] = React.useState("")

  const handleAdd = () => {
    if (!pickerValue) return
    setAddedIds((prev) => new Set(prev).add(pickerValue))
    setPickerValue("")
    setPickerOpen(false)
  }

  const handleSaved = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["template", templateId] })
  }, [queryClient, templateId])

  const handleRemoved = React.useCallback((sectionId: string) => {
    setAddedIds((prev) => {
      if (!prev.has(sectionId)) return prev
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
  }, [])

  if (!canReadSections) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e5eaf0] bg-white py-10 text-center">
        <Shield className="size-8 text-[#cbd5e1]" />
        <p className="text-[13px] text-[#64748b]">{t("templates.conditions.accessDenied")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-[#64748b]">{t("templates.conditions.hint")}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-[10px]" />
          <Skeleton className="h-16 w-full rounded-[10px]" />
        </div>
      ) : sections.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">{t("templates.conditions.noSections")}</p>
      ) : (
        <>
          {visibleSections.length === 0 && (
            <p className="px-1 py-2 text-[12px] text-[#94a3b8]">{t("templates.conditions.noConditionsYet")}</p>
          )}
          <div className="flex flex-col gap-2">
            {visibleSections.map((section) => (
              <SectionConditionCard
                key={section.id}
                section={section}
                availableFields={availableFieldsFor(section.order)}
                canManage={canManage}
                onSaved={handleSaved}
                onRemoved={handleRemoved}
              />
            ))}
          </div>
        </>
      )}

      {canManage && sections.length > 0 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={addableSections.length === 0}
              title={addableSections.length === 0 ? t("templates.conditions.noSectionsToAdd") : undefined}
              className="inline-flex h-[30px] w-fit items-center gap-1.5 rounded-[8px] border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Plus className="size-3.5" />
              {t("templates.conditions.addCondition")}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-semibold text-[#334155]">
                {t("templates.conditions.addConditionTitle")}
              </span>
              <HuemulField
                type="select"
                label={t("templates.conditions.selectSection")}
                name="template-section-conditions-new-section"
                value={pickerValue}
                options={addableSections.map((s) => ({ value: s.id, label: s.name }))}
                placeholder={t("templates.conditions.selectSectionPlaceholder")}
                onChange={(value) => setPickerValue(String(value ?? ""))}
              />
              <button
                type="button"
                disabled={!pickerValue}
                onClick={handleAdd}
                className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#2563eb] px-3 text-[12.5px] font-medium text-white transition-colors hover:cursor-pointer hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("templates.conditions.addCondition")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
