import { Link2, Type, Upload, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SourcesAddCardsProps {
  /** Cuerpo angosto: una columna y el subtítulo pasa a ser la descripción larga. */
  narrow: boolean;
  onLinkAsset: () => void;
  onUploadFile: () => void;
  onPasteText: () => void;
}

interface CardDef {
  key: "link" | "upload" | "paste";
  icon: LucideIcon;
  onClick: () => void;
}

/** Tres tarjetas para sumar fuentes. Solo se renderiza cuando el usuario puede editar. */
export function SourcesAddCards({ narrow, onLinkAsset, onUploadFile, onPasteText }: SourcesAddCardsProps) {
  const { t } = useTranslation("sources");

  const cards: CardDef[] = [
    { key: "link", icon: Link2, onClick: onLinkAsset },
    { key: "upload", icon: Upload, onClick: onUploadFile },
    { key: "paste", icon: Type, onClick: onPasteText },
  ];

  return (
    <div
      role="group"
      aria-label={t("add.title")}
      className={cn("grid gap-2", narrow ? "grid-cols-1" : "grid-cols-3")}
    >
      {cards.map(({ key, icon: Icon, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className="flex items-center gap-3 rounded-[10px] bg-white px-3 py-[11px] text-left ring-1 ring-inset ring-gray-200 outline-none transition-colors hover:cursor-pointer hover:bg-[#f8fbff] hover:ring-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-slate-900">{t(`add.${key}.title`)}</span>
            <span className="block text-xs text-slate-500">
              {narrow ? t(`add.${key}.description`) : t(`add.${key}.subtitle`)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
