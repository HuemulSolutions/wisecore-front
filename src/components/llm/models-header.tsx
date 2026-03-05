import { Blocks } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"

interface ModelsHeaderProps {
  configuredProviders: number
  totalModels: number
  isLoading: boolean
  onRefresh: () => void
}

export function ModelsHeader({ 
  configuredProviders, 
  totalModels, 
  isLoading, 
  onRefresh,
}: ModelsHeaderProps) {
  return (
    <PageHeader
      icon={Blocks}
      title="Providers"
      badges={[
        { label: "", value: `${configuredProviders} configured providers` },
        { label: "", value: `${totalModels} models` }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  )
}