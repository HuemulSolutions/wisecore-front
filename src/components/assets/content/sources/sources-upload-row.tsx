import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import type { SourceUpload } from "@/types/assets/sources";

interface SourcesUploadRowProps {
  upload: SourceUpload;
  narrow: boolean;
  onCancel: (id: string) => void;
}

/** Archivo subiéndose: todavía no existe como fuente, así que solo muestra avance y permite cancelar. */
export function SourcesUploadRow({ upload, narrow, onCancel }: SourcesUploadRowProps) {
  const { t } = useTranslation("sources");

  return (
    <div
      role="row"
      data-testid="source-upload-row"
      className={cn("flex items-center gap-3 border-t border-slate-100 py-2.5 pr-3.5", narrow ? "pl-3.5" : "pl-9")}
    >
      <div role="cell" className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <HuemulTruncatedText text={upload.name} className="text-sm font-medium text-slate-900" />
          <span className="shrink-0 text-xs font-semibold text-blue-600">
            {t("upload.uploading", { percent: upload.progress })}
          </span>
        </div>
        <p className="mb-1.5 text-xs text-slate-400">{formatBytes(upload.size)}</p>
        <Progress
          value={upload.progress}
          aria-label={t("upload.uploading", { percent: upload.progress })}
          className="h-1 bg-blue-100"
          indicatorClassName="bg-blue-600"
        />
      </div>
      <div role="cell">
        <HuemulButton
          variant="ghost"
          size="icon"
          icon={X}
          iconClassName="h-3.5 w-3.5"
          aria-label={`${t("upload.cancel")}: ${upload.name}`}
          tooltip={t("upload.cancel")}
          className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500/40"
          onClick={() => onCancel(upload.id)}
        />
      </div>
    </div>
  );
}
