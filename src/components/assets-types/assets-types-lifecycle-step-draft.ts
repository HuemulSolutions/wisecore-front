import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  useAllLifecycleSteps,
  useLifecycleMutations,
  useLifecycleSlaUnits,
  useLifecycleAccessRuleTypes,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import {
  stepRoleIds,
  buildAccessPayload,
  pipelineIndex,
  isGroupableStepType,
  lifecycleStepCapabilities,
  ownerCanExecute as accessTypeOwnerCanExecute,
} from "@/lib/lifecycle-access"
import { handleApiError, isErrorCode } from "@/lib/error-utils"
import type { LifecycleStepDraftData, UseLifecycleStepDraftOptions } from "@/types/assets"
import type { CreateLifecycleStepData, LifecycleStep, UpdateLifecycleStepData } from "@/types/lifecycle"

function emptyDraft(positionIndex = 0): LifecycleStepDraftData {
  return {
    name: "",
    mode: "manual",
    hasSla: false,
    slaValue: "",
    slaUnit: "",
    accessType: "all",
    ownerCanExecute: true,
    roleIds: [],
    roleNames: {},
    accessRules: [],
    positionIndex,
  }
}

function stepToDraft(step: LifecycleStep, positionIndex: number): LifecycleStepDraftData {
  return {
    name: step.name ?? "",
    mode: step.mode ?? "manual",
    hasSla: step.sla_value != null,
    slaValue: step.sla_value != null ? String(step.sla_value) : "",
    slaUnit: step.sla_unit ?? "",
    accessType: step.access_type,
    ownerCanExecute: accessTypeOwnerCanExecute(step.access_type),
    // Roles vigentes: un step `all`/`owner` no debe arrastrar los residuales
    // que el backend haya dejado (ver `stepRoleIds`).
    roleIds: stepRoleIds(step),
    roleNames: Object.fromEntries(step.step_roles.map((r) => [r.role_id, r.role_name ?? r.role_id])),
    accessRules: (step.access_rules ?? []).map((r) => ({ rule_type: r.rule_type, source_step_id: r.source_step_id })),
    positionIndex,
  }
}

function sameDraft(a: LifecycleStepDraftData, b: LifecycleStepDraftData): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Borrador de UN step del ciclo de vida — mono-entidad. Reemplaza el estado
 * multi-tarjeta de `EditStepContent`/`CreateStepContent`: cubre edición de un
 * grupo existente, edición de una etapa simple y alta de un grupo nuevo, todo
 * con el mismo contrato `save`/`discard`/`isDirty` de
 * ia context/sheet-footer-batch-save-guide.md.
 *
 * La posición (`order`) se guarda como índice destino ABSOLUTO
 * (`draft.positionIndex`), no como delta ni como array reordenado: un
 * reintento tras un fallo parcial recalcula siempre "ponerme en la posición
 * k" contra la lista más fresca del servidor, así que es idempotente. Al
 * guardar, primero se persiste este step con su nuevo `order` (fase A) y
 * después SOLO `{ order }` de los hermanos afectados (fase B) — nunca su
 * payload completo, para no pisar un toggle concurrente de la matriz.
 */
export function useLifecycleStepDraft({
  documentTypeId,
  target,
  enabled,
  organizationId,
  fallbackGroupName,
  saveErrorMessage,
  savedSuccessMessage,
  onCreated,
}: UseLifecycleStepDraftOptions) {
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate("asset_type")

  const { data, isLoading, isFetching } = useAllLifecycleSteps(documentTypeId, enabled)
  const { data: rolesData } = useRoles(enabled, 1, 1000)
  const { data: slaUnitsData } = useLifecycleSlaUnits(enabled)
  const { data: accessRuleTypesData } = useLifecycleAccessRuleTypes(enabled)
  const { updateStep, createStep, deleteStep } = useLifecycleMutations(documentTypeId, null)

  const allSteps = useMemo(() => data?.data?.steps ?? [], [data])
  const allRoles = useMemo(() => rolesData?.data ?? [], [rolesData])
  const slaUnitOptions = useMemo(
    () => (slaUnitsData?.data ?? []).map((u) => ({ value: u.value, label: u.label })),
    [slaUnitsData],
  )
  const accessRuleTypeOptions = useMemo(() => accessRuleTypesData?.data ?? [], [accessRuleTypesData])

  const step: LifecycleStep | null = useMemo(() => {
    if (!target) return null
    if (target.mode === "create") return null
    if (target.mode === "edit") return allSteps.find((s) => s.id === target.stepId) ?? null
    return allSteps.find((s) => s.type === target.stageType) ?? null
  }, [target, allSteps])

  const stageType = target ? (target.mode === "edit" ? step?.type ?? "" : target.stageType) : ""
  const capabilities = lifecycleStepCapabilities(stageType)
  const groupable = isGroupableStepType(stageType)

  const siblingsSorted = useMemo(
    () =>
      stageType
        ? allSteps.filter((s) => s.type === stageType).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],
    [allSteps, stageType],
  )
  const otherSiblingIds = useMemo(
    () => siblingsSorted.filter((s) => s.id !== step?.id).map((s) => s.id),
    [siblingsSorted, step],
  )
  const totalGroupCount = target?.mode === "create" ? siblingsSorted.length + 1 : siblingsSorted.length

  // `edit`: id real. `create`: no existe todavía — placeholder solo para
  // calcular el rank destino junto a los hermanos.
  const selfKey = target?.mode === "edit" ? step?.id ?? "__self__" : "__new__"

  const [draft, setDraft] = useState<LifecycleStepDraftData>(() => emptyDraft())
  const [touched, setTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const serverSnapshot = useMemo(() => {
    if (!step) return null
    const rank = siblingsSorted.findIndex((s) => s.id === step.id)
    return stepToDraft(step, rank === -1 ? 0 : rank)
  }, [step, siblingsSorted])

  const isDirty = target?.mode === "create" ? touched : serverSnapshot != null && !sameDraft(draft, serverSnapshot)

  // ── Hidratación ──────────────────────────────────────────────────────────
  // Nunca en modo alta: el primer `invalidateSteps` de cualquier toggle de la
  // matriz borraría el formulario a medio llenar (no hay nada del servidor
  // que hidratar todavía). En edición/etapa, rehidrata mientras no haya nada
  // local que pisar — excepción documentada a la regla 3 de
  // ia context/sheet-footer-batch-save-guide.md.
  useEffect(() => {
    if (target?.mode === "create") return
    if (!serverSnapshot || isDirty) return
    setDraft((prev) => (sameDraft(prev, serverSnapshot) ? prev : serverSnapshot))
  }, [serverSnapshot, isDirty, target?.mode])

  // Reset del borrador al cambiar de entidad (otra columna, otra etapa, o
  // abrir el alta). `touched` se limpia siempre; el valor inicial de
  // `positionIndex` en alta se corrige en el efecto de abajo apenas
  // resuelva la query (acá todavía puede estar en 0 por falta de datos).
  const targetKey = target ? `${target.mode}:${target.mode === "edit" ? target.stepId : target.stageType}` : null
  const lastTargetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (targetKey === lastTargetKeyRef.current) return
    lastTargetKeyRef.current = targetKey
    setTouched(false)
    setDeleteBlocked(false)
    setLastSavedAt(null)
    if (target?.mode === "create") {
      setDraft(emptyDraft(siblingsSorted.length))
    } else if (serverSnapshot) {
      setDraft(serverSnapshot)
    } else {
      setDraft(emptyDraft())
    }
    // Solo debe correr cuando cambia la identidad del target, no en cada
    // recálculo de `siblingsSorted`/`serverSnapshot` (eso lo cubre el efecto
    // de hidratación de arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey])

  // Alta: la posición por defecto es "al final", pero el conteo real de
  // hermanos solo se conoce cuando la query resuelve — se corrige acá sin
  // pisar una posición que el usuario ya haya elegido.
  useEffect(() => {
    if (target?.mode !== "create" || touched || isLoading) return
    setDraft((prev) => (prev.positionIndex === siblingsSorted.length ? prev : { ...prev, positionIndex: siblingsSorted.length }))
  }, [target?.mode, touched, isLoading, siblingsSorted.length])

  const updateDraft = useCallback((patch: Partial<LifecycleStepDraftData>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setTouched(true)
  }, [])

  // ── Posición: rank destino de este step + de sus hermanos ──────────────────
  const desiredRanks = useMemo(() => {
    const ids = [...otherSiblingIds]
    const insertAt = Math.min(Math.max(draft.positionIndex, 0), ids.length)
    ids.splice(insertAt, 0, selfKey)
    const ranks = new Map<string, number>()
    ids.forEach((id, i) => ranks.set(id, i + 1))
    return ranks
  }, [otherSiblingIds, draft.positionIndex, selfKey])

  const earlierStepOptions = useMemo(() => {
    if (!stageType) return []
    const crossType = allSteps.filter(
      (s) => s.type !== stageType && pipelineIndex(s.type) !== -1 && pipelineIndex(s.type) < pipelineIndex(stageType),
    )
    const selfRank = desiredRanks.get(selfKey) ?? 0
    const sameType = siblingsSorted.filter((s) => s.id !== step?.id && (desiredRanks.get(s.id) ?? 0) < selfRank)
    return [...crossType, ...sameType]
      .sort((a, b) => {
        const typeDiff = pipelineIndex(a.type) - pipelineIndex(b.type)
        if (typeDiff !== 0) return typeDiff
        return (desiredRanks.get(a.id) ?? a.order ?? 0) - (desiredRanks.get(b.id) ?? b.order ?? 0)
      })
      .map((s) => ({ value: s.id, label: s.name?.trim() || fallbackGroupName }))
  }, [allSteps, stageType, siblingsSorted, step, desiredRanks, selfKey, fallbackGroupName])

  // Mover el step antes del origen de una regla `step_actor_manager` propia
  // la invalidaría (mismo criterio que valida el backend) — se bloquea el
  // guardado en vez de dejar que el 4xx llegue sin explicación.
  const positionBreaksRule = useMemo(() => {
    if (!capabilities.hasPosition) return false
    const selfRank = desiredRanks.get(selfKey) ?? 0
    return draft.accessRules.some((rule) => {
      if (rule.rule_type !== "step_actor_manager" || !rule.source_step_id) return false
      const source = allSteps.find((s) => s.id === rule.source_step_id)
      if (!source || source.type !== stageType) return false
      return (desiredRanks.get(source.id) ?? 0) >= selfRank
    })
  }, [capabilities.hasPosition, desiredRanks, selfKey, draft.accessRules, allSteps, stageType])

  const positionOptions = useMemo(
    () => Array.from({ length: totalGroupCount }, (_, i) => ({ index: i, total: totalGroupCount })),
    [totalGroupCount],
  )

  const nameValid = !capabilities.editableName || draft.name.trim().length > 0
  const canSave =
    canManage &&
    !isSaving &&
    !positionBreaksRule &&
    nameValid &&
    (target?.mode === "create" ? true : isDirty)

  // ── Guardado ────────────────────────────────────────────────────────────
  // Reordenar hermanos: solo `{ order }`, nunca su payload completo — es lo
  // que permite bloquear únicamente ESTE step en la matriz (`lockedStepId`)
  // en vez de toda la etapa, sin arriesgarse a pisar un toggle concurrente.
  const persistSiblingRanks = useCallback(async () => {
    const currentRankById = new Map(siblingsSorted.map((s, i) => [s.id, i + 1]))
    for (const id of otherSiblingIds) {
      const desired = desiredRanks.get(id)
      if (desired != null && desired !== currentRankById.get(id)) {
        await updateStep.mutateAsync({ stepId: id, data: { order: desired } })
      }
    }
  }, [siblingsSorted, otherSiblingIds, desiredRanks, updateStep])

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!target || !canSave) return
    const isAutomatic = capabilities.hasModeSelector && draft.mode === "automatic"
    const selfRank = capabilities.hasPosition ? desiredRanks.get(selfKey) : undefined
    // `draft.accessType` ya llega derivado con `owner: false` cuando el step
    // no tiene toggle de propietario (`create`) — lo resuelve el tab de
    // Configuración al llamar `updateDraft`, mismo criterio que la matriz,
    // que pinta esa celda `n/a`.
    const accessPayload = buildAccessPayload({
      accessType: isAutomatic ? "owner" : draft.accessType,
      roleIds: isAutomatic ? [] : draft.roleIds,
    })

    try {
      if (target.mode === "create") {
        const payload: CreateLifecycleStepData = {
          type: target.stageType,
          name: capabilities.editableName ? draft.name.trim() || fallbackGroupName : undefined,
          mode: groupable ? (isAutomatic ? "automatic" : "manual") : undefined,
          order: selfRank,
          sla_value: capabilities.hasSla && !isAutomatic && draft.hasSla ? Number(draft.slaValue) || null : null,
          sla_unit: capabilities.hasSla && !isAutomatic && draft.hasSla ? draft.slaUnit || null : null,
          ...accessPayload,
          access_rules: draft.accessRules,
        }
        setIsSaving(true)
        const res = await createStep.mutateAsync(payload)
        if (capabilities.hasPosition) await persistSiblingRanks()
        setTouched(false)
        setLastSavedAt(new Date())
        toast.success(savedSuccessMessage)
        onCreated(res.data.id)
        return
      }

      if (!step) return
      const patch: UpdateLifecycleStepData = {
        name: capabilities.editableName ? draft.name.trim() || fallbackGroupName : undefined,
        mode: groupable ? (isAutomatic ? "automatic" : "manual") : undefined,
        order: selfRank,
        sla_value: capabilities.hasSla ? (!isAutomatic && draft.hasSla ? Number(draft.slaValue) || null : null) : undefined,
        sla_unit: capabilities.hasSla ? (!isAutomatic && draft.hasSla ? draft.slaUnit || null : null) : undefined,
        ...accessPayload,
        access_rules: draft.accessRules,
      }
      setIsSaving(true)
      await updateStep.mutateAsync({ stepId: step.id, data: patch })
      if (capabilities.hasPosition) await persistSiblingRanks()
      setLastSavedAt(new Date())
      toast.success(savedSuccessMessage)
    } catch (error) {
      handleApiError(error, { fallbackMessage: saveErrorMessage })
    } finally {
      setIsSaving(false)
    }
  }
  const save = useCallback(() => saveRef.current(), [])

  const discardRef = useRef<() => void>(() => {})
  discardRef.current = () => {
    if (target?.mode === "create") {
      setDraft(emptyDraft(siblingsSorted.length))
      setTouched(false)
    } else if (serverSnapshot) {
      setDraft(serverSnapshot)
    }
  }
  const discard = useCallback(() => discardRef.current(), [])

  const remove = useCallback(async () => {
    if (!step) return
    setDeleteBlocked(false)
    try {
      await deleteStep.mutateAsync(step.id)
    } catch (error) {
      if (isErrorCode(error, "LIFECYCLE_REQUIRED_STEP_MINIMUM")) {
        setDeleteBlocked(true)
      } else {
        handleApiError(error, { fallbackMessage: saveErrorMessage })
      }
      // Re-lanza: `HuemulAlertDialog` mantiene el diálogo abierto (sin pasar
      // por el estado "success") solo cuando `onAction` rechaza.
      throw error
    }
  }, [step, deleteStep, saveErrorMessage])

  // El step editado desapareció (borrado desde otra pestaña, o el propio
  // `remove()`): el sheet debe cerrarse, nunca quedar apuntando a un id
  // fantasma. Gateado por `data !== undefined` — en el primer render la
  // query todavía no resolvió y no hay que confundir "sin datos" con
  // "borrado".
  const stepMissing =
    target?.mode === "edit" && data !== undefined && !isFetching && !allSteps.some((s) => s.id === target.stepId)

  return {
    isLoading,
    isFetching,
    canManage,
    organizationId,
    documentTypeId,
    isCreateMode: target?.mode === "create",
    step,
    stageType,
    groupable,
    capabilities,
    draft,
    updateDraft,
    isDirty,
    touched,
    canSave,
    isSaving,
    save,
    discard,
    lastSavedAt,
    stepMissing,
    deleteBlocked,
    remove,
    isDeleting: deleteStep.isPending,
    allRoles,
    slaUnitOptions,
    accessRuleTypeOptions,
    earlierStepOptions,
    positionOptions,
    positionBreaksRule,
    totalGroupCount,
  }
}

export type LifecycleStepDraftApi = ReturnType<typeof useLifecycleStepDraft>
