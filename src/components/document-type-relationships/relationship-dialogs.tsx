"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GitMerge, Lock } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import {
  useDocumentTypeRelationshipMutations,
} from "@/hooks/useDocumentTypeRelationships"
import type {
  CreateDocumentTypeRelationshipRequest,
  UpdateDocumentTypeRelationshipRequest,
  RelationshipFormData,
  RelationshipCreateDialogProps,
  RelationshipEditDialogProps,
} from "@/types/document-type-relationships"

export function RelationshipCreateDialog({
  open,
  onOpenChange,
  organizationId,
  sourceDocumentTypeId,
  targetDocumentTypeId,
  sourceDocumentType,
  targetDocumentType,
  onCreated,
}: RelationshipCreateDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])
  const [formData, setFormData] = useState<RelationshipFormData>({
    name: "",
    min_count: 0,
    max_count: 0,
  })
  const { createDocumentTypeRelationship } = useDocumentTypeRelationshipMutations(organizationId)

  const isSelf = sourceDocumentTypeId === targetDocumentTypeId

  const handleChange = <K extends keyof RelationshipFormData>(
    field: K,
    value: RelationshipFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const body: CreateDocumentTypeRelationshipRequest = {
      name: formData.name,
      source_document_type_id: sourceDocumentTypeId,
      target_document_type_id: targetDocumentTypeId,
      min_count: formData.min_count,
      max_count: formData.max_count,
    }
    await new Promise<void>((resolve, reject) => {
      createDocumentTypeRelationship.mutate(body, {
        onSuccess: (data) => {
          setFormData({ name: "", min_count: 0, max_count: 0 })
          onCreated?.(data)
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
      icon={GitMerge}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("create.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        {/* Source → Target display */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: sourceDocumentType?.color || "#94a3b8" }}
          />
          <span className="font-medium truncate">
            {sourceDocumentType?.name ?? sourceDocumentTypeId}
          </span>
          <span className="text-muted-foreground mx-1">→</span>
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: targetDocumentType?.color || "#94a3b8" }}
          />
          <span className="font-medium truncate">
            {targetDocumentType?.name ?? targetDocumentTypeId}
          </span>
          {isSelf && (
            <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {t("relationship.selfRelation")}
            </span>
          )}
        </div>

        <HuemulField
          label={t("relationship.name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("relationship.namePlaceholder")}
          required
        />
        <HuemulField
          label={t("relationship.minCount")}
          name="min_count"
          type="number"
          value={String(formData.min_count)}
          onChange={(v) => handleChange("min_count", Number(v))}
        />
        <HuemulField
          label={`${t("relationship.maxCount")} — ${t("relationship.maxCountHint")}`}
          name="max_count"
          type="number"
          value={String(formData.max_count)}
          onChange={(v) => handleChange("max_count", Number(v))}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

export function RelationshipEditDialog({
  open,
  onOpenChange,
  organizationId,
  relationship,
  isLocked = false,
}: RelationshipEditDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])
  const [formData, setFormData] = useState<RelationshipFormData>({
    name: "",
    min_count: 0,
    max_count: 0,
  })
  const { updateDocumentTypeRelationship } = useDocumentTypeRelationshipMutations(organizationId)

  // Support both nested { document_type_relationship: {...} } and flat API responses
  const nested = relationship?.document_type_relationship
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flat = relationship as unknown as Record<string, any> | null
  const configId: string = nested?.id ?? flat?.id ?? ""
  const configName: string = nested?.name ?? flat?.name ?? ""
  const configMinCount: number = nested?.min_count ?? flat?.min_count ?? 0
  const configMaxCount: number = nested?.max_count ?? flat?.max_count ?? 0

  useEffect(() => {
    if (relationship && open) {
      setFormData({
        name: configName,
        min_count: configMinCount,
        max_count: configMaxCount,
      })
    }
  }, [relationship, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = <K extends keyof RelationshipFormData>(
    field: K,
    value: RelationshipFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!configId) return
    const body: UpdateDocumentTypeRelationshipRequest = {
      name: formData.name,
      min_count: formData.min_count,
      max_count: formData.max_count,
    }
    await new Promise<void>((resolve, reject) => {
      updateDocumentTypeRelationship.mutate(
        { relationshipId: configId, body },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        },
      )
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("edit.title")}
      icon={GitMerge}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("edit.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>{t("edit.lockedHint")}</span>
          </div>
        )}
        <HuemulField
          label={t("relationship.name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("relationship.namePlaceholder")}
          required
        />
        <HuemulField
          label={t("relationship.minCount")}
          name="min_count"
          type="number"
          value={String(formData.min_count)}
          onChange={(v) => handleChange("min_count", Number(v))}
        />
        <HuemulField
          label={`${t("relationship.maxCount")} — ${t("relationship.maxCountHint")}`}
          name="max_count"
          type="number"
          value={String(formData.max_count)}
          onChange={(v) => handleChange("max_count", Number(v))}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
