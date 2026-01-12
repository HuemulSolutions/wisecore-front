import { Shield, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import ProtectedComponent from "@/components/protected-component"
import { Button } from "@/components/ui/button"

interface AuthTypesHeaderProps {
  authTypesCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}

export function AuthTypesHeader({ 
  authTypesCount, 
  isLoading, 
  onRefresh, 
  onCreateClick,
  hasError 
}: AuthTypesHeaderProps) {
  return (
    <PageHeader
      icon={Shield}
      title="Authentication Types"
      badges={[
        { label: "", value: `${authTypesCount} auth types` }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={{
        label: "Add Auth Type",
        icon: Plus,
        onClick: onCreateClick,
        protectedContent: (
          <ProtectedComponent requireRootAdmin>
            <Button 
              size="sm"
              onClick={onCreateClick}
              disabled={hasError}
              className="hover:cursor-pointer h-8 text-xs px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Auth Type
            </Button>
          </ProtectedComponent>
        )
      }}
    />
  )
}