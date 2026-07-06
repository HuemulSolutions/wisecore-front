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
    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg gap-0.5">
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToReader}
        icon={Eye}
        iconClassName="h-3.5 w-3.5"
        label={t("content.reader")}
        className={`h-8 px-2.5 gap-1.5 text-xs font-medium rounded-md transition-all hover:cursor-pointer ${
          isViewMode
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      />
      <HuemulButton
        size="sm"
        variant="ghost"
        onClick={onSwitchToEditor}
        icon={Pencil}
        iconClassName="h-3.5 w-3.5"
        label={t("content.editor")}
        className={`h-8 px-2.5 gap-1.5 text-xs font-medium rounded-md transition-all hover:cursor-pointer ${
          !isViewMode
            ? "bg-[#4464f7] text-white hover:bg-[#3451e6] hover:text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      />
    </div>
  );
}
