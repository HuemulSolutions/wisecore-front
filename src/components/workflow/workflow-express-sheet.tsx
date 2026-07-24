"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Sparkles } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { CreateExpressBody, WorkflowTemplateItem } from "@/types/templates"

interface WorkflowExpressSheetProps {
  template: WorkflowTemplateItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: CreateExpressBody) => Promise<void>
}

export function WorkflowExpressSheet({ template, open, onOpenChange, onSubmit }: WorkflowExpressSheetProps) {
  const { t } = useTranslation(["workflow", "common"])

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  // Resetea el formulario cada vez que se abre para un nuevo template.
  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
    }
  }, [open, template?.id])

  const nameRequired = template?.require_name_on_express ?? false
  const canSave = !nameRequired || name.trim().length > 0

  const handleSave = () => {
    return onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    })
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("expressSheet.title")}
      description={template?.name}
      icon={Sparkles}
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("availableTemplates.start"),
        onClick: handleSave,
        disabled: !canSave,
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="express-name" className="text-xs text-muted-foreground font-normal">
            {t("expressSheet.name")}
            {nameRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id="express-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("expressSheet.namePlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="express-description" className="text-xs text-muted-foreground font-normal">
            {t("expressSheet.description")}
          </Label>
          <Textarea
            id="express-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("expressSheet.descriptionPlaceholder")}
            rows={4}
          />
        </div>
      </div>
    </HuemulSheet>
  )
}
