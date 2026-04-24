import { useState } from "react"
import { Plus, Edit2, Trash2, Check, X, Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  useExternalFunctionalityParameters,
  useExternalFunctionalityParameterMutations,
} from "@/hooks/useExternalParameters"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn } from "@/huemul/components/huemul-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ExternalParameter, ExternalParameterType } from "@/types/external-parameters"

const PAGE_SIZE = 20

interface ExternalFunctionalityParamsTabProps {
  organizationId: string
  systemId: string
  functionalityId: string
}

interface EditingState {
  id: string
  name: string
  value: string
  param_type: ExternalParameterType
}

interface AddFormState {
  param_type: ExternalParameterType
  name: string
  value: string
}

const TYPE_BADGE_CLASS: Record<ExternalParameterType, string> = {
  query_string:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10",
  header:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/10",
}

export function ExternalFunctionalityParamsTab({
  organizationId,
  systemId,
  functionalityId,
}: ExternalFunctionalityParamsTabProps) {
  const { t } = useTranslation(["external-parameters", "common"])

  const { isOrgAdmin, hasPermission } = useUserPermissions()
  const canCreate = isOrgAdmin || hasPermission("external_parameter:c" as never)
  const canUpdate = isOrgAdmin || hasPermission("external_parameter:u" as never)
  const canDelete = isOrgAdmin || hasPermission("external_parameter:d" as never)
  const canList   = isOrgAdmin || hasPermission("external_parameter:l" as never) || hasPermission("external_parameter:r" as never)

  const typeOptions = [
    { label: t("typeOptions.queryString"), value: "query_string" },
    { label: t("typeOptions.header"), value: "header" },
  ]

  const [page, setPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [deletingParam, setDeletingParam] = useState<ExternalParameter | null>(null)

  const [addForm, setAddForm] = useState<AddFormState>({
    param_type: "query_string",
    name: "",
    value: "",
  })

  const { data, isLoading, isFetching, refetch } = useExternalFunctionalityParameters(organizationId, systemId, functionalityId, {
    page,
    pageSize: PAGE_SIZE,
    enabled: canList,
  })

  const { createExternalFunctionalityParameter, updateExternalFunctionalityParameter, deleteExternalFunctionalityParameter } =
    useExternalFunctionalityParameterMutations(organizationId, systemId, functionalityId)

  const parameters = data?.data ?? []
  // ── alias mutations to reuse the same render logic ────────────────────────
  const createExternalParameter = createExternalFunctionalityParameter
  const updateExternalParameter = updateExternalFunctionalityParameter
  const deleteExternalParameter = deleteExternalFunctionalityParameter

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setAddForm({ param_type: "query_string", name: "", value: "" })
    setShowAddDialog(true)
  }

  const closeAddDialog = () => setShowAddDialog(false)

  const handleAdd = async () => {
    await createExternalParameter.mutateAsync({
      param_type: addForm.param_type,
      name: addForm.name.trim(),
      value: addForm.value.trim(),
    })
  }

  const startEditing = (param: ExternalParameter) => {
    setEditing({
      id: param.id,
      name: param.name,
      value: param.value,
      param_type: param.param_type,
    })
  }

  const cancelEditing = () => setEditing(null)

  const handleSaveEdit = async () => {
    if (!editing) return
    await updateExternalParameter.mutateAsync({
      parameterId: editing.id,
      body: {
        param_type: editing.param_type,
        name: editing.name.trim(),
        value: editing.value.trim(),
      },
    })
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deletingParam) return
    await deleteExternalParameter.mutateAsync(deletingParam.id)
    setDeletingParam(null)
  }

  const isAddValid = addForm.name.trim().length > 0 && addForm.value.trim().length > 0
  const isSaving = updateExternalParameter.isPending

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: HuemulTableColumn<ExternalParameter>[] = [
    {
      key: "type",
      label: t("columns.type"),
      width: "w-[130px]",
      render: (param) => {
        const isEditingRow = editing?.id === param.id
        if (isEditingRow) {
          return (
            <select
              value={editing.param_type}
              onChange={(e) =>
                setEditing((s) =>
                  s ? { ...s, param_type: e.target.value as ExternalParameterType } : s,
                )
              }
              className="h-7 w-full rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring hover:cursor-pointer"
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )
        }
        return (
          <Badge
            variant="outline"
            className={cn("text-xs font-mono px-1.5 py-0.5", TYPE_BADGE_CLASS[param.param_type])}
          >
            {param.param_type === "query_string" ? "query" : "header"}
          </Badge>
        )
      },
    },
    {
      key: "name",
      label: t("columns.key"),
      width: "w-[35%]",
      render: (param) => {
        const isEditingRow = editing?.id === param.id
        if (isEditingRow) {
          return (
            <Input
              value={editing.name}
              onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
              className="h-7 text-xs font-mono"
              autoFocus
            />
          )
        }
        return <span className="font-mono text-foreground">{param.name}</span>
      },
    },
    {
      key: "value",
      label: t("columns.value"),
      render: (param) => {
        const isEditingRow = editing?.id === param.id
        if (isEditingRow) {
          return (
            <Input
              value={editing.value}
              onChange={(e) => setEditing((s) => (s ? { ...s, value: e.target.value } : s))}
              className="h-7 text-xs font-mono"
            />
          )
        }
        return <span className="font-mono text-muted-foreground break-all">{param.value}</span>
      },
    },
    {
      key: "row-actions",
      label: "",
      width: "w-[80px]",
      align: "right",
      render: (param) => {
        const isEditingRow = editing?.id === param.id
        const isOtherRowEditing = editing !== null && editing.id !== param.id
        if (isEditingRow) {
          return (
            <div className="flex items-center gap-0.5 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-700 hover:cursor-pointer"
                disabled={isSaving || !editing.name.trim() || !editing.value.trim()}
                onClick={handleSaveEdit}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:cursor-pointer"
                disabled={isSaving}
                onClick={cancelEditing}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-0.5 justify-end">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:cursor-pointer"
                disabled={isOtherRowEditing}
                onClick={() => startEditing(param)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive hover:cursor-pointer"
                disabled={isOtherRowEditing}
                onClick={() => setDeletingParam(param)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-3 px-6 py-4">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:cursor-pointer"
            onClick={() => refetch()}
            disabled={isFetching}
            title={t("refresh")}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          {canCreate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 hover:cursor-pointer"
              onClick={openAddDialog}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("addParameter")}
            </Button>
          )}
        </div>

        {/* Table */}
        <HuemulTable
          data={parameters}
          columns={columns}
          getRowKey={(p) => p.id}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={{
            title: t("empty.title"),
            description: t("empty.description"),
          }}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            hasNext: data?.has_next,
            hasPrevious: page > 1,
            onPageChange: setPage,
          }}
          maxHeight="max-h-[60vh]"
        />
      </div>

      {/* Add Parameter Dialog */}
      <HuemulDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) closeAddDialog()
        }}
        title={t("add.title")}
        description={t("add.descriptionFunctionality")}
        icon={Plus}
        saveAction={{
          label: t("add.submitLabel"),
          disabled: !isAddValid || createExternalParameter.isPending,
          loading: createExternalParameter.isPending,
          closeOnSuccess: true,
          onClick: handleAdd,
        }}
        showCancelButton
        cancelLabel={t("common:cancel")}
      >
        <div className="flex flex-col gap-4">
          <HuemulField
            label={t("add.typeLabel")}
            type="select"
            value={addForm.param_type}
            options={typeOptions}
            onChange={(v) =>
              setAddForm((s) => ({ ...s, param_type: v as ExternalParameterType }))
            }
            required
          />
          <HuemulField
            label={t("add.keyLabel")}
            type="text"
            placeholder={t("add.keyPlaceholder")}
            value={addForm.name}
            onChange={(v) => setAddForm((s) => ({ ...s, name: String(v) }))}
            required
            autoFocus
          />
          <HuemulField
            label={t("add.valueLabel")}
            type="text"
            placeholder={t("add.valuePlaceholder")}
            value={addForm.value}
            onChange={(v) => setAddForm((s) => ({ ...s, value: String(v) }))}
            required
          />
        </div>
      </HuemulDialog>

      {/* Delete Confirmation */}
      <HuemulAlertDialog
        open={!!deletingParam}
        onOpenChange={(open) => {
          if (!open) setDeletingParam(null)
        }}
        title={t("delete.title")}
        description={t("delete.description", { name: deletingParam?.name })}
        icon={Trash2}
        iconClassName="text-destructive"
        actionLabel={t("delete.confirmLabel")}
        actionVariant="destructive"
        onAction={handleDelete}
        cancelLabel={t("common:cancel")}
      />
    </>
  )
}
