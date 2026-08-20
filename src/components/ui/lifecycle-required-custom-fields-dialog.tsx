import { useTranslation } from "react-i18next"
import { AlertTriangle, SlidersHorizontal } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"

interface LifecycleRequiredCustomFieldsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Nombres de los campos obligatorios sin valor, en el orden que los reportó el backend / la lista local. */
  fieldNames: string[]
  /** Omitir para ocultar el botón: la superficie no tiene tab de campos personalizados. */
  onGoToCustomFields?: () => void
}

/**
 * Diálogo reactivo para CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING: se
 * abre en vez del toast genérico cuando el backend rechaza la salida de
 * `draft` (o la aprobación) por custom fields obligatorios sin valor.
 */
export function LifecycleRequiredCustomFieldsDialog({
  open,
  onOpenChange,
  fieldNames,
  onGoToCustomFields,
}: LifecycleRequiredCustomFieldsDialogProps) {
  const { t } = useTranslation(["assets", "common"])

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lifecycle.requiredCustomFields.errorTitle")}
      description={t("lifecycle.requiredCustomFields.errorDescription")}
      icon={AlertTriangle}
      iconClassName="text-destructive"
      maxWidth="sm:max-w-lg"
      cancelLabel={t("common:close")}
      saveAction={
        onGoToCustomFields
          ? {
              label: t("lifecycle.requiredCustomFields.goToFields"),
              icon: SlidersHorizontal,
              onClick: onGoToCustomFields,
            }
          : undefined
      }
    >
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
        {fieldNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </HuemulDialog>
  )
}
