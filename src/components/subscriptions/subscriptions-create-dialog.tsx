"use client"

import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Plus, File, X } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulFileTree } from "@/huemul/components/huemul-file-tree"
import { useSubscriptionMutations } from "@/hooks/useSubscriptions"
import { getLibraryContent } from "@/services/folders"
import type { CreateSubscriptionRequest, SubscriptionReactionType } from "@/types/subscriptions"
import type { HuemulTreeNode } from "@/types/huemul"
import { Label } from "@/components/ui/label"

const EXECUTION_EVENT_TYPES = [
  "execution_expiration_date",
  "execution_audit_date",
  "execution_estimated_publication_date",
  "execution_review_date",
]

const DOCUMENT_EVENT_TYPES = [
  "document_new_comments",
  "document_stage_draft",
  "document_stage_in_review",
  "document_stage_in_approval",
  "document_stage_approved",
  "document_stage_published",
  "document_stage_archived",
]

const INITIAL_FORM: CreateSubscriptionRequest = {
  document_id: undefined,
  execution_id: undefined,
  event_type: undefined,
  reaction_type: "watch",
  comment: undefined,
  days_before: undefined,
  notify_email: false,
  notify_in_app: true,
  require_read_ack: false,
}

interface SubscriptionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function SubscriptionCreateDialog({
  open,
  onOpenChange,
  organizationId,
}: SubscriptionCreateDialogProps) {
  const { t } = useTranslation(["subscriptions", "common"])
  const [formData, setFormData] = useState<CreateSubscriptionRequest>(INITIAL_FORM)
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null)
  const { createSubscription } = useSubscriptionMutations(organizationId)

  const handleChange = <K extends keyof CreateSubscriptionRequest>(
    field: K,
    value: CreateSubscriptionRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const isExecutionEvent = EXECUTION_EVENT_TYPES.includes(formData.event_type ?? "")

  const handleLoadChildren = useCallback(
    async (folderId: string | null): Promise<HuemulTreeNode[]> => {
      const content = await getLibraryContent(organizationId, folderId ?? undefined)
      const folderNodes: HuemulTreeNode[] = content.folders.map((f) => ({
        id: f.id,
        name: f.name,
        type: "folder",
        hasChildren: true,
      }))
      const fileNodes: HuemulTreeNode[] = content.assets.map((a) => ({
        id: a.id,
        name: a.name,
        type: "file",
        hasChildren: false,
        metadata: { color: a.document_type?.color },
      }))
      return [...folderNodes, ...fileNodes]
    },
    [organizationId],
  )

  const handleFileClick = useCallback((node: HuemulTreeNode) => {
    if (formData.document_id === node.id) {
      handleChange("document_id", undefined)
      setSelectedDocumentName(null)
    } else {
      handleChange("document_id", node.id)
      setSelectedDocumentName(node.name)
    }
  }, [formData.document_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const eventTypeOptions = [
    ...DOCUMENT_EVENT_TYPES.map((v) => ({
      label: t(`eventType.${v}` as Parameters<typeof t>[0]),
      value: v,
    })),
    ...EXECUTION_EVENT_TYPES.map((v) => ({
      label: t(`eventType.${v}` as Parameters<typeof t>[0]),
      value: v,
    })),
  ]

  const reactionTypeOptions: { label: string; value: SubscriptionReactionType }[] = [
    { label: t("reactionType.watch"), value: "watch" },
    { label: t("reactionType.favorite"), value: "favorite" },
    { label: t("reactionType.love"), value: "love" },
    { label: t("reactionType.insights"), value: "insights" },
  ]

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      const payload: CreateSubscriptionRequest = {
        ...formData,
        days_before: isExecutionEvent && formData.days_before ? formData.days_before : undefined,
        event_type: formData.reaction_type === "favorite" ? undefined : formData.event_type,
      }
      createSubscription.mutate(payload, {
        onSuccess: () => {
          setFormData(INITIAL_FORM)
          setSelectedDocumentName(null)
          resolve()
        },
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      icon={Plus}
      maxWidth="sm:max-w-xl"
      saveAction={{ label: t("create.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        {/* Document selector via file tree */}
        <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
          <Label className="text-sm font-medium">
            {t("columns.document")}
            <span className="text-destructive ml-0.5">*</span>
          </Label>

          {selectedDocumentName && (
            <div className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5">
              <File className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="flex-1 truncate text-sm text-blue-700 font-medium">{selectedDocumentName}</span>
              <button
                type="button"
                onClick={() => { handleChange("document_id", undefined); setSelectedDocumentName(null) }}
                className="ml-auto text-blue-400 hover:text-blue-600 hover:cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <HuemulFileTree
            onLoadChildren={handleLoadChildren}
            onFileClick={handleFileClick}
            activeNodeId={formData.document_id ?? undefined}
            showCreateButtons={false}
            showDefaultActions={{ create: false, delete: false, share: false }}
            showBorder
            minHeight="180px"
            renderLeafIcon={(node) => (
              <File
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: (node.metadata as { color?: string } | undefined)?.color ?? "currentColor" }}
              />
            )}
          />
        </div>

        <HuemulField
          type="select"
          label={t("columns.reactionType")}
          name="reaction_type"
          value={formData.reaction_type}
          onChange={(v) => {
            handleChange("reaction_type", v as SubscriptionReactionType)
            if (v === "favorite") handleChange("event_type", undefined)
          }}
          options={reactionTypeOptions}
          placeholder={t("form.reactionTypePlaceholder")}
          required
        />

        {formData.reaction_type !== "favorite" && (
          <HuemulField
            type="select"
            label={t("columns.eventType")}
            name="event_type"
            value={formData.event_type ?? ""}
            onChange={(v) => handleChange("event_type", String(v) || undefined)}
            options={eventTypeOptions}
            placeholder={t("form.eventTypePlaceholder")}
          />
        )}

        {isExecutionEvent && (
          <HuemulField
            type="number"
            label={t("form.daysBefore")}
            name="days_before"
            value={formData.days_before ?? ""}
            onChange={(v) => handleChange("days_before", v ? Number(v) : undefined)}
            placeholder={t("form.daysBeforePlaceholder")}
            min={1}
          />
        )}

        <HuemulField
          type="switch"
          label={t("form.notifyInApp")}
          name="notify_in_app"
          value={formData.notify_in_app ?? false}
          onChange={(v) => handleChange("notify_in_app", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="switch"
          label={t("form.notifyEmail")}
          name="notify_email"
          value={formData.notify_email ?? false}
          onChange={(v) => handleChange("notify_email", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="switch"
          label={t("form.requireReadAck")}
          name="require_read_ack"
          value={formData.require_read_ack ?? false}
          onChange={(v) => handleChange("require_read_ack", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="textarea"
          label={t("form.comment")}
          name="comment"
          value={formData.comment ?? ""}
          onChange={(v) => handleChange("comment", String(v) || undefined)}
          placeholder={t("form.commentPlaceholder")}
          rows={3}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
