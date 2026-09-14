import { useTranslation } from "react-i18next";
import { List } from "lucide-react";
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state";
import { TableOfContents } from "@/components/assets/content/assets-table-of-contents";
import type { TocItem } from "@/types/table-of-contents";

export interface AssetsPanelIndexTabProps {
  items: TocItem[];
  onAddSection?: () => void;
  canAddSection?: boolean;
}

/**
 * Tab "Índice" del panel de detalle — lista clicable de secciones. El scroll-spy
 * y el scroll programático viven en `TableOfContents`; este componente solo
 * arma el estado vacío y el contenedor scrolleable.
 */
export function AssetsPanelIndexTab({ items, onAddSection, canAddSection }: AssetsPanelIndexTabProps) {
  const { t } = useTranslation("assets");

  if (items.length === 0) {
    return (
      <div className="p-3">
        <HuemulPanelEmptyState
          icon={List}
          title={t("tableOfContents.emptyTitle")}
          description={t("tableOfContents.emptyHint")}
          action={canAddSection && onAddSection ? { label: t("content.addSection"), onClick: onAddSection } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-2">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1">
        <TableOfContents items={items} />
      </div>
    </div>
  );
}
