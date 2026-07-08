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
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useExternalSystems } from "@/hooks/useExternalSystems"
import { useExternalFunctionalities } from "@/hooks/useExternalFunctionalities"
import {
  useExternalPublishActions,
  useExternalPublishActionMutations,
} from "@/hooks/useLifecycle"
import type { ExternalPublishAction, CreateExternalPublishActionRequest, UpdateExternalPublishActionRequest } from "@/types/lifecycle"

interface LifecyclePublishActionsSectionProps {
  organizationId: string
  stepId: string
}

interface ActionFormState {
  external_functionality_id: string
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
}

interface AddDialogState {
  systemId: string
  functionalityId: string
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
}

function buildDefaultAdd(nextOrder: number): AddDialogState {
  return { systemId: "", functionalityId: "", execution_order: nextOrder, is_enabled: true, stop_on_error: true }
}

export function LifecyclePublishActionsSection({
  organizationId,
  stepId,
}: LifecyclePublishActionsSectionProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const canList   = isOrgAdmin || hasPermission("lifecycle_external_publish_action:l" as never)
  const canCreate = isOrgAdmin || hasPermission("lifecycle_external_publish_action:c" as never)
  const canUpdate = isOrgAdmin || hasPermission("lifecycle_external_publish_action:u" as never)
  const canDelete = isOrgAdmin || hasPermission("lifecycle_external_publish_action:d" as never)

  const [showAddDialog, setShowAddDialog]     = useState(false)
  const [addForm, setAddForm]                 = useState<AddDialogState>(buildDefaultAdd(1))
  const [editingAction, setEditingAction]     = useState<ExternalPublishAction | null>(null)
  const [editForm, setEditForm]               = useState<ActionFormState>({ external_functionality_id: "", execution_order: 1, is_enabled: true, stop_on_error: true })

  // ─── Data ───────────────────────────────────────────────────────────────────

  const { data: actionsData, isLoading: isLoadingActions } = useExternalPublishActions(
    organizationId,
    stepId,
    canList && !!stepId,
  )
  const actions = [...(actionsData?.data ?? [])].sort((a, b) => a.execution_order - b.execution_order)

  const { createAction, updateAction, deleteAction, reorderActions } =
    useExternalPublishActionMutations(organizationId, stepId)

  // Systems combobox
  const { data: systemsData, isLoading: isLoadingSystems } = useExternalSystems(organizationId, {
    pageSize: 200,
    enabled: showAddDialog,
  })
  const systems = systemsData?.data ?? []

  // Functionalities combobox — only loaded when a system is selected
  const { data: functionalitiesData, isLoading: isLoadingFunctionalities } = useExternalFunctionalities(
    organizationId,
    addForm.systemId,
    { objective: "publish_asset", pageSize: 200, enabled: showAddDialog && !!addForm.systemId },
  )
  const functionalities = functionalitiesData?.data ?? []

  // ─── Name resolution ────────────────────────────────────────────────────────

  const resolveName = (action: ExternalPublishAction) =>
    action.external_functionality?.name ?? `${action.external_functionality_id.slice(0, 8)}…`

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    const nextOrder = actions.length > 0 ? Math.max(...actions.map((a) => a.execution_order)) + 1 : 1
    setAddForm(buildDefaultAdd(nextOrder))
    setShowAddDialog(true)
  }

  const handleSaveAdd = () => {
    const body: CreateExternalPublishActionRequest = {
      external_functionality_id: addForm.functionalityId,
      execution_order: addForm.execution_order,
      is_enabled: addForm.is_enabled,
      stop_on_error: addForm.stop_on_error,
    }
    createAction.mutate(body, {
      onSuccess: () => setShowAddDialog(false),
    })
  }

  const handleOpenEdit = (action: ExternalPublishAction) => {
    setEditForm({
      external_functionality_id: action.external_functionality_id,
      execution_order: action.execution_order,
      is_enabled: action.is_enabled,
      stop_on_error: action.stop_on_error,
    })
    setEditingAction(action)
  }

  const handleSaveEdit = () => {
    if (!editingAction) return
    const body: UpdateExternalPublishActionRequest = {
      execution_order: editForm.execution_order,
      is_enabled: editForm.is_enabled,
      stop_on_error: editForm.stop_on_error,
    }
    updateAction.mutate({ actionId: editingAction.id, body }, {
      onSuccess: () => setEditingAction(null),
    })
  }

  const handleDelete = (action: ExternalPublishAction) => {
    if (!window.confirm(t("lifecycle.publishActions.confirmDelete"))) return
    deleteAction.mutate(action.id)
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div>
        <p className="text-sm font-semibold">{t("lifecycle.publishActions.title")}</p>
        <p className="text-xs text-muted-foreground">{t("lifecycle.publishActions.description")}</p>
      </div>

      {isLoadingActions ? (
        <p className="text-sm text-muted-foreground py-2 text-center">
          {t("common:loading", "Loading…")}
        </p>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-6 text-center rounded-md border border-dashed">
          <p className="text-sm font-medium text-muted-foreground">{t("lifecycle.publishActions.empty")}</p>
          <p className="text-xs text-muted-foreground/60">{t("lifecycle.publishActions.emptyDescription")}</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left w-16">{t("lifecycle.publishActions.executionOrder")}</th>
                <th className="px-3 py-2 text-left">{t("lifecycle.publishActions.functionality")}</th>
                <th className="px-3 py-2 text-center w-20">{t("lifecycle.publishActions.isEnabled")}</th>
                <th className="px-3 py-2 text-center w-28">{t("lifecycle.publishActions.stopOnError")}</th>
                <th className="px-3 py-2 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {actions.map((action, idx) => (
                <tr key={action.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-center font-mono text-xs">
                    {action.execution_order}
                  </td>
                  <td className="px-3 py-2 max-w-[260px]">
                    <div className="truncate text-xs font-medium">{resolveName(action)}</div>
                    {action.external_functionality && (
                      <div className="truncate text-xs text-muted-foreground font-mono">
                        {action.external_functionality.system.name} · {action.external_functionality.http_method} {action.external_functionality.partial_url}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <HuemulField
                      type="switch"
                      label=""
                      name={`is_enabled_${action.id}`}
                      value={action.is_enabled}
                      onChange={(v) =>
                        canUpdate &&
                        updateAction.mutate({ actionId: action.id, body: { is_enabled: Boolean(v) } })
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
                        updateAction.mutate({ actionId: action.id, body: { stop_on_error: Boolean(v) } })
                      }
                      disabled={!canUpdate || updateAction.isPending}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        disabled={idx === 0 || reorderActions.isPending}
                        onClick={() => handleMove(idx, "up")}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        disabled={idx === actions.length - 1 || reorderActions.isPending}
                        onClick={() => handleMove(idx, "down")}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => handleOpenEdit(action)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
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

      {canCreate && (
        <div>
          <Button variant="outline" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t("lifecycle.publishActions.addAction")}
          </Button>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={(v) => !v && setShowAddDialog(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("lifecycle.publishActions.addAction")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <HuemulField
              type="combobox"
              label={t("lifecycle.publishActions.selectSystem")}
              name="system"
              value={addForm.systemId}
              onChange={(v) => setAddForm((prev) => ({ ...prev, systemId: String(v), functionalityId: "" }))}
              placeholder={isLoadingSystems ? t("common:loading", "Loading…") : t("lifecycle.publishActions.selectSystemPlaceholder")}
              options={systems.map((s) => ({ value: s.id, label: s.name }))}
              disabled={isLoadingSystems}
            />
            <HuemulField
              type="combobox"
              label={t("lifecycle.publishActions.selectFunctionality")}
              name="functionality"
              value={addForm.functionalityId}
              onChange={(v) => setAddForm((prev) => ({ ...prev, functionalityId: String(v) }))}
              placeholder={
                !addForm.systemId
                  ? t("lifecycle.publishActions.selectSystemPlaceholder")
                  : isLoadingFunctionalities
                  ? t("common:loading", "Loading…")
                  : t("lifecycle.publishActions.selectFunctionalityPlaceholder")
              }
              options={functionalities.map((f) => ({ value: f.id, label: f.name }))}
              disabled={!addForm.systemId || isLoadingFunctionalities}
            />
            <HuemulField
              type="number"
              label={t("lifecycle.publishActions.executionOrder")}
              name="execution_order"
              value={addForm.execution_order}
              onChange={(v) => setAddForm((prev) => ({ ...prev, execution_order: Number(v) || 1 }))}
              min={1}
            />
            <HuemulField
              type="switch"
              label={t("lifecycle.publishActions.isEnabled")}
              name="is_enabled"
              value={addForm.is_enabled}
              onChange={(v) => setAddForm((prev) => ({ ...prev, is_enabled: Boolean(v) }))}
            />
            <HuemulField
              type="switch"
              label={t("lifecycle.publishActions.stopOnError")}
              name="stop_on_error"
              value={addForm.stop_on_error}
              onChange={(v) => setAddForm((prev) => ({ ...prev, stop_on_error: Boolean(v) }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={createAction.isPending}>
              {t("lifecycle.publishActions.cancel")}
            </Button>
            <Button
              onClick={handleSaveAdd}
              disabled={createAction.isPending || !addForm.functionalityId || addForm.execution_order < 1}
            >
              {createAction.isPending ? t("common:saving", "Saving…") : t("lifecycle.publishActions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingAction} onOpenChange={(v) => !v && setEditingAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("lifecycle.publishActions.editAction")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("lifecycle.publishActions.functionality")}
              </span>
              <span className="text-sm">
                {editingAction ? resolveName(editingAction) : ""}
              </span>
            </div>
            <HuemulField
              type="number"
              label={t("lifecycle.publishActions.executionOrder")}
              name="edit_execution_order"
              value={editForm.execution_order}
              onChange={(v) => setEditForm((prev) => ({ ...prev, execution_order: Number(v) || 1 }))}
              min={1}
            />
            <HuemulField
              type="switch"
              label={t("lifecycle.publishActions.isEnabled")}
              name="edit_is_enabled"
              value={editForm.is_enabled}
              onChange={(v) => setEditForm((prev) => ({ ...prev, is_enabled: Boolean(v) }))}
            />
            <HuemulField
              type="switch"
              label={t("lifecycle.publishActions.stopOnError")}
              name="edit_stop_on_error"
              value={editForm.stop_on_error}
              onChange={(v) => setEditForm((prev) => ({ ...prev, stop_on_error: Boolean(v) }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAction(null)} disabled={updateAction.isPending}>
              {t("lifecycle.publishActions.cancel")}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateAction.isPending || editForm.execution_order < 1}
            >
              {updateAction.isPending ? t("common:saving", "Saving…") : t("lifecycle.publishActions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
