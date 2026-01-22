import { Settings } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

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
  onRefresh 
}: ModelsHeaderProps) {
  return (
    <PageHeader
      icon={Settings}
      title="Models Configuration"
      badges={[
        { label: "", value: `${configuredProviders} configured providers` },
        { label: "", value: `${totalModels} models` }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  )
}