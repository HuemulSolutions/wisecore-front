import { Network, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"

interface ExternalSystemsPageHeaderProps {
  systemsCount: number
  searchValue: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}

export function ExternalSystemsPageHeader({
  systemsCount,
  searchValue,
  onSearchChange,
  isLoading,
  onRefresh,
  onCreateClick,
  hasError,
}: ExternalSystemsPageHeaderProps) {
  const { t } = useTranslation("external-systems")

  return (
    <PageHeader
      icon={Network}
      title={t("header.title")}
      badges={[
        { label: "", value: t("header.systemsCount", { count: systemsCount }) },
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={{
        label: t("header.addSystem"),
        icon: Plus,
        onClick: onCreateClick,
        disabled: hasError,
      }}
      searchConfig={{
        placeholder: t("header.searchPlaceholder"),
        value: searchValue,
        onChange: onSearchChange,
        debounceMs: 300,
      }}
    />
  )
}
