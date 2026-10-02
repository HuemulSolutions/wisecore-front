import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SourcesNoticeKind = "external" | "reader" | "readOnly";

interface SourcesNoticeProps {
  kind: SourcesNoticeKind;
  /** Acción del aviso "reader": pasar el activo a modo Editor. */
  onSwitchToEditor: () => void;
}

const TONES: Record<SourcesNoticeKind, { box: string; dot: string; title: string }> = {
  external: { box: "bg-amber-50 ring-amber-200", dot: "bg-amber-500", title: "text-amber-800" },
  reader: { box: "bg-slate-50 ring-slate-200", dot: "bg-slate-400", title: "text-slate-700" },
  readOnly: { box: "bg-slate-50 ring-slate-200", dot: "bg-slate-400", title: "text-slate-700" },
};

/** Aviso contextual sobre por qué las fuentes no se pueden modificar. Prioridad la decide el caller. */
export function SourcesNotice({ kind, onSwitchToEditor }: SourcesNoticeProps) {
  const { t } = useTranslation("sources");
  const tone = TONES[kind];

  return (
    <div
      role="status"
      data-testid="sources-notice"
      data-kind={kind}
      className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2.5 ring-1 ring-inset", tone.box)}
    >
      <span className={cn("mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-semibold", tone.title)}>{t(`notice.${kind}Title`)}</p>
        <p className="text-[12.5px] text-slate-600">{t(`notice.${kind}Text`)}</p>
      </div>
      {kind === "reader" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 bg-white text-[12.5px] font-semibold text-slate-700 hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
          onClick={onSwitchToEditor}
        >
          {t("notice.readerAction")}
        </Button>
      )}
    </div>
  );
}
