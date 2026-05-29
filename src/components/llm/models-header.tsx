import { Blocks } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { ModelsHeaderProps } from "@/types/models"
export type { ModelsHeaderProps } from "@/types/models"

export function ModelsHeader({ 
  configuredProviders, 
  totalModels, 
  isLoading, 
  onRefresh,
}: ModelsHeaderProps) {
  const { t } = useTranslation('models')

  return (
    <PageHeader
      icon={Blocks}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.configuredProviders', { count: configuredProviders }) },
        { label: "", value: t('header.models', { count: totalModels }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  )
}