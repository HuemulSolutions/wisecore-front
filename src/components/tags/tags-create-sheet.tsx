"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { useTagMutations } from "@/hooks/useTags"
import { TagFormFields } from "./tags-form-fields"
import type { CreateTagSheetProps, TagFormData } from '@/types/tags'

export type { CreateTagSheetProps } from '@/types/tags'

const EMPTY_FORM: TagFormData = { name: "", color: null, description: null }

export function TagsCreateSheet({ open, onOpenChange, canCreate = false }: CreateTagSheetProps) {
  const { t } = useTranslation(['tags', 'common'])
  const [formData, setFormData] = useState<TagFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createTag } = useTagMutations()

  if (!canCreate) return null

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
    if (!validate()) return

    await new Promise<void>((resolve, reject) => {
      createTag.mutate(
        {
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description,
        },
        {
          onSuccess: () => {
            setFormData(EMPTY_FORM)
            setErrors({})
            resolve()
          },
          onError: (error) => reject(error),
        }
      )
    })
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('createDialog.title')}
      icon={Plus}
      size="md"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('common:create'),
        onClick: handleSubmit,
      }}
    >
      <TagFormFields formData={formData} onChange={handleChange} errors={errors} />
    </HuemulSheet>
  )
}
