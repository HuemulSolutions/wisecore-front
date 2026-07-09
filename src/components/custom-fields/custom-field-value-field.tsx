import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { CustomFieldValueFieldProps } from "@/types/custom-fields"
export type { CustomFieldValueFieldProps } from "@/types/custom-fields"

const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"]

export function CustomFieldValueField({
  dataType,
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
}: CustomFieldValueFieldProps) {
  const { t } = useTranslation("custom-fields")

  switch (dataType) {
    case "bool":
      return (
        <HuemulField
          type="switch"
          label={label}
          value={value === "true" || value === "1"}
          onChange={(v) => onChange(Boolean(v).toString())}
          disabled={disabled}
          error={error}
        />
      )
    case "int":
      return (
        <HuemulField
          type="number"
          label={label}
          placeholder={t("addDialog.valuePlaceholderInt")}
          value={value}
          step={1}
          onChange={(v) => {
            const strVal = String(v)
            if (strVal === "" || /^-?\d+$/.test(strVal)) onChange(strVal)
          }}
          disabled={disabled}
          error={error}
        />
      )
    case "decimal":
      return (
        <HuemulField
          type="number"
          label={label}
          placeholder={t("addDialog.valuePlaceholderDecimal")}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
    case "date":
      return (
        <HuemulField
          type="date"
          label={label}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
    case "time":
      return (
        <HuemulField
          type="time"
          label={label}
          placeholder={t("addDialog.valuePlaceholderTime")}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
    case "datetime":
      return (
        <HuemulField
          type="datetime"
          label={label}
          placeholder={t("addDialog.valuePlaceholderDatetime")}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
    case "url":
      return (
        <HuemulField
          type="url"
          label={label}
          placeholder={t("addDialog.valuePlaceholderGeneric")}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
    case "image":
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
    case "list":
      return (
        <HuemulField
          type="select"
          label={label}
          placeholder={t("addDialog.valuePlaceholderList")}
          value={value}
          onChange={(v) => onChange(String(v))}
          options={options.map((o) => ({ value: o.option_id, label: o.name }))}
          disabled={disabled}
          error={error}
        />
      )
    default:
      return (
        <HuemulField
          type="text"
          label={label}
          placeholder={t("addDialog.valuePlaceholderGeneric")}
          value={value}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
  }
}
