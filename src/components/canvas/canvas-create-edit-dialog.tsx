"use client"

import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { LayoutPanelTop, PenLine, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCanvasMutations } from "@/hooks/useCanvas"
import type { CreateCanvasRequest, UpdateCanvasRequest, CanvasCreateEditDialogProps } from '@/types/canvas'
export type { CanvasCreateEditDialogProps } from '@/types/canvas'

const INITIAL_FORM: CreateCanvasRequest = {
  name: "",
  width: 1920,
  height: 1080,
  is_active: true,
  is_editable: true,
}

export function CanvasCreateEditDialog({
  open,
  onOpenChange,
  canvas,
  organizationId,
}: CanvasCreateEditDialogProps) {
  const { t } = useTranslation(['canvas', 'common'])
  const isEditing = !!canvas

  const [formData, setFormData] = useState<CreateCanvasRequest>(INITIAL_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutations = useCanvasMutations(organizationId)

  useEffect(() => {
    if (open) {
      if (canvas) {
        setFormData({
          name: canvas.name,
          width: canvas.width,
          height: canvas.height,
          is_active: canvas.is_active,
          is_editable: canvas.is_editable,
          properties: canvas.properties ?? undefined,
        })
      } else {
        setFormData(INITIAL_FORM)
      }
      setErrors({})
    }
  }, [open, canvas])

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!formData.name?.trim()) next.name = t('common:required', 'Required')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () =>
    new Promise<void>((resolve, reject) => {
      if (!validate()) return reject(new Error("Validation failed"))

      if (isEditing) {
        const body: UpdateCanvasRequest = {
          name: formData.name,
          width: formData.width,
          height: formData.height,
          is_active: formData.is_active,
          is_editable: formData.is_editable,
          properties: formData.properties,
        }
        mutations.updateCanvas.mutate(
          { canvasId: canvas!.id, body },
          {
            onSuccess: () => { onOpenChange(false); resolve() },
            onError: (err) => reject(err),
          }
        )
      } else {
        mutations.createCanvas.mutate(formData, {
          onSuccess: () => { onOpenChange(false); resolve() },
          onError: (err) => reject(err),
        })
      }
    })

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t('editDialog.title') : t('createDialog.title')}
      icon={isEditing ? PenLine : Plus}
      saveAction={{
        label: isEditing ? t('editDialog.saveLabel') : t('createDialog.saveLabel'),
        onClick: handleSave,
        icon: isEditing ? PenLine : LayoutPanelTop,
      }}
    >
      <HuemulFieldGroup>
        <HuemulField
          type="text"
          label={t('common:name')}
          value={formData.name}
          onChange={(val) => setFormData((prev) => ({ ...prev, name: val as string }))}
          placeholder={t('form.namePlaceholder')}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <HuemulField
            type="number"
            label={t('form.widthLabel')}
            value={formData.width ?? ""}
            onChange={(val) => setFormData((prev) => ({ ...prev, width: Number(val) || undefined }))}
            placeholder={t('form.widthPlaceholder')}
          />
          <HuemulField
            type="number"
            label={t('form.heightLabel')}
            value={formData.height ?? ""}
            onChange={(val) => setFormData((prev) => ({ ...prev, height: Number(val) || undefined }))}
            placeholder={t('form.heightPlaceholder')}
          />
        </div>
        <HuemulField
          type="switch"
          label={t('form.isActiveLabel')}
          value={formData.is_active ?? true}
          onChange={(val) => setFormData((prev) => ({ ...prev, is_active: val as boolean }))}
        />
        <HuemulField
          type="switch"
          label={t('form.isEditableLabel')}
          value={formData.is_editable ?? true}
          onChange={(val) => setFormData((prev) => ({ ...prev, is_editable: val as boolean }))}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
