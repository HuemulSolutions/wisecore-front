"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Workflow } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { RoleEdgeNameDialogProps } from "@/types/document-type-relationships"

// Serves both flows — creating a brand-new role↔role / role↔asset connection and
// renaming an existing one — since they're the same form (Name + Type, both free
// text). This is the "manual" half of ExecutionRelationshipCreateDialog with no
// execution selectors, no document-type-relationship picker and no attributes: a
// direct edge only ever lives inside the Diagram's own `relationships`.
export function RoleEdgeNameDialog({
  open,
  onOpenChange,
  mode,
  source,
  target,
  initialName,
  initialType,
  onSubmit,
}: RoleEdgeNameDialogProps) {
  const { t } = useTranslation("document-type-relationships")
  const [name, setName] = useState(initialName ?? "")
  const [type, setType] = useState(initialType ?? "")

  useEffect(() => {
    if (open) {
      setName(initialName ?? "")
      setType(initialType ?? "")
    }
  }, [open, initialName, initialType])

  const handleSubmit = () => {
    onSubmit(name.trim(), type.trim())
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? t("roleEdgeDialog.createTitle") : t("roleEdgeDialog.renameTitle")}
      icon={Workflow}
      maxWidth="sm:max-w-sm"
      // No `disabled` — the label is optional (backend accepts `name: null`) and a
      // role↔asset association with no label is a legitimate shape.
      saveAction={{
        label: t("roleEdgeDialog.submitLabel"),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        {/* Source → Target visual header — mirrors ExecutionRelationshipCreateDialog */}
        <div className="flex flex-col gap-1.5 p-3 bg-muted/50 rounded-lg text-xs">
          <div className="flex items-start gap-2">
            <div className="h-3 w-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: source.color || "#94a3b8" }} />
            <span className="font-medium line-clamp-2 wrap-break-word">{source.label}</span>
          </div>
          <span className="text-muted-foreground pl-1">↓</span>
          <div className="flex items-start gap-2">
            <div className="h-3 w-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: target.color || "#94a3b8" }} />
            <span className="font-medium line-clamp-2 wrap-break-word">{target.label}</span>
          </div>
        </div>

        <HuemulField
          label={t("roleEdgeDialog.nameLabel")}
          name="role_edge_name"
          type="text"
          value={name}
          onChange={(v) => setName(v as string)}
          placeholder={t("roleEdgeDialog.namePlaceholder")}
        />
        <HuemulField
          label={t("roleEdgeDialog.typeLabel")}
          name="role_edge_type"
          type="text"
          value={type}
          onChange={(v) => setType(v as string)}
          placeholder={t("roleEdgeDialog.typePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("roleEdgeDialog.hint")}</p>
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
