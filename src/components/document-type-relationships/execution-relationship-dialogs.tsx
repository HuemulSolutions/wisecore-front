"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { GitMerge } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useDocumentTypeRelationships } from "@/hooks/useDocumentTypeRelationships"
import { useRelationshipAttributes } from "@/hooks/useDocumentTypeRelationships"
import { useExecutionRelationshipMutations } from "@/hooks/useExecutionRelationships"
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId"
import type {
  ExecutionRelationshipCreateDialogProps,
  ExecutionRelationshipEditDialogProps,
} from "@/types/document-type-relationships"
import type {
  ExecutionRelationshipAttributeValue,
} from "@/types/execution-relationships"
import type { RelationshipAttributeDefinition } from "@/types/document-type-relationships"
import type { Execution } from "@/types/execution"

// ─── Attribute fields ──────────────────────────────────────────────────────────

function AttributeFields({
  attributes,
  values,
  onChange,
}: {
  attributes: RelationshipAttributeDefinition[]
  values: Record<string, string>
  onChange: (attrId: string, value: string) => void
}) {
  if (attributes.length === 0) return null
  return (
    <>
      {attributes
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((attr) => (
          <HuemulField
            key={attr.id}
            label={`${attr.name}${attr.is_required ? " *" : ""}`}
            name={attr.id}
            type={attr.value_type === "number" || attr.value_type === "percentage" ? "number" : "text"}
            value={values[attr.id] ?? attr.default_value ?? ""}
            onChange={(v) => onChange(attr.id, v as string)}
            placeholder={attr.default_value ?? ""}
          />
        ))}
    </>
  )
}

// ─── Execution selector field ──────────────────────────────────────────────────

function executionLabel(ex: Execution): string {
  const ver =
    ex.version_major != null
      ? `v${ex.version_major}.${ex.version_minor ?? 0}.${ex.version_patch ?? 0}`
      : null
  const parts = [ex.name, ver].filter(Boolean)
  return parts.join(" — ")
}

// ─── Execution picker dialog (for "Load relationships" on a node) ──────────────

export interface ExecutionPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  assetId: string
  assetName: string
  /** Execution IDs already present on the canvas for this asset — hidden from the selector. */
  excludeExecutionIds?: string[]
  onSelect: (executionId: string, executionName: string) => void
}

export function ExecutionPickerDialog({
  open,
  onOpenChange,
  organizationId,
  assetId,
  assetName,
  excludeExecutionIds,
  onSelect,
}: ExecutionPickerDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])
  const [selectedExecId, setSelectedExecId] = useState("")

  const { data: executions = [] } = useExecutionsByDocumentId(assetId, organizationId, open && !!assetId)

  useEffect(() => {
    if (!open) setSelectedExecId("")
  }, [open])

  const excluded = new Set(excludeExecutionIds ?? [])
  const execOptions = (executions as Execution[])
    .filter((ex) => !excluded.has(ex.id))
    .map((ex) => ({
      label: executionLabel(ex),
      value: ex.id,
    }))

  // Distinguish "asset has no versions" from "all versions are already on the canvas"
  const allInCanvas = execOptions.length === 0 && (executions as Execution[]).length > 0

  const handleConfirm = async () => {
    if (!selectedExecId) return
    const label = execOptions.find((o) => o.value === selectedExecId)?.label ?? ""
    onSelect(selectedExecId, label)
    onOpenChange(false)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("relationship.selectExecution")}
      icon={GitMerge}
      maxWidth="sm:max-w-sm"
      saveAction={{
        label: t("common:confirm"),
        onClick: handleConfirm,
        disabled: !selectedExecId,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <p className="text-xs text-muted-foreground font-medium">{assetName}</p>
        {execOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {allInCanvas ? t("relationship.allVersionsInCanvas") : t("relationship.noExecutions")}
          </p>
        ) : (
          <HuemulField
            label={t("relationship.selectExecution")}
            name="execution"
            type="select"
            value={selectedExecId}
            onChange={(v) => setSelectedExecId(v as string)}
            options={execOptions}
            placeholder={t("relationship.selectExecution")}
            required
          />
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

// ─── Create dialog ─────────────────────────────────────────────────────────────

export function ExecutionRelationshipCreateDialog({
  open,
  onOpenChange,
  organizationId,
  source,
  target,
  onCreated,
}: ExecutionRelationshipCreateDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])

  // Execution selection — pre-filled from node panel version selector if available
  const [sourceExecId, setSourceExecId] = useState(source.executionId ?? "")
  const [targetExecId, setTargetExecId] = useState(target.executionId ?? "")

  // Relationship type + attribute values
  const [selectedRelId, setSelectedRelId] = useState("")
  const [attrValues, setAttrValues] = useState<Record<string, string>>({})

  const { createExecutionRelationship } = useExecutionRelationshipMutations(organizationId)

  // Fetch executions for each asset
  const { data: sourceExecutions = [] } = useExecutionsByDocumentId(
    source.assetId,
    organizationId,
    open && !!source.assetId,
  )
  const { data: targetExecutions = [] } = useExecutionsByDocumentId(
    target.assetId,
    organizationId,
    open && !!target.assetId,
  )

  // Fetch doc type relationships that connect the two types
  const { data: relResponse } = useDocumentTypeRelationships(organizationId, {
    enabled: open,
    pageSize: 200,
    documentTypeId: source.documentTypeId,
  })

  const availableRels = useMemo(() => {
    const all = relResponse?.data ?? []
    return all.filter(
      (r) =>
        (r.source_document_type_id === source.documentTypeId &&
          r.target_document_type_id === target.documentTypeId) ||
        (r.source_document_type_id === target.documentTypeId &&
          r.target_document_type_id === source.documentTypeId),
    )
  }, [relResponse, source.documentTypeId, target.documentTypeId])

  // Auto-select first relationship
  useEffect(() => {
    if (open && availableRels.length > 0 && !selectedRelId) {
      setSelectedRelId(availableRels[0].id)
    }
    if (!open) {
      setSelectedRelId("")
      setAttrValues({})
      setSourceExecId(source.executionId ?? "")
      setTargetExecId(target.executionId ?? "")
    }
  }, [open, availableRels, selectedRelId, source.executionId, target.executionId])

  // Sync pre-filled execution IDs when dialog opens
  useEffect(() => {
    if (open) {
      if (source.executionId) setSourceExecId(source.executionId)
      if (target.executionId) setTargetExecId(target.executionId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fetch attributes for the selected relationship
  const { data: attrDefs = [] } = useRelationshipAttributes(organizationId, selectedRelId)

  useEffect(() => {
    if (selectedRelId) setAttrValues({})
  }, [selectedRelId])

  const handleAttrChange = (attrId: string, value: string) => {
    setAttrValues((prev) => ({ ...prev, [attrId]: value }))
  }

  const canSubmit =
    !!sourceExecId && !!targetExecId && !!selectedRelId

  const handleSubmit = async () => {
    if (!canSubmit) return
    const attributes: ExecutionRelationshipAttributeValue[] = attrDefs
      .filter((attr) => attrValues[attr.id] !== undefined && attrValues[attr.id] !== "")
      .map((attr) => ({
        document_type_relationship_attribute_id: attr.id,
        value: attrValues[attr.id],
      }))

    await new Promise<void>((resolve, reject) => {
      createExecutionRelationship.mutate(
        {
          document_type_relationship_id: selectedRelId,
          source_execution_id: sourceExecId,
          target_execution_id: targetExecId,
          attributes: attributes.length > 0 ? attributes : undefined,
        },
        {
          onSuccess: (data) => {
            const relName = availableRels.find((r) => r.id === selectedRelId)?.name ?? ""
            onCreated?.(data, relName, sourceExecId, targetExecId)
            resolve()
          },
          onError: (err) => reject(err),
        },
      )
    })
  }

  const sourceExecOptions = (sourceExecutions as Execution[]).map((ex) => ({
    label: executionLabel(ex),
    value: ex.id,
  }))
  const targetExecOptions = (targetExecutions as Execution[]).map((ex) => ({
    label: executionLabel(ex),
    value: ex.id,
  }))
  const relOptions = availableRels.map((r) => ({
    label: `${r.name} (${r.source_document_type_name} → ${r.target_document_type_name})`,
    value: r.id,
  }))

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      icon={GitMerge}
      maxWidth="sm:max-w-md"
      saveAction={{
        label: t("create.submitLabel"),
        onClick: handleSubmit,
        disabled: !canSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        {/* Source → Target visual header */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: source.color || "#94a3b8" }} />
          <span className="font-medium truncate">{source.name}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: target.color || "#94a3b8" }} />
          <span className="font-medium truncate">{target.name}</span>
        </div>

        {/* Source execution selector — hidden when pre-filled from node panel */}
        {!source.executionId && (
          sourceExecutions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("relationship.noExecutions")}</p>
          ) : (
            <HuemulField
              label={t("relationship.sourceExecution", { name: source.name })}
              name="source_execution"
              type="select"
              value={sourceExecId}
              onChange={(v) => setSourceExecId(v as string)}
              options={sourceExecOptions}
              placeholder={t("relationship.selectExecution")}
              required
            />
          )
        )}

        {/* Target execution selector — hidden when pre-filled from node panel */}
        {!target.executionId && (
          targetExecutions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("relationship.noExecutions")}</p>
          ) : (
            <HuemulField
              label={t("relationship.targetExecution", { name: target.name })}
              name="target_execution"
              type="select"
              value={targetExecId}
              onChange={(v) => setTargetExecId(v as string)}
              options={targetExecOptions}
              placeholder={t("relationship.selectExecution")}
              required
            />
          )
        )}

        {/* Relationship type selector */}
        {availableRels.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t("relationship.noRelationshipsBetweenTypes")}
          </p>
        ) : (
          <HuemulField
            label={t("relationship.type")}
            name="relationship_type"
            type="select"
            value={selectedRelId}
            onChange={(v) => setSelectedRelId(v as string)}
            options={relOptions}
            required
          />
        )}

        {/* Attribute values */}
        {selectedRelId && (
          <AttributeFields attributes={attrDefs} values={attrValues} onChange={handleAttrChange} />
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

// ─── Edit dialog ───────────────────────────────────────────────────────────────

export function ExecutionRelationshipEditDialog({
  open,
  onOpenChange,
  organizationId,
  executionRelationship,
  relationshipName,
  onUpdated,
}: ExecutionRelationshipEditDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])
  const [attrValues, setAttrValues] = useState<Record<string, string>>({})

  const { updateExecutionRelationship } = useExecutionRelationshipMutations(organizationId)

  const docTypeRelId = executionRelationship?.document_type_relationship_id ?? ""

  const { data: attrDefs = [] } = useRelationshipAttributes(organizationId, docTypeRelId)

  useEffect(() => {
    if (open && executionRelationship) {
      const initial: Record<string, string> = {}
      executionRelationship.attributes.forEach((a) => {
        initial[a.document_type_relationship_attribute_id] = a.value
      })
      setAttrValues(initial)
    }
    if (!open) setAttrValues({})
  }, [open, executionRelationship])

  const handleAttrChange = (attrId: string, value: string) => {
    setAttrValues((prev) => ({ ...prev, [attrId]: value }))
  }

  const handleSubmit = async () => {
    if (!executionRelationship?.id) return
    const attributes: ExecutionRelationshipAttributeValue[] = Object.entries(attrValues)
      .filter(([, value]) => value !== "")
      .map(([document_type_relationship_attribute_id, value]) => ({
        document_type_relationship_attribute_id,
        value,
      }))

    await new Promise<void>((resolve, reject) => {
      updateExecutionRelationship.mutate(
        { executionRelationshipId: executionRelationship.id, body: { attributes } },
        {
          onSuccess: (data) => { onUpdated?.(data); resolve() },
          onError: (err) => reject(err),
        },
      )
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={relationshipName ?? t("edit.title")}
      icon={GitMerge}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("edit.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        {attrDefs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t("relationship.noAttributes")}
          </p>
        ) : (
          <AttributeFields attributes={attrDefs} values={attrValues} onChange={handleAttrChange} />
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
