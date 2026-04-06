import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card" 
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronUp, ChevronDown, Plus, Settings, ShieldCheck } from "lucide-react"
import { ProviderActions } from "./provider-actions"
import { ModelsTable } from "@/components/llm/models-table"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { LLM } from "@/types/llm"

interface ProviderCardProps {
  provider: any
  models: LLM[]
  isOpen: boolean
  onToggle: (open: boolean) => void
  onEditProvider: (provider: any) => void | Promise<void>
  onDeleteProvider: (provider: any) => void
  onConfigureProvider: (provider: any) => void
  onCreateModel: (providerId: string) => void
  onEditModel: (model: LLM) => void
  onDeleteModel: (model: LLM) => void
  onTestModel: (model: LLM) => void
  onDefaultChange: (llmId: string, isDefault: boolean) => void
  isDeleting: boolean
  isDeletingModel: boolean
  testingModelId: string | null
  isLoadingModels?: boolean
  modelsError?: any
  openDropdowns: {[key: string]: boolean}
  onDropdownChange: (key: string, open: boolean) => void
  canCreateProvider: boolean
  canUpdateProvider: boolean
  canDeleteProvider: boolean
  canCreateModel: boolean
  canUpdateModel: boolean
  canDeleteModel: boolean
}

export function ProviderCard({
  provider,
  models,
  isOpen,
  onToggle,
  onEditProvider,
  onDeleteProvider,
  onConfigureProvider,
  onCreateModel,
  onEditModel,
  onDeleteModel,
  onTestModel,
  onDefaultChange,
  isDeleting,
  isDeletingModel,
  testingModelId,
  isLoadingModels,
  modelsError,
  openDropdowns,
  onDropdownChange,
  canCreateProvider,
  canUpdateProvider,
  canDeleteProvider,
  canCreateModel,
  canUpdateModel,
  canDeleteModel
}: ProviderCardProps) {
  const { t } = useTranslation('models')

  const status = {
    configured: provider.isConfigured === true,
    modelCount: models.length
  }

  return (
    <Card className="border border-border bg-card">
      <Collapsible 
        open={isOpen} 
        onOpenChange={onToggle}
        className="h-auto"
      >
        <div className="flex w-full items-center p-3">
          <CollapsibleTrigger
            className="flex items-center gap-2 text-left hover:bg-muted/20 rounded-md p-1.5 flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground">
                {(provider.display_name || provider.name).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground">{provider.name}</h3>
                {provider.is_managed && (
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{provider.display_name}</Badge>
                <span className="text-muted-foreground text-[10px]">•</span>
                <span className="text-muted-foreground text-[10px]">
                  {status.modelCount === 1 ? t('providerCard.model', { count: status.modelCount }) : t('providerCard.models', { count: status.modelCount })}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mr-1">
            {provider.isConfigured ? (
              (canUpdateProvider || canDeleteProvider) && (
                <ProviderActions
                  provider={provider}
                  onEdit={onEditProvider}
                  onDelete={onDeleteProvider}
                  isDeleting={isDeleting}
                  dropdownOpen={openDropdowns[`provider-${provider.id}`] || false}
                  onDropdownChange={(open) => onDropdownChange(`provider-${provider.id}`, open)}
                  canUpdate={canUpdateProvider}
                  canDelete={canDeleteProvider}
                />
              )
            ) : (
              canCreateProvider && (
                <HuemulButton
                  icon={Settings}
                  label={t('common:configure')}
                  size="sm"
                  className="h-7 text-xs bg-[#4464f7] hover:bg-[#3451e6]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigureProvider(provider)
                  }}
                />
              )
            )}
          </div>

          {/* Chevron button */}
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
            {provider.isConfigured ? (
              <>
                {/* Models Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-sm text-foreground">{t('providerCard.modelsSection')}</h4>
                    {canCreateModel && (
                      <HuemulButton
                        icon={Plus}
                        label={t('actions.addModel')}
                        size="sm"
                        onClick={() => onCreateModel(provider.id)}
                      />
                    )}
                  </div>
                  {isLoadingModels ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">{t('providerCard.loadingModels')}</div>
                    </div>
                  ) : modelsError ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-red-500 mb-2">{t('errors.failedToLoadModels')}</div>
                      <div className="text-xs text-muted-foreground">{t('errors.errorLoadingModels')}</div>
                    </div>
                  ) : (
                    <ModelsTable
                      models={models}
                      onEdit={onEditModel}
                      onDelete={onDeleteModel}
                      onTest={onTestModel}
                      onDefaultChange={onDefaultChange}
                      isDeleting={isDeletingModel}
                      testingModelId={testingModelId}
                      openDropdowns={openDropdowns}
                      onDropdownChange={onDropdownChange}
                      canUpdate={canUpdateModel}
                      canDelete={canDeleteModel}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Configuration Section for unconfigured providers */}
                <div className="text-center py-6">
                  <div className="mb-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        {(provider.display_name || provider.name)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{(provider.display_name || provider.name)}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {canCreateProvider 
                        ? t('providerCard.configureToStart')
                        : t('providerCard.noPermissionConfigure')
                      }
                    </p>
                  </div>
                  {canCreateProvider && (
                    <Button
                      onClick={() => onConfigureProvider(provider)}
                      className="hover:cursor-pointer"
                    >
                      {t('common:configureProvider')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  )
}
