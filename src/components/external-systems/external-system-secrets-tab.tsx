import { useState } from "react"
import { Plus, Edit2, Trash2, Check, X, Loader2, RefreshCw, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  useExternalSecrets,
  useExternalSecretMutations,
} from "@/hooks/useExternalSecrets"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn } from "@/huemul/components/huemul-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ExternalSecret } from "@/types/external-secrets"

const PAGE_SIZE = 20

interface ExternalSystemSecretsTabProps {
  organizationId: string
  systemId: string
}

interface EditingState {
  id: string
  secret_key: string
  name: string
  secret_value: string
}

interface AddFormState {
  secret_key: string
  name: string
  secret_value: string
}

export function ExternalSystemSecretsTab({
  organizationId,
  systemId,
}: ExternalSystemSecretsTabProps) {
  const { t } = useTranslation(["external-secrets", "common"])

  const [page, setPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [deletingSecret, setDeletingSecret] = useState<ExternalSecret | null>(null)

  const [addForm, setAddForm] = useState<AddFormState>({
    secret_key: "",
    name: "",
    secret_value: "",
  })

  const { data, isLoading, isFetching, refetch } = useExternalSecrets(organizationId, systemId, {
    page,
    pageSize: PAGE_SIZE,
  })

  const { createExternalSecret, updateExternalSecret, deleteExternalSecret } =
    useExternalSecretMutations(organizationId, systemId)

  const secrets = data?.data ?? []

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setAddForm({ secret_key: "", name: "", secret_value: "" })
    setShowAddDialog(true)
  }

  const closeAddDialog = () => setShowAddDialog(false)

  const handleAdd = async () => {
    await createExternalSecret.mutateAsync({
      secret_key: addForm.secret_key.trim(),
      name: addForm.name.trim(),
      secret_value: addForm.secret_value,
    })
  }

  const startEditing = (secret: ExternalSecret) => {
    setEditing({
      id: secret.id,
      secret_key: secret.secret_key,
      name: secret.name,
      secret_value: "",
    })
  }

  const cancelEditing = () => setEditing(null)

  const handleSaveEdit = async () => {
    if (!editing) return
    const body: { secret_key: string; name: string; secret_value?: string } = {
      secret_key: editing.secret_key.trim(),
      name: editing.name.trim(),
    }
    if (editing.secret_value.trim()) {
      body.secret_value = editing.secret_value
    }
    await updateExternalSecret.mutateAsync({
      secretId: editing.id,
      body,
    })
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deletingSecret) return
    await deleteExternalSecret.mutateAsync(deletingSecret.id)
    setDeletingSecret(null)
  }

  const isAddValid =
    addForm.secret_key.trim().length > 0 &&
    addForm.name.trim().length > 0 &&
    addForm.secret_value.length > 0
  const isSaving = updateExternalSecret.isPending

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: HuemulTableColumn<ExternalSecret>[] = [
    {
      key: "name",
      label: t("columns.name"),
      width: "w-[35%]",
      render: (secret) => {
        const isEditingRow = editing?.id === secret.id
        if (isEditingRow) {
          return (
            <Input
              value={editing.name}
              onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
              className="h-7 text-xs"
              autoFocus
            />
          )
        }
        return <span className="text-foreground">{secret.name}</span>
      },
    },
    {
      key: "secret_key",
      label: t("columns.key"),
      width: "w-[30%]",
      render: (secret) => {
        const isEditingRow = editing?.id === secret.id
        if (isEditingRow) {
          return (
            <Input
              value={editing.secret_key}
              onChange={(e) =>
                setEditing((s) => (s ? { ...s, secret_key: e.target.value } : s))
              }
              className="h-7 text-xs font-mono"
            />
          )
        }
        return <span className="font-mono text-foreground">{secret.secret_key}</span>
      },
    },
    {
      key: "secret_value",
      label: t("columns.value"),
      render: (secret) => {
        const isEditingRow = editing?.id === secret.id
        if (isEditingRow) {
          return (
            <Input
              type="password"
              value={editing.secret_value}
              onChange={(e) =>
                setEditing((s) => (s ? { ...s, secret_value: e.target.value } : s))
              }
              placeholder={t("edit.valueHint")}
              className="h-7 text-xs"
            />
          )
        }
        return (
          <span className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
            <Lock className="h-3 w-3 shrink-0" />
            {t("masked")}
          </span>
        )
      },
    },
    {
      key: "row-actions",
      label: "",
      width: "w-[80px]",
      align: "right",
      render: (secret) => {
        const isEditingRow = editing?.id === secret.id
        const isOtherRowEditing = editing !== null && editing.id !== secret.id
        if (isEditingRow) {
          return (
            <div className="flex items-center gap-0.5 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-700 hover:cursor-pointer"
                disabled={
                  isSaving ||
                  !editing.secret_key.trim() ||
                  !editing.name.trim()
                }
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:cursor-pointer"
              disabled={isOtherRowEditing}
              onClick={() => startEditing(secret)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:cursor-pointer"
              disabled={isOtherRowEditing}
              onClick={() => setDeletingSecret(secret)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 hover:cursor-pointer"
            onClick={openAddDialog}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("addSecret")}
          </Button>
        </div>

        {/* Table */}
        <HuemulTable
          data={secrets}
          columns={columns}
          getRowKey={(s) => s.id}
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

      {/* Add Secret Dialog */}
      <HuemulDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) closeAddDialog()
        }}
        title={t("add.title")}
        description={t("add.description")}
        icon={Plus}
        saveAction={{
          label: t("add.submitLabel"),
          disabled: !isAddValid || createExternalSecret.isPending,
          loading: createExternalSecret.isPending,
          closeOnSuccess: true,
          onClick: handleAdd,
        }}
        showCancelButton
        cancelLabel={t("common:cancel")}
      >
        <div className="flex flex-col gap-4">
          <HuemulField
            label={t("add.nameLabel")}
            type="text"
            placeholder={t("add.namePlaceholder")}
            value={addForm.name}
            onChange={(v) => setAddForm((s) => ({ ...s, name: String(v) }))}
            required
            autoFocus
          />
          <HuemulField
            label={t("add.keyLabel")}
            type="text"
            placeholder={t("add.keyPlaceholder")}
            value={addForm.secret_key}
            onChange={(v) => setAddForm((s) => ({ ...s, secret_key: String(v) }))}
            required
          />
          <HuemulField
            label={t("add.valueLabel")}
            type="password"
            placeholder={t("add.valuePlaceholder")}
            value={addForm.secret_value}
            onChange={(v) => setAddForm((s) => ({ ...s, secret_value: String(v) }))}
            required
          />
        </div>
      </HuemulDialog>

      {/* Delete Confirmation */}
      <HuemulAlertDialog
        open={!!deletingSecret}
        onOpenChange={(open) => {
          if (!open) setDeletingSecret(null)
        }}
        title={t("delete.title")}
        description={t("delete.description", { name: deletingSecret?.name })}
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
