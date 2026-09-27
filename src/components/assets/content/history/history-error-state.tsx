import { useState } from "react";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { buildErrorReport, formatErrorReport } from "@/lib/error-report";

/** Estado de error del sheet de historial — comparten los dos layouts (wide y narrow). */
export function HistoryErrorState({ error, endpoint, onRetry }: { error: unknown; endpoint: string; onRetry: () => void }) {
  const { t } = useTranslation(["assets", "common", "error-details"]);
  const [copied, setCopied] = useState(false);
  const report = buildErrorReport(error);

  const handleCopy = () => {
    void (async () => {
      try {
        const text = report
          ? formatErrorReport(report, t)
          : `${t("assetHistory.errorEndpoint")}: ${endpoint}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error(t("error-details:copyFailed"));
      }
    })();
  };

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <AlertCircle className="size-8 text-[#fca5a5]" />
      <p className="text-sm font-medium text-[#0f172a]">{t("assetHistory.errorTitle")}</p>
      <p className="font-mono text-[11px] text-[#64748b]">
        {t("assetHistory.errorEndpoint")}: {endpoint}
        {report?.code ? ` · ${report.code}` : ""}
        {report?.statusCode ? ` ${report.statusCode}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <HuemulButton variant="outline" size="sm" label={t("common:tryAgain")} onClick={onRetry} />
        <HuemulButton
          variant="outline"
          size="sm"
          icon={copied ? Check : Copy}
          label={t("assetHistory.copyDetail")}
          onClick={handleCopy}
        />
      </div>
    </div>
  );
}
