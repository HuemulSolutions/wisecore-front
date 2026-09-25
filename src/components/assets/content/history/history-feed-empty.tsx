import { History } from "lucide-react";
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state";
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips";

/** Vacío explicativo (sin filtro activo): qué se registra y cuándo. */
export function HistoryFeedEmpty({ title, description }: { title: string; description: string }) {
  return <HuemulPanelEmptyState icon={History} title={title} description={description} />;
}

/** Vacío por filtro: chip activo + "Limpiar". */
export function HistoryFeedFilteredEmpty({
  title,
  chips,
  onClear,
}: {
  title: string;
  chips: { key: string; label: string }[];
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <History className="size-7 text-[#cbd5e1]" />
      <p className="text-sm text-[#475569]">{title}</p>
      <HuemulFilterChips chips={chips} onRemove={onClear} onClearAll={onClear} />
    </div>
  );
}
