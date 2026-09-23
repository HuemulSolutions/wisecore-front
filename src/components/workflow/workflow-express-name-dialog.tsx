import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowExpressNameDialogProps {
  /** Template que exige nombre al iniciar (`require_name_on_express`); `null` cierra el diálogo. */
  template: WorkflowTemplateItem | null
  isCreating: boolean
  onSubmit: (name: string, description?: string) => void
  onClose: () => void
}

/**
 * Pide nombre/descripción antes de crear el express de un template con
 * `require_name_on_express`. Se abre desde la franja o desde «Ver todos»
 * (encima de éste). El padre decide qué pasa al crear.
 */
export function WorkflowExpressNameDialog({ template, isCreating, onSubmit, onClose }: WorkflowExpressNameDialogProps) {
  const { t } = useTranslation("workflow")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Cada template distinto arranca con el formulario vacío.
  useEffect(() => {
    setName("")
    setDescription("")
  }, [template?.id, template?.relation_name])

  const canSubmit = name.trim().length > 0 && !isCreating

  const submit = () => {
    if (!canSubmit) return
    onSubmit(name.trim(), description.trim() || undefined)
  }

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && !isCreating && onClose()}>
      <DialogContent showCloseButton={false} className="gap-4 p-5 sm:max-w-105">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base">{t("launcher.nameDialog.title", { name: template?.name ?? "" })}</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            {template?.relation_name
              ? t("launcher.nameDialog.createdIn", { relation: template.relation_name })
              : t("launcher.nameDialog.createdInRoot")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workflow-express-name" className="text-xs font-normal text-muted-foreground">
            {t("expressSheet.name")}
            <span className="text-destructive"> *</span>
          </Label>
          <Input
            id="workflow-express-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              submit()
            }}
            placeholder={template?.name_placeholder ?? t("expressSheet.namePlaceholder")}
            className="h-9.5"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workflow-express-description" className="text-xs font-normal text-muted-foreground">
            {t("launcher.nameDialog.descriptionOptional")}
          </Label>
          <Textarea
            id="workflow-express-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("expressSheet.descriptionPlaceholder")}
            rows={3}
          />
        </div>

        <DialogFooter>
          <HuemulButton variant="outline" label={t("launcher.nameDialog.cancel")} disabled={isCreating} onClick={onClose} />
          <HuemulButton
            label={isCreating ? t("launcher.starting") : t("launcher.nameDialog.submit")}
            loading={isCreating}
            disabled={!canSubmit}
            onClick={submit}
            className="disabled:cursor-not-allowed"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
