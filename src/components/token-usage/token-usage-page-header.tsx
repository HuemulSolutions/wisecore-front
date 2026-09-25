import { Coins } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { TokenUsagePeriodSelector, type TokenUsagePeriodSelectorProps } from "./token-usage-period-selector"

export interface TokenUsagePageHeaderProps {
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  periodProps: TokenUsagePeriodSelectorProps
}

export function TokenUsagePageHeader({ onRefresh, isLoading, hasError, periodProps }: TokenUsagePageHeaderProps) {
  const { t } = useTranslation("token-usage")

  return (
    <PageHeader icon={Coins} title={t("header.title")} onRefresh={onRefresh} isLoading={isLoading} hasError={hasError}>
      <TokenUsagePeriodSelector {...periodProps} />
    </PageHeader>
  )
}
