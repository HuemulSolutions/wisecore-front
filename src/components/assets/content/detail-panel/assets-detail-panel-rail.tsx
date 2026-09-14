import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetDetailPanelRailItem, AssetDetailPanelTab } from "@/types/assets";

export interface AssetsDetailPanelRailProps {
  items: AssetDetailPanelRailItem[];
  activeTab: AssetDetailPanelTab;
  onSelectTab: (tab: AssetDetailPanelTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  collapseLabel: string;
  expandLabel: string;
}

/**
 * Rail vertical de 52px del panel de detalle del activo: cuatro destinos
 * (Índice/Campos/Archivos/Vínculos, filtrados por permiso) + chevron de colapso.
 * El activo se resalta con los tokens `--adp-accent-bg`/`--adp-accent-fg`.
 */
export function AssetsDetailPanelRail({
  items,
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  collapseLabel,
  expandLabel,
}: AssetsDetailPanelRailProps) {
  const visibleItems = items.filter((item) => item.visible);

  return (
    <div
      className="flex h-full w-13 shrink-0 flex-col items-center border-r py-2"
      style={{ backgroundColor: "var(--adp-rail-bg, var(--muted))", borderColor: "var(--adp-border, var(--border))" }}
    >
      <div className="flex flex-1 flex-col items-center gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              className="relative flex w-11 flex-col items-center gap-0.5 rounded-md py-1.5 text-center hover:cursor-pointer"
              style={
                isActive
                  ? { backgroundColor: "var(--adp-accent-bg, var(--accent))", color: "var(--adp-accent-fg, var(--primary))" }
                  : undefined
              }
            >
              <span className={cn("relative", !isActive && "text-muted-foreground")}>
                <Icon className="h-4 w-4" />
                {!!item.count && item.count > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-semibold text-white"
                    style={{ backgroundColor: "var(--adp-accent-fg, var(--primary))" }}
                  >
                    {item.count > 99 ? "99+" : item.count}
                  </span>
                )}
              </span>
              <span className={cn("line-clamp-2 text-center text-[9px] leading-tight", !isActive && "text-muted-foreground")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleCollapse}
        title={isCollapsed ? expandLabel : collapseLabel}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:cursor-pointer hover:bg-muted hover:text-foreground"
      >
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform duration-180"
          style={{ transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  );
}
