"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { useTagMutations } from "@/hooks/useTags"
import { TagFormFields } from "./tags-form-fields"
import type { EditTagSheetProps, TagFormData } from '@/types/tags'

export type { EditTagSheetProps } from '@/types/tags'

export function TagsEditSheet({ open, onOpenChange, tag, canUpdate = false }: EditTagSheetProps) {
  const { t } = useTranslation(['tags', 'common'])
  const [formData, setFormData] = useState<TagFormData>({ name: "", color: null, description: null })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { updateTag } = useTagMutations()

  // Re-precargar cada vez que se abre el diálogo sobre una etiqueta —
  // evita mostrar datos rancios de una edición anterior.
  useEffect(() => {
    if (tag && open) {
      setFormData({ name: tag.name, color: tag.color, description: tag.description })
      setErrors({})
    }
  }, [tag, open])

  if (!canUpdate) return null

  const handleChange = <K extends keyof TagFormData>(field: K, value: TagFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = t('form.nameRequired')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!tag) return
    if (!validate()) return

    await new Promise<void>((resolve, reject) => {
      updateTag.mutate(
        {
          tagId: tag.id,
          data: {
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description,
          },
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      )
    })
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('editDialog.title')}
      icon={Edit}
      size="md"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('common:update'),
        onClick: handleSubmit,
      }}
    >
      <TagFormFields formData={formData} onChange={handleChange} errors={errors} />
    </HuemulSheet>
  )
}
