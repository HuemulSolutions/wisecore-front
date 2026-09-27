import { useTranslation } from "react-i18next"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import type { AdvanceBlocker } from "@/types/assets"

interface LifecycleAdvanceBlockersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Secciones con obligatorios sin valor, en el orden que las reportó el backend. */
  blockers: AdvanceBlocker[]
  /** Omitir para ocultar el botón: la superficie no puede navegar a una sección puntual. */
  onGoToSection?: () => void
}

/**
 * Diálogo reactivo para REQUIRED_ANSWERS_PENDING: se abre en vez del toast
 * genérico cuando el backend rechaza `complete`/`advance` por respuestas
 * obligatorias pendientes en alguna sección tipo formulario. Molde:
 * `LifecycleRequiredCustomFieldsDialog`.
 */
export function LifecycleAdvanceBlockersDialog({
  open,
  onOpenChange,
  blockers,
  onGoToSection,
}: LifecycleAdvanceBlockersDialogProps) {
  const { t } = useTranslation(["assets", "common"])

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lifecycle.advanceBlockers.errorTitle")}
      description={t("lifecycle.advanceBlockers.errorDescription")}
      icon={AlertTriangle}
      iconClassName="text-destructive"
      maxWidth="sm:max-w-lg"
      cancelLabel={t("common:close")}
      saveAction={
        onGoToSection
          ? {
              label: t("lifecycle.advanceBlockers.goToSection"),
              icon: ArrowRight,
              onClick: onGoToSection,
            }
          : undefined
      }
    >
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
        {blockers.map((blocker) => (
          <li key={blocker.section_execution_id}>
            {t("lifecycle.advanceBlockers.sectionItem", {
              section: blocker.section_name,
              count: blocker.missing_required,
            })}
          </li>
        ))}
      </ul>
    </HuemulDialog>
  )
}
