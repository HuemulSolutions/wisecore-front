"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Settings2, Edit2, Trash2, Lock } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import {
  useRelationshipAttributes,
  useRelationshipAttributeMutations,
} from "@/hooks/useDocumentTypeRelationships"
import type {
  AttributeValueType,
  RelationshipAttributeDefinition,
  CreateRelationshipAttributeRequest,
  UpdateRelationshipAttributeRequest,
  AttributesDialogProps,
  AttributeFormData,
} from "@/types/document-type-relationships"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const INITIAL_FORM: AttributeFormData = {
  name: "",
  value_type: "text",
  is_required: false,
  default_value: "",
  display_order: 0,
}

const VALUE_TYPE_OPTIONS: AttributeValueType[] = ["number", "percentage", "text", "date"]

export function RelationshipAttributesDialog({
  open,
  onOpenChange,
  organizationId,
  relationshipId,
  relationshipName,
}: AttributesDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])

  // Sub-dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAttr, setEditingAttr] = useState<RelationshipAttributeDefinition | null>(null)
  const [deletingAttr, setDeletingAttr] = useState<RelationshipAttributeDefinition | null>(null)

  const { data: attributes = [], isLoading } = useRelationshipAttributes(
    organizationId,
    relationshipId,
  )
  const mutations = useRelationshipAttributeMutations(organizationId, relationshipId)

  const openCreate = () => {
    setTimeout(() => setCreateOpen(true), 0)
  }
  const openEdit = (attr: RelationshipAttributeDefinition) => {
    setTimeout(() => setEditingAttr(attr), 0)
  }
  const openDelete = (attr: RelationshipAttributeDefinition) => {
    setTimeout(() => setDeletingAttr(attr), 0)
  }

  return (
    <>
      <HuemulDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`${t("attributes.title")} — ${relationshipName}`}
        icon={Settings2}
        maxWidth="sm:max-w-lg"
      >
        <div className="py-2 space-y-3">
          {/* Add attribute button */}
          <div className="flex justify-end">
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Plus}
              label={t("attributes.addAttribute")}
              onClick={openCreate}
            />
          </div>

          <Separator />

          {/* Attribute list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : attributes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("attributes.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {attributes.map((attr) => (
                <AttributeRow
                  key={attr.id}
                  attribute={attr}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </HuemulDialog>

      {/* Create attribute sub-dialog */}
      <AttributeCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mutations={mutations}
        existingCount={attributes.length}
        t={t}
      />

      {/* Edit attribute sub-dialog */}
      {editingAttr && (
        <AttributeEditDialog
          open={!!editingAttr}
          onOpenChange={(o) => !o && setEditingAttr(null)}
          attribute={editingAttr}
          mutations={mutations}
          t={t}
        />
      )}

      {/* Delete attribute alert dialog */}
      {deletingAttr && (
        <AttributeDeleteDialog
          open={!!deletingAttr}
          onOpenChange={(o) => !o && setDeletingAttr(null)}
          attribute={deletingAttr}
          mutations={mutations}
          t={t}
        />
      )}
    </>
  )
}

// ─── Attribute row ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttributeRow({ attribute, onEdit, onDelete, t }: {
  attribute: RelationshipAttributeDefinition
  onEdit: (a: RelationshipAttributeDefinition) => void
  onDelete: (a: RelationshipAttributeDefinition) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{attribute.name}</span>
          {attribute.is_required && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
              {t("attributes.isRequired")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px] h-4 px-1">
            {t(`attributes.valueTypes.${attribute.value_type}`)}
          </Badge>
          {attribute.default_value && (
            <span className="text-[11px] text-muted-foreground truncate">
              {t("attributes.defaultValue")}: {attribute.default_value}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(attribute)}
          className="p-1.5 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(attribute)}
          className="p-1.5 rounded hover:bg-destructive/10 hover:cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Create attribute dialog ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttributeCreateDialog({ open, onOpenChange, mutations, existingCount, t }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutations: any
  existingCount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const [formData, setFormData] = useState<AttributeFormData>({
    ...INITIAL_FORM,
    display_order: existingCount,
  })

  const handleChange = <K extends keyof AttributeFormData>(
    field: K,
    value: AttributeFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const body: CreateRelationshipAttributeRequest = {
      name: formData.name,
      value_type: formData.value_type,
      is_required: formData.is_required,
      default_value: formData.default_value || undefined,
      display_order: formData.display_order,
    }
    await new Promise<void>((resolve, reject) => {
      mutations.createRelationshipAttribute.mutate(body, {
        onSuccess: () => {
          setFormData({ ...INITIAL_FORM, display_order: existingCount + 1 })
          resolve()
        },
        onError: (err: unknown) => reject(err),
      })
    })
  }

  const valueTypeOptions = VALUE_TYPE_OPTIONS.map((vt) => ({
    value: vt,
    label: t(`attributes.valueTypes.${vt}`),
  }))

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("createAttribute.title")}
      icon={Plus}
      maxWidth="sm:max-w-sm"
      saveAction={{ label: t("createAttribute.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("attributes.name")}
          name="attr_name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("attributes.namePlaceholder")}
          required
        />
        <HuemulField
          label={t("attributes.valueType")}
          name="value_type"
          type="select"
          value={formData.value_type}
          onChange={(v) => handleChange("value_type", v as AttributeValueType)}
          options={valueTypeOptions}
        />
        <HuemulField
          label={t("attributes.defaultValue")}
          name="default_value"
          value={formData.default_value}
          onChange={(v) => handleChange("default_value", v as string)}
          placeholder={t("attributes.defaultValuePlaceholder")}
        />
        <HuemulField
          label={t("attributes.displayOrder")}
          name="display_order"
          type="number"
          value={String(formData.display_order)}
          onChange={(v) => handleChange("display_order", Number(v))}
        />
        <HuemulField
          label={t("attributes.isRequired")}
          name="is_required"
          type="checkbox"
          value={formData.is_required}
          onChange={(v) => handleChange("is_required", v as boolean)}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

// ─── Edit attribute dialog ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttributeEditDialog({ open, onOpenChange, attribute, mutations, t }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: RelationshipAttributeDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutations: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const [formData, setFormData] = useState<AttributeFormData>({
    name: attribute.name,
    value_type: attribute.value_type,
    is_required: attribute.is_required,
    default_value: attribute.default_value ?? "",
    display_order: attribute.display_order,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: attribute.name,
        value_type: attribute.value_type,
        is_required: attribute.is_required,
        default_value: attribute.default_value ?? "",
        display_order: attribute.display_order,
      })
    }
  }, [attribute, open])

  const handleChange = <K extends keyof AttributeFormData>(
    field: K,
    value: AttributeFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const body: UpdateRelationshipAttributeRequest = {
      name: formData.name,
      is_required: formData.is_required,
      default_value: formData.default_value || undefined,
      display_order: formData.display_order,
    }
    await new Promise<void>((resolve, reject) => {
      mutations.updateRelationshipAttribute.mutate(
        { attributeId: attribute.id, body },
        {
          onSuccess: () => resolve(),
          onError: (err: unknown) => reject(err),
        },
      )
    })
  }

  const valueTypeOptions = VALUE_TYPE_OPTIONS.map((vt) => ({
    value: vt,
    label: t(`attributes.valueTypes.${vt}`),
  }))

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("editAttribute.title")}
      icon={Edit2}
      maxWidth="sm:max-w-sm"
      saveAction={{ label: t("editAttribute.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("attributes.name")}
          name="attr_name_edit"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("attributes.namePlaceholder")}
          required
        />
        {/* value_type locked to avoid structural changes on existing instances */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {t("attributes.valueType")}: {t(`attributes.valueTypes.${attribute.value_type}`)}
          </span>
        </div>
        <HuemulField
          label={t("attributes.isRequired")}
          name="is_required_edit"
          type="checkbox"
          value={formData.is_required}
          onChange={(v) => handleChange("is_required", v as boolean)}
        />
        <HuemulField
          label={t("attributes.defaultValue")}
          name="default_value_edit"
          value={formData.default_value}
          onChange={(v) => handleChange("default_value", v as string)}
          placeholder={t("attributes.defaultValuePlaceholder")}
        />
        <HuemulField
          label={t("attributes.displayOrder")}
          name="display_order_edit"
          type="number"
          value={String(formData.display_order)}
          onChange={(v) => handleChange("display_order", Number(v))}
        />
        <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded text-xs text-muted-foreground">
          <span>{t("edit.lockedHint")}</span>
        </div>
        <HuemulField
          label={t("attributes.valueType")}
          name="value_type_edit"
          type="select"
          value={formData.value_type}
          onChange={(v) => handleChange("value_type", v as AttributeValueType)}
          options={valueTypeOptions}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

// ─── Delete attribute alert dialog ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttributeDeleteDialog({ open, onOpenChange, attribute, mutations, t }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: RelationshipAttributeDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutations: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      mutations.deleteRelationshipAttribute.mutate(attribute.id, {
        onSuccess: () => resolve(),
        onError: (err: unknown) => reject(err),
      })
    })
  }

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("deleteAttribute.title")}
      description={t("deleteAttribute.description", { name: attribute.name })}
      actionLabel={t("deleteAttribute.confirmLabel")}
      onAction={handleDelete}
    />
  )
}
