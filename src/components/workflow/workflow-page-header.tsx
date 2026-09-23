import { Workflow } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"

interface WorkflowPageHeaderProps {
  count: number
  searchTerm: string
  onSearchChange: (value: string) => void
  activeCount: number
  filtersOpen: boolean
  onToggleFilters: () => void
  onRefresh: () => void
  isLoading: boolean
}

// Header full-width del layout (patrón `/users`, ver
// ia context/huemul-page-layout-guide.md). El botón Filtros vive en `children`
// (se renderiza antes del buscador, ver huemul-page-header.tsx); el panel
// lateral y los chips los sigue manejando la página.
export function WorkflowPageHeader({
  count,
  searchTerm,
  onSearchChange,
  activeCount,
  filtersOpen,
  onToggleFilters,
  onRefresh,
  isLoading,
}: WorkflowPageHeaderProps) {
  const { t } = useTranslation("workflow")

  return (
    <PageHeader
      icon={Workflow}
      title={t("header.title")}
      badges={[
        { label: "", value: t("header.workflowsCount", { count }) },
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      searchConfig={{
        placeholder: t("filters.searchPlaceholder"),
        value: searchTerm,
        onChange: onSearchChange,
        debounceMs: 300,
      }}
    >
      <HuemulFilterButton
        count={activeCount}
        open={filtersOpen}
        onToggle={onToggleFilters}
        className="h-8 shrink-0 rounded-lg px-2 text-xs"
      />
    </PageHeader>
  )
}
