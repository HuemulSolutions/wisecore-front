import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import type { CustomFieldInfoCardProps } from "@/types/custom-fields"
export type { CustomFieldInfoCardProps } from "@/types/custom-fields"

export function CustomFieldInfoCard({
  title,
  name,
  dataType,
  description,
  formatDataType,
}: CustomFieldInfoCardProps) {
  const { t } = useTranslation(["custom-fields", "common"])

  return (
    <div className="space-y-3 p-4 bg-muted rounded-lg">
      <h3 className="font-medium text-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">{t("common:name")}</Label>
          <p className="font-medium">{name}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t("custom-fields:columns.dataType")}</Label>
          <p className="font-medium">{formatDataType(dataType)}</p>
        </div>
        {description && (
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">{t("custom-fields:columns.description")}</Label>
            <p className="font-medium">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
