import * as React from "react";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { HuemulInfoSection, HuemulInfoGroup, HuemulInfoItem } from "@/huemul/components/huemul-info-display";
import { errorReportStore } from "@/lib/error-report-store";
import { formatErrorReport } from "@/lib/error-report";

/**
 * Dialog global de detalles de error. Se monta una única vez en main.tsx,
 * fuera de AppErrorBoundary. Lee el reporte activo desde `errorReportStore`
 * — abierto por `handleApiError` (src/lib/error-utils.ts) cuando el usuario
 * hace click en "Ver detalles" en el toast de error.
 *
 * No es un componente huemul-*: contiene semántica de error propia de la
 * app (importa el store), no un widget genérico reutilizable.
 */
export function ErrorDetailsDialog(): React.JSX.Element | null {
  const { t } = useTranslation(["error-details", "common"]);
  const report = React.useSyncExternalStore(errorReportStore.subscribe, errorReportStore.getSnapshot);
  const [copied, setCopied] = React.useState(false);

  // Reset del ícono de copiado cuando cambia o se cierra el reporte activo.
  React.useEffect(() => {
    setCopied(false);
  }, [report]);

  if (!report) return null;

  const handleCopy = () => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(formatErrorReport(report, t));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error(t("error-details:copyFailed"));
      }
    })();
  };

  return (
    <HuemulDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) errorReportStore.close();
      }}
      title={t("error-details:title")}
      description={t("error-details:description")}
      icon={AlertCircle}
      iconClassName="text-destructive"
      maxWidth="sm:max-w-3xl"
      showCancelButton
      cancelLabel={t("common:close")}
      extraActions={[
        {
          label: t("error-details:copyReport"),
          icon: copied ? Check : Copy,
          variant: "secondary",
          closeOnSuccess: false,
          onClick: handleCopy,
        },
      ]}
    >
      <div className="flex flex-col gap-3">
        {/* Mensaje y detalle a ancho completo: son texto libre del backend,
            no caben alineados a la derecha en una fila horizontal. */}
        <HuemulInfoGroup>
          <HuemulInfoItem label={t("error-details:message")} value={report.message} />
          <HuemulInfoItem label={t("error-details:detail")} value={report.detail} hideWhenEmpty />
        </HuemulInfoGroup>

        <HuemulInfoSection title={t("error-details:sectionError")}>
          <HuemulInfoItem label={t("error-details:code")} value={report.code} variant="mono" copyable hideWhenEmpty />
          <HuemulInfoItem label={t("error-details:statusCode")} value={report.statusCode} hideWhenEmpty />
          <HuemulInfoItem label={t("error-details:path")} value={report.path} variant="mono" copyable hideWhenEmpty />
          <HuemulInfoItem
            label={t("error-details:transactionId")}
            value={report.transactionId}
            variant="mono"
            copyable
            hideWhenEmpty
          />
          <HuemulInfoItem label={t("error-details:timestamp")} value={report.timestamp} hideWhenEmpty />
        </HuemulInfoSection>

        <HuemulInfoSection title={t("error-details:sectionContext")}>
          <HuemulInfoItem label={t("error-details:route")} value={report.route} hideWhenEmpty />
          <HuemulInfoItem label={t("error-details:appVersion")} value={report.appVersion} hideWhenEmpty />
          <HuemulInfoItem label={t("error-details:clientTime")} value={report.capturedAt} hideWhenEmpty />
        </HuemulInfoSection>
      </div>
    </HuemulDialog>
  );
}
