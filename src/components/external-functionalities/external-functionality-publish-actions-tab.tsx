import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import {
  useLifecycleSteps,
  useExternalPublishActions,
  useExternalPublishActionMutations,
} from "@/hooks/useLifecycle"
import type { ExternalFunctionality } from "@/types/external-functionalities"
import type {
  ExternalPublishAction,
  CreateExternalPublishActionRequest,
  UpdateExternalPublishActionRequest,
} from "@/types/lifecycle"

interface ExternalFunctionalityPublishActionsTabProps {
  organizationId: string
  functionality: ExternalFunctionality
}

interface ActionFormState {
  external_functionality_id: string
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
}

function buildDefaultForm(functionalityId: string, nextOrder: number): ActionFormState {
  return {
    external_functionality_id: functionalityId,
    execution_order: nextOrder,
    is_enabled: true,
    stop_on_error: true,
  }
}

export function ExternalFunctionalityPublishActionsTab({
  organizationId,
  functionality,
}: ExternalFunctionalityPublishActionsTabProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const canList   = isOrgAdmin || hasPermission("lifecycle_external_publish_action:l" as never)
  const canCreate = isOrgAdmin || hasPermission("lifecycle_external_publish_action:c" as never)
  const canUpdate = isOrgAdmin || hasPermission("lifecycle_external_publish_action:u" as never)
  const canDelete = isOrgAdmin || hasPermission("lifecycle_external_publish_action:d" as never)

  const [selectedDocTypeId, setSelectedDocTypeId] = useState("")
  const [selectedStepId, setSelectedStepId]       = useState("")
  const [showCreateDialog, setShowCreateDialog]   = useState(false)
  const [editingAction, setEditingAction]         = useState<ExternalPublishAction | null>(null)
  const [formState, setFormState]                 = useState<ActionFormState>(
    buildDefaultForm(functionality.id, 1),
  )
  const [deleteTarget, setDeleteTarget]           = useState<ExternalPublishAction | null>(null)

  // ─── Data ──────────────────────────────────────────────────────────────────

  const { data: docTypesData, isLoading: isLoadingDocTypes } = useDocumentTypes()
  const docTypes = docTypesData?.data ?? []

  const { data: stepsData, isLoading: isLoadingSteps } = useLifecycleSteps(
    selectedDocTypeId || null,
    "publish",
    !!selectedDocTypeId,
  )
  const steps = stepsData?.data.steps ?? []

  const { data: actionsData, isLoading: isLoadingActions } = useExternalPublishActions(
    organizationId,
    selectedStepId,
    canList && !!selectedStepId,
  )
  const actions = [...(actionsData?.data ?? [])].sort(
    (a, b) => a.execution_order - b.execution_order,
  )

  const { createAction, updateAction, deleteAction, reorderActions } =
    useExternalPublishActionMutations(organizationId, selectedStepId)

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDocTypeChange = (value: string | number | boolean) => {
    setSelectedDocTypeId(String(value))
    setSelectedStepId("")
  }

  const handleOpenCreate = () => {
    const nextOrder =
      actions.length > 0 ? Math.max(...actions.map((a) => a.execution_order)) + 1 : 1
    setFormState(buildDefaultForm(functionality.id, nextOrder))
    setShowCreateDialog(true)
  }

  const handleOpenEdit = (action: ExternalPublishAction) => {
    setFormState({
      external_functionality_id: action.external_functionality_id,
      execution_order: action.execution_order,
      is_enabled: action.is_enabled,
      stop_on_error: action.stop_on_error,
    })
    setEditingAction(action)
  }

  const handleSaveCreate = () => {
    const body: CreateExternalPublishActionRequest = {
      external_functionality_id: formState.external_functionality_id,
      execution_order: formState.execution_order,
      is_enabled: formState.is_enabled,
      stop_on_error: formState.stop_on_error,
    }
    createAction.mutate(body, { onSuccess: () => setShowCreateDialog(false) })
  }

  const handleSaveEdit = () => {
    if (!editingAction) return
    const body: UpdateExternalPublishActionRequest = {
      execution_order: formState.execution_order,
      is_enabled: formState.is_enabled,
      stop_on_error: formState.stop_on_error,
    }
    updateAction.mutate({ actionId: editingAction.id, body }, {
      onSuccess: () => setEditingAction(null),
    })
  }

  const handleDelete = (action: ExternalPublishAction) => {
    setDeleteTarget(action)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await deleteAction.mutateAsync(deleteTarget.id)
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= actions.length) return
    const reordered = actions.map((a, i) => {
      if (i === index) return { id: a.id, execution_order: actions[swapIdx].execution_order }
      if (i === swapIdx) return { id: a.id, execution_order: actions[index].execution_order }
      return { id: a.id, execution_order: a.execution_order }
    })
    reorderActions.mutate({ actions: reordered })
  }

  const resolveFunctionalityLabel = (functionalityId: string) =>
    functionalityId === functionality.id ? functionality.name : `${functionalityId.slice(0, 8)}…`

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <HuemulField
          type="combobox"
          label={t("publishActions.selectDocumentType")}
          name="docType"
          value={selectedDocTypeId}
          onChange={handleDocTypeChange}
          placeholder={
            isLoadingDocTypes
              ? t("common:loading", "Loading…")
              : t("publishActions.selectDocumentTypePlaceholder")
          }
          options={docTypes.map((dt) => ({ value: dt.id, label: dt.name }))}
          disabled={isLoadingDocTypes}
        />
        <HuemulField
          type="combobox"
          label={t("publishActions.selectStep")}
          name="step"
          value={selectedStepId}
          onChange={(v) => setSelectedStepId(String(v))}
          placeholder={
            isLoadingSteps
              ? t("common:loading", "Loading…")
              : t("publishActions.selectStepPlaceholder")
          }
          options={steps.map((s) => ({ value: s.id, label: s.name ?? `Paso ${s.order}` }))}
          disabled={!selectedDocTypeId || isLoadingSteps}
        />
      </div>

      {/* Content area */}
      {!selectedStepId ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t("publishActions.noStepSelected")}
        </p>
      ) : isLoadingActions ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t("common:loading", "Loading…")}
        </p>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">{t("publishActions.empty")}</p>
          <p className="text-xs text-muted-foreground/60">{t("publishActions.emptyDescription")}</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left w-16">{t("publishActions.executionOrder")}</th>
                <th className="px-3 py-2 text-left">{t("publishActions.functionality")}</th>
                <th className="px-3 py-2 text-center w-20">{t("publishActions.isEnabled")}</th>
                <th className="px-3 py-2 text-center w-28">{t("publishActions.stopOnError")}</th>
                <th className="px-3 py-2 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {actions.map((action, idx) => (
                <tr key={action.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-center font-mono text-xs">
                    {action.execution_order}
                  </td>
                  <td className="px-3 py-2 truncate max-w-[180px] text-xs">
                    {resolveFunctionalityLabel(action.external_functionality_id)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <HuemulField
                      type="switch"
                      label=""
                      name={`is_enabled_${action.id}`}
                      value={action.is_enabled}
                      onChange={(v) =>
                        canUpdate &&
                        updateAction.mutate({
                          actionId: action.id,
                          body: { is_enabled: Boolean(v) },
                        })
                      }
                      disabled={!canUpdate || updateAction.isPending}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <HuemulField
                      type="switch"
                      label=""
                      name={`stop_on_error_${action.id}`}
                      value={action.stop_on_error}
                      onChange={(v) =>
                        canUpdate &&
                        updateAction.mutate({
                          actionId: action.id,
                          body: { stop_on_error: Boolean(v) },
                        })
                      }
                      disabled={!canUpdate || updateAction.isPending}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0 || reorderActions.isPending}
                        onClick={() => handleMove(idx, "up")}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === actions.length - 1 || reorderActions.isPending}
                        onClick={() => handleMove(idx, "down")}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleOpenEdit(action)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          disabled={deleteAction.isPending}
                          onClick={() => handleDelete(action)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add button */}
      {selectedStepId && canCreate && (
        <div>
          <Button variant="outline" size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t("publishActions.addAction")}
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <ActionFormDialog
        open={showCreateDialog}
        title={t("publishActions.addAction")}
        formState={formState}
        functionalityLabel={functionality.name}
        isSaving={createAction.isPending}
        onChange={setFormState}
        onSave={handleSaveCreate}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Edit dialog */}
      <ActionFormDialog
        open={!!editingAction}
        title={t("publishActions.editAction")}
        formState={formState}
        functionalityLabel={resolveFunctionalityLabel(formState.external_functionality_id)}
        isSaving={updateAction.isPending}
        onChange={setFormState}
        onSave={handleSaveEdit}
        onClose={() => setEditingAction(null)}
      />

      {/* Delete confirmation */}
      <HuemulAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("publishActions.confirmDelete")}
        actionLabel={t("common:delete")}
        cancelLabel={t("publishActions.cancel")}
        onAction={handleConfirmDelete}
      />
    </div>
  )
}

// ─── Action form dialog ───────────────────────────────────────────────────────

interface ActionFormDialogProps {
  open: boolean
  title: string
  formState: ActionFormState
  functionalityLabel: string
  isSaving: boolean
  onChange: (state: ActionFormState) => void
  onSave: () => void
  onClose: () => void
}

function ActionFormDialog({
  open,
  title,
  formState,
  functionalityLabel,
  isSaving,
  onChange,
  onSave,
  onClose,
}: ActionFormDialogProps) {
  const { t } = useTranslation(["external-functionalities", "common"])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("publishActions.functionality")}
            </span>
            <span className="text-sm">{functionalityLabel}</span>
          </div>
          <HuemulField
            type="number"
            label={t("publishActions.executionOrder")}
            name="execution_order"
            value={formState.execution_order}
            onChange={(v) => onChange({ ...formState, execution_order: Number(v) || 1 })}
            min={1}
          />
          <HuemulField
            type="switch"
            label={t("publishActions.isEnabled")}
            name="is_enabled"
            value={formState.is_enabled}
            onChange={(v) => onChange({ ...formState, is_enabled: Boolean(v) })}
          />
          <HuemulField
            type="switch"
            label={t("publishActions.stopOnError")}
            name="stop_on_error"
            value={formState.stop_on_error}
            onChange={(v) => onChange({ ...formState, stop_on_error: Boolean(v) })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("publishActions.cancel")}
          </Button>
          <Button onClick={onSave} disabled={isSaving || formState.execution_order < 1}>
            {isSaving ? t("common:saving", "Saving…") : t("publishActions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
