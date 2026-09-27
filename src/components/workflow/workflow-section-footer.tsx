import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";

export interface WorkflowSectionFooterProps {
  showPrev: boolean;
  /** isFormSaving del panel — gatea «◂ Anterior» (no gatea el botón primario, que pasa por exit()). */
  navDisabled: boolean;
  onPrev: () => void;
  currentIndex: number; // 0-based
  totalSections: number;
  primaryLabel: string;
  primaryIcon: LucideIcon;
  primaryDisabled: boolean;
  primaryTooltip?: string;
  onPrimaryClick: () => void;
}

/**
 * Pie de la vista 2 (una sección): «◂ Anterior · Sección n de m · botón primario». El botón
 * primario y su comportamiento (guardar+validar vs. solo navegar) los resuelve el panel — ver
 * la nota de `exit()` en workflow-detail-panel.tsx.
 */
export function WorkflowSectionFooter({
  showPrev,
  navDisabled,
  onPrev,
  currentIndex,
  totalSections,
  primaryLabel,
  primaryIcon: PrimaryIcon,
  primaryDisabled,
  primaryTooltip,
  onPrimaryClick,
}: WorkflowSectionFooterProps) {
  const { t } = useTranslation("workflow");

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {showPrev && (
          <HuemulButton variant="outline" size="sm" disabled={navDisabled} onClick={onPrev}>
            <ChevronLeft />
            <span className="hidden sm:inline">{t("wizard.back")}</span>
          </HuemulButton>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("section.counter", { current: currentIndex + 1, total: totalSections })}
      </p>
      <HuemulButton
        size="sm"
        icon={PrimaryIcon}
        iconPosition="right"
        label={primaryLabel}
        disabled={primaryDisabled}
        tooltip={primaryTooltip}
        onClick={onPrimaryClick}
      />
    </div>
  );
}
