import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckCircle, Circle, ChevronUp, ChevronDown, Settings } from "lucide-react"
import { ProviderActions } from "./models-provider-actions"

type EmbeddingProviderCardData = {
  id: string
  name: string
  display_name?: string
  isConfigured: boolean
}

interface EmbeddingProviderCardProps {
  provider: EmbeddingProviderCardData
  isOpen: boolean
  onToggle: (open: boolean) => void
  onEditProvider: (provider: EmbeddingProviderCardData) => void
  onDeleteProvider: (provider: EmbeddingProviderCardData) => void
  onConfigureProvider: (provider: EmbeddingProviderCardData) => void
  isDeleting: boolean
  openDropdowns: { [key: string]: boolean }
  onDropdownChange: (key: string, open: boolean) => void
  canCreateProvider: boolean
  canUpdateProvider: boolean
  canDeleteProvider: boolean
}

export function EmbeddingProviderCard({
  provider,
  isOpen,
  onToggle,
  onEditProvider,
  onDeleteProvider,
  onConfigureProvider,
  isDeleting,
  openDropdowns,
  onDropdownChange,
  canCreateProvider,
  canUpdateProvider,
  canDeleteProvider,
}: EmbeddingProviderCardProps) {
  const status = {
    configured: provider.isConfigured === true,
  }

  return (
    <Card className="border border-border bg-card">
      <Collapsible open={isOpen} onOpenChange={onToggle} className="h-auto">
        <div className="flex w-full items-center p-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/20 rounded-md p-1.5 flex-1">
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground">
                {(provider.display_name || provider.name).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground">{provider.display_name || provider.name}</h3>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                {status.configured ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <Badge className="bg-green-100/80 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5">Configured</Badge>
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0.5">Not configured</Badge>
                  </>
                )}
                <span className="text-muted-foreground text-[10px]">•</span>
                <span className="text-muted-foreground text-[10px]">Embedding provider</span>
              </div>
            </div>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2 mr-1">
            {provider.isConfigured ? (
              (canUpdateProvider || canDeleteProvider) && (
                <ProviderActions
                  provider={provider}
                  onEdit={onEditProvider}
                  onDelete={onDeleteProvider}
                  isDeleting={isDeleting}
                  dropdownOpen={openDropdowns[`embedding-provider-${provider.id}`] || false}
                  onDropdownChange={(open) => onDropdownChange(`embedding-provider-${provider.id}`, open)}
                  canUpdate={canUpdateProvider}
                  canDelete={canDeleteProvider}
                />
              )
            ) : (
              canCreateProvider && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigureProvider(provider)
                  }}
                  className="hover:cursor-pointer h-7 text-xs bg-[#4464f7] hover:bg-[#3451e6]"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              )
            )}
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:cursor-pointer h-6 w-6 p-0 hover:bg-muted/20"
            >
              {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        {isOpen && (
          <CollapsibleContent className="px-4 pt-4 pb-4 bg-muted/30 border-t border-border overflow-visible">
            <div className="text-sm text-muted-foreground">
              {provider.isConfigured
                ? `This provider is active for embeddings in your organization.`
                : canCreateProvider
                  ? `Configure this provider to enable embeddings generation.`
                  : `You don't have permission to configure this provider.`}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  )
}
