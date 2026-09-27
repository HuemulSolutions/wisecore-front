import { HuemulDetailSurface } from "@/huemul/components/huemul-detail-surface";
import { useAssetHistory } from "./asset-history-content";
import type { AssetHistorySheetProps, AssetHistoryTab } from "@/types/assets";

/**
 * Sheet lateral "Historial" del activo — reemplaza los tres historiales
 * dispersos (`SectionHistorySheet`, `LifecycleHistorySheet`, `ChangeLogTab`)
 * con un único esqueleto. Qué tabs monta depende de `tabs`: desde el botón
 * "Ver historial" de una sección llega solo `["section"]` (sheet ancho,
 * maestro-detalle); desde el menú "…" del activo, `["lifecycle", "changes"]`
 * (sheet angosto de 520px, una columna). Sin estado propio: todo lo resuelve
 * `useAssetHistory`, incluido qué layout/ancho usar.
 */
export function AssetHistorySheet(props: AssetHistorySheetProps) {
  const { open, onOpenChange } = props;
  const { icon, title, subtitle, size, tabs, activeTab, setActiveTab, footerContent, onRefresh, isRefreshing } =
    useAssetHistory(props);

  return (
    <HuemulDetailSurface
      variant="sheet"
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title={title}
      subtitle={subtitle}
      size={size}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as AssetHistoryTab)}
      footerContent={footerContent}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
