import { useTranslation } from "react-i18next"
import { QuestionTypePreview } from "@/components/sections/question-type-preview"
import type { CustomFieldOption } from "@/types/custom-fields"

interface CustomFieldPreviewProps {
  name: string
  dataType: string
  questionType: string
  options: CustomFieldOption[]
  minValue: number | null
  maxValue: number | null
  minLabel?: string
  maxLabel?: string
  required?: boolean
}

export function CustomFieldPreview({
  name,
  dataType,
  questionType,
  options,
  minValue,
  maxValue,
  minLabel,
  maxLabel,
  required,
}: CustomFieldPreviewProps) {
  const { t } = useTranslation("custom-fields")

  if (!questionType && !dataType) return null

  return (
    <QuestionTypePreview
      questionType={questionType}
      dataType={dataType}
      options={options}
      minValue={minValue}
      maxValue={maxValue}
      minLabel={minLabel}
      maxLabel={maxLabel}
      fieldName={name || t('form.preview.unnamedLabel')}
      required={required}
    />
  )
}
