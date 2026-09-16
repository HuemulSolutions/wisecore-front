import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";

interface ViewModeToggleProps {
  isViewMode: boolean;
  onSwitchToReader: () => void;
  onSwitchToEditor: () => void;
  /** Header angosto: oculta la etiqueta de texto, deja solo icono + tooltip. */
  compact?: boolean;
}

const baseButtonClass =
  "h-7 gap-1.5 text-[12.5px] font-medium rounded-[6px] border-0 transition-colors hover:cursor-pointer whitespace-nowrap";
const activeButtonClass = "bg-white text-[#0f172a] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.12)]";
const inactiveButtonClass = "bg-transparent text-[#64748b] hover:text-[#0f172a]";

export function ViewModeToggle({ isViewMode, onSwitchToReader, onSwitchToEditor, compact = false }: ViewModeToggleProps) {
  const { t } = useTranslation(["assets"]);

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-[9px] bg-[#f2f5f8]">
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToReader}
        icon={Eye}
        iconClassName="h-[13px] w-[13px] stroke-[1.9]"
        label={compact ? undefined : t("content.reader")}
        tooltip={t("content.readerMode")}
        className={`${baseButtonClass} ${compact ? "px-[7px]" : "px-[9px]"} ${
          isViewMode ? activeButtonClass : inactiveButtonClass
        }`}
      />
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToEditor}
        icon={Pencil}
        iconClassName="h-[13px] w-[13px] stroke-[1.9]"
        label={compact ? undefined : t("content.editor")}
        tooltip={t("content.editorMode")}
        className={`${baseButtonClass} ${compact ? "px-[7px]" : "px-[9px]"} ${
          !isViewMode ? activeButtonClass : inactiveButtonClass
        }`}
      />
    </div>
  );
}
