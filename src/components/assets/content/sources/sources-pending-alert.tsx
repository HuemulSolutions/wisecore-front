import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface SourcesPendingAlertProps {
  count: number;
  /** Abre la primera fuente pendiente. Ausente (solo lectura): la alerta informa sin acción. */
  onComplete?: () => void;
}

/** Franja ámbar: hay fuentes obligatorias sin contenido y la generación con IA está bloqueada. */
export function SourcesPendingAlert({ count, onComplete }: SourcesPendingAlertProps) {
  const { t } = useTranslation("sources");

  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200"
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[13px] text-amber-800">{t("pendingAlert.text", { count })}</p>
      {onComplete && (
        <Button
          type="button"
          size="sm"
          className="h-7 shrink-0 gap-1.5 bg-blue-600 text-[12.5px] font-semibold text-white hover:cursor-pointer hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/40"
          onClick={onComplete}
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {t("pendingAlert.action")}
        </Button>
      )}
    </div>
  );
}
