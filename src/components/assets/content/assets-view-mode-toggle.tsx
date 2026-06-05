import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";

interface ViewModeToggleProps {
  isViewMode: boolean;
  onSwitchToReader: () => void;
  onSwitchToEditor: () => void;
}

export function ViewModeToggle({ isViewMode, onSwitchToReader, onSwitchToEditor }: ViewModeToggleProps) {
  const { t } = useTranslation(["assets"]);

  return (
    <div className="flex items-center bg-gray-100 p-0.5 rounded-md gap-0.5">
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToReader}
        icon={Eye}
        iconClassName="h-3 w-3"
        label={t("content.reader")}
        className={`h-7 px-2 gap-1 text-xs font-medium rounded transition-all hover:cursor-pointer ${
          isViewMode
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
      />
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToEditor}
        icon={Pencil}
        iconClassName="h-3 w-3"
        label={t("content.editor")}
        className={`h-7 px-2 gap-1 text-xs font-medium rounded transition-all hover:cursor-pointer ${
          !isViewMode
            ? "bg-white text-[#4464f7] shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
      />
    </div>
  );
}
