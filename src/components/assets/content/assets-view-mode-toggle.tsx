import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ViewModeToggleProps {
  isViewMode: boolean;
  onSwitchToReader: () => void;
  onSwitchToEditor: () => void;
  /** Header angosto: oculta la etiqueta de texto, deja solo icono + tooltip. */
  compact?: boolean;
}

const itemClass =
  "group h-[26px] gap-1.5 rounded-md px-2.5 text-[12.5px] font-semibold whitespace-nowrap hover:cursor-pointer " +
  "bg-transparent text-slate-500 hover:text-slate-900 " +
  "data-[state=on]:bg-white data-[state=on]:text-slate-900 " +
  "data-[state=on]:shadow-[0_1px_2px_rgba(15,23,42,0.1),0_0_0_1px_rgba(15,23,42,0.04)]";
const iconClass =
  "h-3.5 w-3.5 shrink-0 text-slate-400 group-data-[state=on]:text-blue-600";

export function ViewModeToggle({ isViewMode, onSwitchToReader, onSwitchToEditor, compact = false }: ViewModeToggleProps) {
  const { t } = useTranslation(["assets"]);

  return (
    <ToggleGroup
      type="single"
      value={isViewMode ? "reader" : "editor"}
      // Radix emite "" al pulsar el ítem activo: no se permite deseleccionar.
      onValueChange={(value) => {
        if (value === "reader") onSwitchToReader();
        else if (value === "editor") onSwitchToEditor();
      }}
      aria-label={t("content.viewModeLabel")}
      className="shrink-0 gap-0.5 rounded-[9px] border border-[#e8ecf2] bg-slate-100 p-[3px]"
    >
      <ToggleGroupItem
        value="reader"
        aria-label={t("content.reader")}
        title={t("content.readerMode")}
        className={itemClass}
      >
        <Eye className={iconClass} />
        {!compact && <span>{t("content.reader")}</span>}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="editor"
        aria-label={t("content.editor")}
        title={t("content.editorMode")}
        className={itemClass}
      >
        <Pencil className={iconClass} />
        {!compact && <span>{t("content.editor")}</span>}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
