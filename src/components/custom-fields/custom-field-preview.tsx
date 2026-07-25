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
}

export function CustomFieldPreview({
  name,
  dataType,
  questionType,
  options,
  minValue,
  maxValue,
}: CustomFieldPreviewProps) {
  const { t } = useTranslation("custom-fields")

  if (!questionType && !dataType) return null

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{t('form.preview.label')}</p>
      <QuestionTypePreview
        questionType={questionType}
        dataType={dataType}
        options={options}
        minValue={minValue}
        maxValue={maxValue}
        fieldName={name || t('form.preview.unnamedLabel')}
      />
    </div>
  )
}
