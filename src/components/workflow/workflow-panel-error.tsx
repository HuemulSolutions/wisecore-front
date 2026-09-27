import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkflowStatusCard } from "@/components/workflow/workflow-status-card";

export interface WorkflowPanelErrorProps {
  onRetry: () => void;
}

/** Error de carga de /content: la query tiene retry:0, así que `onRetry` (handleRefresh) —
 *  invalidateQueries — es el reintento correcto. Usa el contenedor común de estados; el
 *  contenedor scrollable del panel va en p-0 para esta rama (ver workflow-detail-panel.tsx). */
export function WorkflowPanelError({ onRetry }: WorkflowPanelErrorProps) {
  const { t } = useTranslation("workflow");
  const { t: tCommon } = useTranslation("common");

  return (
    <WorkflowStatusCard
      icon={AlertCircle}
      tone="red"
      title={t("panel.loadError")}
      primaryAction={{ label: tCommon("retry"), icon: RotateCcw, onClick: onRetry, style: "retry" }}
    />
  );
}
