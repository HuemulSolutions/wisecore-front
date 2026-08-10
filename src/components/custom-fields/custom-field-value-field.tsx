import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulQuestionInput } from "@/huemul/components/huemul-question-input"
import type { HuemulQuestionInputValue } from "@/huemul/components/huemul-question-input"
import { QUESTION_TYPE, NUMERIC_DATA_TYPES } from "@/components/sections/question-type-meta"
import type { CustomFieldValueFieldProps } from "@/types/custom-fields"
export type { CustomFieldValueFieldProps } from "@/types/custom-fields"

const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"]

// question_type que HuemulQuestionInput representa como boolean/number — el resto
// viaja como string. Deben coincidir con los widgets de huemul-question-input.tsx.
const BOOLEAN_QUESTION_TYPES: string[] = [QUESTION_TYPE.yesNo]
const NUMBER_QUESTION_TYPES: string[] = [
  QUESTION_TYPE.number,
  QUESTION_TYPE.decimal,
  QUESTION_TYPE.linearScale,
  QUESTION_TYPE.rating,
]

function isBooleanField(dataType: string, questionType?: string): boolean {
  return questionType ? BOOLEAN_QUESTION_TYPES.includes(questionType) : dataType === "bool"
}

function isNumberField(dataType: string, questionType?: string): boolean {
  if (questionType) return NUMBER_QUESTION_TYPES.includes(questionType)
  return NUMERIC_DATA_TYPES.includes(dataType)
}

// Mismo criterio de placeholders que el componente tenía antes de delegar el
// mapeo de widgets a HuemulQuestionInput (question_type primero, data_type como fallback).
function resolvePlaceholder(dataType: string, questionType: string | undefined, t: TFunction): string | undefined {
  switch (questionType) {
    case QUESTION_TYPE.number:
      return t("addDialog.valuePlaceholderInt")
    case QUESTION_TYPE.decimal:
      return t("addDialog.valuePlaceholderDecimal")
    case QUESTION_TYPE.dropdown:
      return t("addDialog.valuePlaceholderList")
  }
  switch (dataType) {
    case "int":
      return t("addDialog.valuePlaceholderInt")
    case "decimal":
      return t("addDialog.valuePlaceholderDecimal")
    case "time":
      return t("addDialog.valuePlaceholderTime")
    case "datetime":
      return t("addDialog.valuePlaceholderDatetime")
    case "url":
      return t("addDialog.valuePlaceholderGeneric")
    case "list":
      return t("addDialog.valuePlaceholderList")
    case "date":
    case "bool":
      return undefined
    default:
      return t("addDialog.valuePlaceholderGeneric")
  }
}

export function CustomFieldValueField({
  dataType,
  questionType,
  label,
  value,
  onChange,
  options = [],
  error,
  disabled = false,
  onImageFile,
  onImageValidationError,
  isUploadingImage = false,
  imageUploadDescription,
  minValue,
  maxValue,
  minLabel,
  maxLabel,
}: CustomFieldValueFieldProps) {
  const { t } = useTranslation("custom-fields")

  // Carga de imagen: flujo de upload propio (blob por custom field) — no delega a
  // HuemulQuestionInput, que no maneja archivos (ver comentario en ese componente).
  if (dataType === "image") {
    return (
      <HuemulField
        type="file"
        label={label}
        accept=".png,.jpg,.jpeg,.gif,.bmp"
        disabled={disabled || isUploadingImage}
        description={!isUploadingImage ? imageUploadDescription : undefined}
        error={error}
        onFileChange={(files) => {
          const file = files?.[0]
          if (!file) return
          const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
          if (!VALID_IMAGE_EXTENSIONS.includes(ext)) {
            onImageValidationError?.(t("addDialog.invalidImageType"))
            return
          }
          onChange(file.name)
          onImageFile?.(file)
        }}
      >
        {isUploadingImage && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("addDialog.uploadingImage")}</span>
          </div>
        )}
      </HuemulField>
    )
  }

  // Adaptador entre el contrato string|string[] de este componente (el que persisten
  // los sheets de template/asset) y el valor tipado que espera HuemulQuestionInput —
  // el mismo mapeo question_type→widget que usa el runtime de respuesta de formulario.
  const toQuestionInputValue = (): HuemulQuestionInputValue => {
    if (Array.isArray(value)) return value
    if (isBooleanField(dataType, questionType)) return value === "true" || value === "1"
    if (isNumberField(dataType, questionType)) return value === "" ? null : Number(value)
    return value
  }

  const handleChange = (v: HuemulQuestionInputValue) => {
    if (Array.isArray(v)) { onChange(v); return }
    if (v === null) { onChange(""); return }
    if (typeof v === "boolean") { onChange(v.toString()); return }
    onChange(String(v))
  }

  return (
    <HuemulQuestionInput
      questionType={questionType}
      dataType={dataType}
      label={label}
      placeholder={resolvePlaceholder(dataType, questionType, t)}
      value={toQuestionInputValue()}
      onChange={handleChange}
      options={options}
      noValueLabel={t("addDialog.noValueOption")}
      min={typeof minValue === "number" ? minValue : undefined}
      max={typeof maxValue === "number" ? maxValue : undefined}
      minLabel={minLabel}
      maxLabel={maxLabel}
      error={error}
      disabled={disabled}
    />
  )
}
