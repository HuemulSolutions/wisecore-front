"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Plus, Shield, X } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PanelCard,
  PanelDirtyBadge,
  PanelIconButton,
  PanelPillButton,
} from "@/components/assets-types/assets-types-lifecycle-ui"
import { SectionFormFieldDependencyEditor } from "@/components/sections/section-form-field-dependency-editor"
import { sectionHasValidDependencies } from "@/components/sections/validate-form-field-dependencies"
import { QUESTION_TYPE } from "@/components/sections/question-type-meta"
import {
  buildTemplateSectionUpdatePayload,
  type TemplateSectionSnapshot,
} from "@/components/sections/build-template-section-update-payload"
import { getTemplateById } from "@/services/templates"
import { updateTemplateSection } from "@/services/template_section"
import { handleApiError } from "@/lib/error-utils"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { TemplateSectionConditionsProps } from "@/types/assets"
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core"

export type { TemplateSectionConditionsProps } from "@/types/assets"

/** Fila de la lista: una sección de la plantilla (misma forma que necesita el picker de
 * campos), más lo que exige el PUT completo de `template_section`. */
interface ConditionSection extends TemplateSectionSnapshot {
  /** Orden normalizado para ordenar la lista y filtrar targets. `order` conserva el valor
   * crudo del backend porque viaja en el PUT — no fabricar uno acá. */
  sortOrder: number
  depends_on?: FieldDependencyCondition[] | null
  show_when_inactive?: boolean
}

/** Merge de las claves *presentes* en `patch` sobre `base`: las que el backend no
 * devolvió (`undefined`) conservan el valor que ya tenía la sección cacheada. */
function mergeDefinedKeys(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) merged[key] = value
  }
  return merged
}

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
 * sección — con botón "Guardar" propio en la tarjeta, no automático — y no pasa por
 * el batch-save del footer del sheet.
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
  onSaved: (updatedSection: unknown) => void
  onRemoved: (sectionId: string) => void
}) {
  const { t } = useTranslation(["asset-types", "common"])
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""

  const [conditions, setConditions] = React.useState<FieldDependencyCondition[]>(section.depends_on ?? [])
  const [showWhenInactive, setShowWhenInactive] = React.useState(section.show_when_inactive ?? false)
  const [isDirty, setIsDirty] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Reflejar lo que llegue del servidor tras un refetch (otra pestaña, otro editor
  // de esta misma condición en sections-form.tsx) sin pisar una edición sin guardar.
  // Se reacciona al CAMBIO del valor del servidor, no a `isDirty`: si dependiera de
  // `isDirty`, el `setIsDirty(false)` de un guardado exitoso volvería a correr el
  // efecto con la sección todavía vieja del caché y vaciaría lo recién guardado.
  const serverSnapshot = JSON.stringify([section.depends_on ?? [], section.show_when_inactive ?? false])
  const lastServerSnapshot = React.useRef(serverSnapshot)
  const isDirtyRef = React.useRef(isDirty)
  isDirtyRef.current = isDirty
  React.useEffect(() => {
    if (serverSnapshot === lastServerSnapshot.current) return
    lastServerSnapshot.current = serverSnapshot
    if (isDirtyRef.current) return
    const [nextConditions, nextShowWhenInactive] = JSON.parse(serverSnapshot) as [
      FieldDependencyCondition[],
      boolean,
    ]
    setConditions(nextConditions)
    setShowWhenInactive(nextShowWhenInactive)
  }, [serverSnapshot])

  const handleChange = (nextConditions: FieldDependencyCondition[], nextShowWhenInactive: boolean) => {
    setConditions(nextConditions)
    setShowWhenInactive(nextShowWhenInactive)
    setIsDirty(true)
  }

  // El backend no valida field_id a nivel de sección (ver ia context/
  // dependencias-condicionales-formularios-guide.md §3.2), así que no se habilita el
  // guardado mientras el estado no sea válido: una condición a medio completar dejaría
  // la sección inactiva en silencio. El detalle del error ya se ve inline
  // (SectionFormFieldDependencyEditor lo calcula con las mismas reglas), y
  // sectionHasValidDependencies ignora las filas sin field_id — de ahí el every().
  const isComplete =
    conditions.every((c) => c.field_id.trim()) && sectionHasValidDependencies(conditions, availableFields)
  const canSave = canManage && isDirty && isComplete && !isSaving && !isRemoving

  const handleSave = async () => {
    if (!canSave) return
    setIsSaving(true)
    try {
      const updated = await updateTemplateSection(
        section.id,
        // El PUT de template_section no admite payload parcial (sin `name` responde 422;
        // solo con `name` + depends_on, 500): se reenvía la sección completa, igual que
        // sections-form.tsx en modo edit.
        buildTemplateSectionUpdatePayload(section, {
          depends_on: conditions.filter((c) => c.field_id.trim()),
          show_when_inactive: showWhenInactive,
        }),
        organizationId,
      )
      setIsDirty(false)
      onSaved(updated)
      toast.success(t("templates.conditions.saveSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("templates.conditions.saveError") })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!canManage || isRemoving) return
    // Tarjeta agregada en esta sesión y nunca persistida: se quita en local, sin PUT.
    // Se mira también el estado local porque el GET del template no devuelve
    // `depends_on`: sin eso, la X nunca limpiaría una condición ya guardada.
    if (!section.depends_on?.length && conditions.length === 0) {
      onRemoved(section.id)
      return
    }
    setIsRemoving(true)
    try {
      const updated = await updateTemplateSection(
        section.id,
        buildTemplateSectionUpdatePayload(section, { depends_on: [], show_when_inactive: false }),
        organizationId,
      )
      setIsDirty(false)
      onSaved(updated)
      onRemoved(section.id)
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("templates.conditions.saveError") })
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
          {isDirty && <PanelDirtyBadge label={t("templates.conditions.unsaved")} />}
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
          disabled={!canManage || isRemoving || isSaving}
        />
      </div>
      {canManage && (
        <div className="flex justify-end pt-2">
          <PanelPillButton
            icon={Check}
            label={isSaving ? t("common:saving") : t("common:save")}
            onClick={() => void handleSave()}
            disabled={!canSave}
            tone="primary"
          />
        </div>
      )}
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
      .map((section: TemplateSectionSnapshot, index: number) => ({
        ...section,
        sortOrder: section.order ?? index,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [templateData])

  // Targets del picker de campo: mismo criterio que sections-form.tsx
  // (sectionDependencyFields) — form_fields de secciones tipo form con order menor,
  // sin las preguntas puramente visuales (etiqueta/separador).
  const availableFieldsFor = React.useCallback(
    (targetOrder: number): SectionFormField[] =>
      sections
        .filter((s) => s.type === "form" && s.sortOrder < targetOrder)
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

  // El PUT devuelve la sección actualizada: se parchea el caché con ella en vez de
  // invalidar. `GET /templates/{id}` no devuelve `depends_on`/`show_when_inactive` en
  // sus secciones, así que un refetch borraría de la vista la condición recién
  // guardada. El merge es parcial y por clave presente: la respuesta del PUT es plana
  // (no trae `form_fields` ni `dependencies`) y esta misma query key la consume
  // TemplateSectionAccessMatrix — reemplazar la sección entera rompería el picker de
  // campos y la matriz de accesos.
  const handleSaved = React.useCallback(
    (updatedSection: unknown) => {
      const updated = updatedSection as (Partial<TemplateSectionSnapshot> & { id?: string }) | null
      if (!updated?.id) {
        void queryClient.invalidateQueries({ queryKey: ["template", templateId] })
        return
      }
      queryClient.setQueryData(["template", templateId], (prev: unknown) => {
        if (!prev || typeof prev !== "object") return prev
        const template = prev as Record<string, unknown>
        const key = Array.isArray(template.sections)
          ? "sections"
          : Array.isArray(template.template_sections)
            ? "template_sections"
            : null
        if (!key) return prev
        const patched = (template[key] as Record<string, unknown>[]).map((s) =>
          s.id === updated.id ? mergeDefinedKeys(s, updated as Record<string, unknown>) : s,
        )
        return { ...template, [key]: patched }
      })
    },
    [queryClient, templateId],
  )

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
                availableFields={availableFieldsFor(section.sortOrder)}
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
