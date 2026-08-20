import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import type { HuemulFilterDef, HuemulFilterValue } from "@/types/huemul"

interface WorkflowToolbarProps {
  filters: HuemulFilterDef[]
  values: Record<string, HuemulFilterValue>
  onChange: (key: string, value: HuemulFilterValue) => void
  onSelectedLabel: (key: string, label?: string) => void
  activeCount: number
  filtersOpen: boolean
  onToggleFilters: () => void
  isRefreshing: boolean
  onRefresh: () => void
}

// Header propio de la columna central: el mockup requiere que los paneles
// laterales lleguen al tope, por eso no se usa el header full-width del
// layout (ver HuemulPageLayout `header` prop, huemul-page-layout-guide.md).
export function WorkflowToolbar({
  filters,
  values,
  onChange,
  onSelectedLabel,
  activeCount,
  filtersOpen,
  onToggleFilters,
  isRefreshing,
  onRefresh,
}: WorkflowToolbarProps) {
  const { t } = useTranslation("workflow")
  const { t: tCommon } = useTranslation("common")

  return (
    <div className="flex items-center gap-2 border-b bg-background px-2 py-1.5 sm:px-4 md:px-4 lg:px-6">
      <h1 className="min-w-0 truncate text-sm font-semibold text-foreground">{t("header.title")}</h1>
      <HuemulFilterButton
        count={activeCount}
        open={filtersOpen}
        onToggle={onToggleFilters}
        className="h-8 shrink-0 px-2 text-xs"
      />
      <HuemulFilterInline
        filters={filters}
        values={values}
        onChange={onChange}
        onSelectedLabel={onSelectedLabel}
        className="min-w-0 flex-1"
      />
      <HuemulButton
        variant="outline"
        size="sm"
        icon={RefreshCw}
        iconClassName="w-3 h-3 mr-1 text-muted-foreground"
        label={tCommon("refresh")}
        loading={isRefreshing}
        onClick={onRefresh}
        className="ml-auto h-8 shrink-0 px-2 text-xs"
      />
    </div>
  )
}
