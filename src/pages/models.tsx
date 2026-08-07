import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Settings, Radio, Star, Timer, Loader2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { HuemulTable } from '@/huemul/components/huemul-table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout'
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '@/huemul/constants'
import { 
  getSupportedProviders,
  getAllProviders, 
  createProvider, 
  updateProvider, 
  deleteProvider,
} from '@/services/llm-provider'
import {
  getLLMs,
  createLLM,
  updateLLMModel,
  deleteLLM,
  setDefaultLLM,
  testLLMConnection
} from '@/services/llms'
import { testImageGenerationConnection } from '@/services/image-generation'
import {
  getSupportedEmbeddingProviders,
  getEmbeddingProvider,
  createEmbeddingProvider,
  updateEmbeddingProvider,
  deleteEmbeddingProvider,
  testEmbeddingProviderConnection,
} from '@/services/embedding-provider'
import { handleApiError } from '@/lib/error-utils'
import { 
  ModelsHeader,
  ModelsLoadingState, 
  ModelsContentEmptyState,
  ModelDialog,
  DeleteModelDialog,
  ModelCapabilitiesDialog,
  ModelsDefaultBanner,
  ChangeDefaultModelDialog,
} from '@/components/llm'
import {
  EditProviderDialog,
  DeleteProviderDialog,
  CreateProviderDialog,
} from '@/components/llm-provider'
import {
  EmbeddingProviderEditDialog,
} from '@/components/embedding-provider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { LLM, CreateLLMRequest } from '@/types/models'
import type { CreateLLMProviderRequest } from '@/types/llm-provider'

function getProviderColor(name: string) {
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function Models() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('models')
  const { 
    hasPermission, 
    hasAnyPermission,
    isOrgAdmin,
    isLoading: isLoadingPermissions 
  } = useUserPermissions()
  
  // State management
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [deletingProvider, setDeletingProvider] = useState<any>(null)
  const [editingModel, setEditingModel] = useState<LLM | null>(null)
  const [deletingModel, setDeletingModel] = useState<LLM | null>(null)
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editingEmbeddingProvider, setEditingEmbeddingProvider] = useState<any>(null)
  const [deletingEmbeddingProvider, setDeletingEmbeddingProvider] = useState<any>(null)
  const [isDeletingEmbeddingProvider, setIsDeletingEmbeddingProvider] = useState(false)
  const [isCreateProviderOpen, setIsCreateProviderOpen] = useState(false)
  const [capabilitiesModel, setCapabilitiesModel] = useState<LLM | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isTestingEmbeddingProvider, setIsTestingEmbeddingProvider] = useState(false)
  const [testingModelId, setTestingModelId] = useState<string | null>(null)
  const [isChangeDefaultOpen, setIsChangeDefaultOpen] = useState(false)

  // Verificar permisos
  const canListProviders = isOrgAdmin || hasAnyPermission(['llm_provider:l', 'llm_provider:r'])
  const canCreateProvider = isOrgAdmin || hasPermission('llm_provider:c')
  const canUpdateProvider = isOrgAdmin || hasPermission('llm_provider:u')
  const canDeleteProvider = isOrgAdmin || hasPermission('llm_provider:d')
  const canListModels = isOrgAdmin || hasAnyPermission(['llm:l', 'llm:r'])
  const canCreateModel = isOrgAdmin || hasPermission('llm:c')
  const canUpdateModel = isOrgAdmin || hasPermission('llm:u')
  const canDeleteModel = isOrgAdmin || hasPermission('llm:d')

  // Queries
  const { data: supportedResponse } = useQuery({
    queryKey: ['supportedProviders'],
    queryFn: getSupportedProviders,
    retry: 0,
    enabled: canListProviders,
  })

  const { data: allProvidersResponse, isLoading: loadingProviders, error: errorProviders } = useQuery({
    queryKey: ['allProviders'],
    queryFn: () => getAllProviders(),
    retry: 0,
    enabled: canListProviders,
  })

  const { data: llmsResponse, isLoading: loadingLLMs, isFetching: fetchingLLMs, error: errorLLMs } = useQuery({
    queryKey: ['llms', page, pageSize],
    queryFn: () => getLLMs(page, pageSize),
    retry: 0,
    enabled: canListModels,
  })
  const llms: LLM[] = llmsResponse?.data || []

  const { data: embeddingSupportedResponse, error: errorEmbeddingSupportedProviders } = useQuery({
    queryKey: ['embeddingSupportedProviders'],
    queryFn: () => getSupportedEmbeddingProviders(1, 1000),
    retry: 0,
    enabled: canListProviders,
  })

  const { data: embeddingProviderResponse, error: errorEmbeddingProvider } = useQuery({
    queryKey: ['embeddingProvider'],
    queryFn: getEmbeddingProvider,
    retry: 0,
    enabled: canListProviders,
  })

  // Extract data from wrapped responses
  const supportedProviders = supportedResponse?.data || []
  const allProvidersList = allProvidersResponse?.data || []
  const embeddingSupportedProviders = embeddingSupportedResponse?.data || []
  const configuredEmbeddingProvider = embeddingProviderResponse?.data || null

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: createProvider,
    meta: { successMessage: t('toast.providerConfigured') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setEditingProvider(null)
      setIsCreateProviderOpen(false)
    },
  })

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLLMProviderRequest }) => updateProvider(id, data),
    meta: { successMessage: t('toast.providerUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setEditingProvider(null)
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    meta: { successMessage: t('toast.providerDeleted') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setDeletingProvider(null)
    },
  })

  const createLLMMutation = useMutation({
    mutationFn: createLLM,
    meta: { successMessage: t('toast.modelCreated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setIsCreateModelOpen(false)
    },
  })

  const updateLLMMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLLMRequest }) => updateLLMModel(id, data),
    meta: { successMessage: t('toast.modelUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setEditingModel(null)
    },
  })

  const deleteLLMMutation = useMutation({
    mutationFn: deleteLLM,
    meta: { successMessage: t('toast.modelDeleted') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setDeletingModel(null)
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (llmId: string) => setDefaultLLM(llmId),
    meta: { successMessage: t('toast.defaultModelUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
    },
  })

  const testLLMConnectionMutation = useMutation({
    mutationFn: testLLMConnection,
    meta: { successMessage: t('toast.connectionSuccessful') },
    onError: (error) => handleApiError(error, { fallbackMessage: t('errors.connectionFailed') }),
  })

  const testImageGenerationMutation = useMutation({
    mutationFn: testImageGenerationConnection,
    meta: { successMessage: t('toast.connectionSuccessful') },
    onError: (error) => handleApiError(error, { fallbackMessage: t('errors.connectionFailed') }),
  })

  const createEmbeddingProviderMutation = useMutation({
    mutationFn: createEmbeddingProvider,
    meta: { successMessage: t('toast.embeddingProviderConfigured') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setEditingEmbeddingProvider(null)
    },
  })

  const updateEmbeddingProviderMutation = useMutation({
    mutationFn: updateEmbeddingProvider,
    meta: { successMessage: t('toast.embeddingProviderUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setEditingEmbeddingProvider(null)
    },
  })

  const deleteEmbeddingProviderMutation = useMutation({
    mutationFn: deleteEmbeddingProvider,
    meta: { successMessage: t('toast.embeddingProviderDeleted') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setDeletingEmbeddingProvider(null)
    },
  })

  const testEmbeddingProviderMutation = useMutation({
    mutationFn: testEmbeddingProviderConnection,
    meta: { successMessage: t('toast.connectionSuccessful') },
    onError: (error) => handleApiError(error, { fallbackMessage: t('errors.connectionFailed') }),
    onSettled: () => {
      setIsTestingEmbeddingProvider(false)
    },
  })



  const getEmbeddingRequiredFields = (providerName: string) => {
    if (providerName === 'azure_openai') {
      return {
        api_key: true,
        endpoint: true,
        deployment: true,
      }
    }

    return {
      api_key: true,
      endpoint: false,
      deployment: false,
    }
  }

  const combinedEmbeddingProviders = (embeddingSupportedProviders as any[]).map((provider) => {
    const requiredFields = getEmbeddingRequiredFields(provider.name)
    const isActiveConfiguredProvider = configuredEmbeddingProvider?.name === provider.name

    return {
      ...provider,
      id: `embedding-${provider.name}`,
      display_name: provider.display,
      isConfigured: provider.is_configured === true,
      providerKey: provider.name,
      api_key: requiredFields.api_key,
      endpoint: requiredFields.endpoint,
      deployment: requiredFields.deployment,
      key: isActiveConfiguredProvider ? configuredEmbeddingProvider?.key : undefined,
      endpointValue: isActiveConfiguredProvider ? configuredEmbeddingProvider?.endpoint : undefined,
      deploymentValue: isActiveConfiguredProvider ? configuredEmbeddingProvider?.deployment : undefined,
    }
  })

  // Helper functions
  const defaultModel = llms.find((llm) => llm.is_default)
  const defaultModelProvider = defaultModel?.provider

  // Event handlers
  const handleUpdateProvider = (data: CreateLLMProviderRequest) => {
    if (!editingProvider) return
    updateProviderMutation.mutate({ id: editingProvider.id, data })
  }

  const handleCreateModel = (data: { name: string; internal_name: string; capabilities: string[]; provider_id?: string }) => {
    const payload: CreateLLMRequest = {
      name: data.name,
      internal_name: data.internal_name,
      capabilities: data.capabilities,
      provider_id: data.provider_id ?? '',
    }
    createLLMMutation.mutate(payload)
  }

  const handleUpdateModel = (data: { name: string; internal_name: string; capabilities: string[]; provider_id?: string }) => {
    if (!editingModel) return
    updateLLMMutation.mutate({ id: editingModel.id, data: { name: data.name, internal_name: data.internal_name, capabilities: data.capabilities, provider_id: editingModel.provider_id } })
  }

  const handleEditModel = (model: LLM) => {
    setEditingModel(model)
  }

  const handleEditModelProvider = (model: LLM) => {
    const provider = allProvidersList.find((p: any) => p.id === model.provider_id)
    if (provider) setEditingProvider(provider)
  }

  const handleDeleteModel = (model: LLM) => {
    setDeletingModel(model)
  }

  const handleCapabilitiesModel = (model: LLM) => {
    setCapabilitiesModel(model)
  }

  const handleCapabilitiesSubmit = (model: LLM, capabilities: string[]) => {
    updateLLMMutation.mutate({
      id: model.id,
      data: {
        name: model.name,
        internal_name: model.internal_name,
        provider_id: model.provider_id,
        capabilities,
      },
    }, {
      onSuccess: () => {
        setCapabilitiesModel(null)
      },
    })
  }

  const confirmDeleteModel = async () => {
    if (!deletingModel) return
    await new Promise<void>((resolve, reject) => {
      deleteLLMMutation.mutate(deletingModel.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  const handleTestModel = (model: LLM) => {
    setTestingModelId(model.id)
    const onSettled = () => setTestingModelId(null)
    // Los modelos con capability image_output no tienen endpoint de chat/completions
    // (siempre dan 404 en /llms/{id}/test_connection). El backend expone en su lugar
    // /image-generation/test_connection, que resuelve automáticamente el LLM de
    // imágenes de la organización (no admite elegir cuál, aunque haya varios).
    if (model.capabilities?.includes('image_output')) {
      testImageGenerationMutation.mutate(undefined, { onSettled })
    } else {
      testLLMConnectionMutation.mutate(model.id, { onSettled })
    }
  }

  const confirmDeleteProvider = async () => {
    if (!deletingProvider) return

    await new Promise<void>((resolve, reject) => {
      deleteProviderMutation.mutate(deletingProvider.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  const handleConfigureEmbeddingProvider = (provider: any) => {
    setEditingEmbeddingProvider(provider)
  }

  const handleTestEmbeddingProvider = () => {
    setIsTestingEmbeddingProvider(true)
    testEmbeddingProviderMutation.mutate()
  }

  const handleEditEmbeddingProvider = (provider: any) => {
    setEditingEmbeddingProvider(provider)
  }

  const handleDeleteEmbeddingProvider = (provider: any) => {
    setDeletingEmbeddingProvider(provider)
  }

  const handleUpsertEmbeddingProvider = (data: { name: string; key?: string; endpoint?: string; deployment?: string }) => {
    if (!editingEmbeddingProvider) return
    if (editingEmbeddingProvider.isConfigured) {
      updateEmbeddingProviderMutation.mutate(data as any)
      return
    }
    createEmbeddingProviderMutation.mutate(data as any)
  }

  const confirmDeleteEmbeddingProvider = async () => {
    if (!deletingEmbeddingProvider) return

    setIsDeletingEmbeddingProvider(true)
    try {
      await new Promise<void>((resolve, reject) => {
        deleteEmbeddingProviderMutation.mutate(undefined, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        })
      })
    } finally {
      setIsDeletingEmbeddingProvider(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['supportedProviders'] }),
        queryClient.invalidateQueries({ queryKey: ['allProviders'] }),
        queryClient.invalidateQueries({ queryKey: ['llms'] }),
        queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] }),
        queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  // Mostrar loading mientras se cargan permisos o proveedores
  if (isLoadingPermissions || loadingProviders) {
    return <ModelsLoadingState />
  }

  // Si no tiene permisos para listar proveedores, mostrar mensaje
  if (!canListProviders) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">{t('common:accessDenied')}</h1>
          <p className="text-muted-foreground">{t('common:noPermission')}</p>
        </div>
      </div>
    )
  }

  // Only show full page error for providers
  const hasError = errorProviders
  const hasEmbeddingError = errorEmbeddingSupportedProviders || errorEmbeddingProvider
  const activeDeletingProvider = deletingProvider || deletingEmbeddingProvider

  // Determine error message
  const errorMessage = t('errors.failedToLoadProviders')

  return (
    <>
      <HuemulPageLayout
        header={
          <ModelsHeader 
            onRefresh={handleRefresh}
            configuredProviders={hasError ? 0 : allProvidersList.length}
            totalModels={hasError ? 0 : llms.length}
            isLoading={isRefreshing || fetchingLLMs}
          />
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: (
              <Tabs defaultValue="models" className="w-full flex-1 min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="models" className="hover:cursor-pointer">{t('tabs.models')}</TabsTrigger>
          <TabsTrigger value="embeddings" className="hover:cursor-pointer">{t('tabs.embeddings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-4 min-h-0 flex flex-col">
          {/* Default model banner */}
          {!hasError && defaultModel && (
            <div className="mb-4 shrink-0">
              <ModelsDefaultBanner
                defaultModel={defaultModel}
                providerName={defaultModelProvider?.name}
                onChangeDefault={() => setIsChangeDefaultOpen(true)}
                canUpdateModel={canUpdateModel}
              />
            </div>
          )}

          {hasError ? (
            <ModelsContentEmptyState
              type="error"
              message={errorMessage}
              onRetry={handleRefresh}
            />
          ) : (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex items-center justify-end gap-2 shrink-0">
                {canCreateProvider && (
                  <HuemulButton
                    icon={Plus}
                    label={t('actions.newProvider')}
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreateProviderOpen(true)}
                  />
                )}
                {canCreateModel && allProvidersList.length > 0 && (
                  <HuemulButton
                    icon={Plus}
                    label={t('actions.addModel')}
                    size="sm"
                    onClick={() => setIsCreateModelOpen(true)}
                  />
                )}
              </div>

              <HuemulTable
                data={llms}
                columns={[
                  {
                    key: 'name',
                    label: t('table.displayName'),
                    render: (model) => (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { if (!model.is_default) setDefaultMutation.mutate(model.id) }}
                          disabled={model.is_default || setDefaultMutation.isPending}
                          className={cn(
                            'shrink-0 transition-colors hover:cursor-pointer',
                            model.is_default
                              ? 'text-yellow-400 cursor-default'
                              : 'text-muted-foreground/30 hover:text-yellow-400'
                          )}
                        >
                          <Star className={cn('h-4 w-4', model.is_default && 'fill-yellow-400')} />
                        </button>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">{model.name}</span>
                          {model.is_default && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
                              {t('table.default')}
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'internal_name',
                    label: t('table.technicalName'),
                    render: (model) => (
                      <span className="font-mono text-xs text-muted-foreground">{model.internal_name}</span>
                    ),
                  },
                  {
                    key: 'provider',
                    label: t('table.provider'),
                    render: (model) => {
                      const providerName = model.provider_name || model.provider?.name
                      if (!providerName) return <span className="text-muted-foreground">—</span>
                      return (
                        <div className="flex items-center gap-2">
                          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', getProviderColor(providerName))}>
                            {providerName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{providerName}</span>
                        </div>
                      )
                    },
                  },
                  {
                    key: 'capabilities',
                    label: t('table.capabilities'),
                    render: (model) => (
                      <div className="flex flex-wrap gap-1">
                        {(model.capabilities ?? []).map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs py-0 px-1.5">
                            {t(`capabilitiesDialog.capabilities.${cap}`)}
                          </Badge>
                        ))}
                      </div>
                    ),
                  },
                ]}
                actionsMode="inline"
                actions={[
                  {
                    key: 'test',
                    label: t('modelActions.testConnection'),
                    icon: Radio,
                    onClick: handleTestModel,
                    isLoading: (model) => testingModelId === model.id,
                    disabled: (model) => testingModelId !== null && testingModelId !== model.id,
                  },
                  ...(canUpdateProvider ? [{
                    key: 'editProvider',
                    label: t('providerActions.editProvider'),
                    icon: Building2,
                    onClick: handleEditModelProvider,
                    disabled: (model: LLM) => !model.provider_id,
                  }] : []),
                  ...(canUpdateModel ? [{
                    key: 'edit',
                    label: t('modelActions.editModel'),
                    icon: Edit,
                    onClick: handleEditModel,
                  }, {
                    key: 'capabilities',
                    label: t('modelActions.capabilities'),
                    icon: Settings,
                    onClick: handleCapabilitiesModel,
                  }] : []),
                  ...(canDeleteModel ? [{
                    key: 'delete',
                    label: t('modelActions.deleteModel'),
                    icon: Trash2,
                    onClick: handleDeleteModel,
                    destructive: true,
                  }] : []),
                ]}
                getRowKey={(model) => model.id}
                getRowClassName={(model) => model.is_default ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                isLoading={loadingLLMs}
                isFetching={fetchingLLMs}
                error={errorLLMs as Error | null}
                onRetry={handleRefresh}
                emptyState={{ title: t('emptyState.noModels') }}
                pagination={{
                  page: llmsResponse?.page ?? page,
                  pageSize: llmsResponse?.page_size ?? pageSize,
                  hasNext: llmsResponse?.has_next,
                  hasPrevious: (llmsResponse?.page ?? page) > 1,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newPageSize) => {
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="embeddings" className="mt-4 min-h-0 overflow-auto">
          {hasEmbeddingError ? (
            <ModelsContentEmptyState
              type="error"
              message={t('errors.failedToLoadEmbeddings')}
              onRetry={handleRefresh}
            />
          ) : (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <Timer className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{t('embeddingCard.infoBannerTitle')}</p>
                  <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">{t('embeddingCard.infoBannerSubtitle')}</p>
                </div>
              </div>

              {/* Active provider */}
              {combinedEmbeddingProviders.filter((p: any) => p.isConfigured).map((provider: any) => (
                <div key={provider.id} className="rounded-lg border border-green-200 bg-card dark:border-green-800">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white', getProviderColor(provider.name))}>
                          {(provider.display_name || provider.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{provider.display_name || provider.name}</h3>
                            <Badge className="border-green-200 bg-green-100/80 px-1.5 py-0.5 text-[10px] text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300">
                              {t('embeddingCard.activeConfiguredBadge')}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t('embeddingCard.activeDescription')}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {canUpdateProvider && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs hover:cursor-pointer"
                            onClick={() => handleTestEmbeddingProvider()}
                            disabled={isTestingEmbeddingProvider}
                          >
                            {isTestingEmbeddingProvider ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Radio className="h-3 w-3" />
                            )}
                            {t('modelActions.testConnection')}
                          </Button>
                        )}
                        {canUpdateProvider && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs hover:cursor-pointer"
                            onClick={() => handleEditEmbeddingProvider(provider)}
                          >
                            <Edit className="h-3 w-3" />
                            {t('embeddingCard.editProvider')}
                          </Button>
                        )}
                        {canDeleteProvider && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:cursor-pointer hover:text-destructive"
                            onClick={() => handleDeleteEmbeddingProvider(provider)}
                            disabled={isDeletingEmbeddingProvider}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-4 gap-6">
                      {[
                        { label: t('embeddingCard.statsEmbeddingModel'), value: provider.deploymentValue || provider.key ? (provider.deploymentValue ?? '—') : '—' },
                        { label: t('embeddingCard.statsDimensions'), value: '—' },
                        { label: t('embeddingCard.statsIndexedDocs'), value: '—' },
                        { label: t('embeddingCard.statsLastSync'), value: '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Other available providers */}
              {combinedEmbeddingProviders.filter((p: any) => !p.isConfigured).length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('embeddingCard.otherProvidersTitle')}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('embeddingCard.otherProvidersSubtitle')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {combinedEmbeddingProviders.filter((p: any) => !p.isConfigured).map((provider: any) => (
                      <div key={provider.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', getProviderColor(provider.name))}>
                            {(provider.display_name || provider.name).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{provider.display_name || provider.name}</p>
                            <p className="text-[11px] text-muted-foreground">{t('embeddingCard.notConfiguredLabel')}</p>
                          </div>
                        </div>
                        {canCreateProvider && (
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 bg-[#4464f7] text-xs text-white hover:cursor-pointer hover:bg-[#3451e6]"
                            onClick={() => handleConfigureEmbeddingProvider(provider)}
                          >
                            <Settings className="h-3.5 w-3.5" />
                            {t('common:configure')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ]}
      />

      {/* Create Provider Dialog */}
      <CreateProviderDialog
        open={isCreateProviderOpen}
        onOpenChange={setIsCreateProviderOpen}
        supportedProviders={supportedProviders as any[]}
        onSubmit={(data: CreateLLMProviderRequest) => createProviderMutation.mutate(data)}
        isCreating={createProviderMutation.isPending}
      />

      {/* Edit Provider Dialog */}
      <EditProviderDialog
        open={!!editingProvider}
        onOpenChange={() => setEditingProvider(null)}
        provider={editingProvider}
        supportedProviders={supportedProviders as any[]}
        onSubmit={handleUpdateProvider}
        isUpdating={updateProviderMutation.isPending}
      />

      {/* Edit Embedding Provider Dialog */}
      <EmbeddingProviderEditDialog
        open={!!editingEmbeddingProvider}
        onOpenChange={() => setEditingEmbeddingProvider(null)}
        provider={editingEmbeddingProvider}
        onSubmit={handleUpsertEmbeddingProvider}
        isSubmitting={updateEmbeddingProviderMutation.isPending || createEmbeddingProviderMutation.isPending}
      />

      {/* Create/Edit Model Dialog */}
      <ModelDialog
        open={isCreateModelOpen || !!editingModel}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModelOpen(false)
            setEditingModel(null)
          }
        }}
        model={editingModel}
        providers={!editingModel ? allProvidersList.map((p: any) => ({ id: p.id, name: p.name, type: p.type })) : undefined}
        isCreating={createLLMMutation.isPending}
        isUpdating={updateLLMMutation.isPending}
        onSubmit={editingModel ? handleUpdateModel : handleCreateModel}
      />

      {/* Delete Provider Dialog */}
      <DeleteProviderDialog
        open={!!activeDeletingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProvider(null)
            setDeletingEmbeddingProvider(null)
          }
        }}
        provider={activeDeletingProvider}
        onAction={deletingProvider ? confirmDeleteProvider : confirmDeleteEmbeddingProvider}
      />

      {/* Delete Model Dialog */}
      <DeleteModelDialog
        open={!!deletingModel}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingModel(null)
          }
        }}
        model={deletingModel}
        onAction={confirmDeleteModel}
      />

      {/* Model Capabilities Dialog */}
      <ModelCapabilitiesDialog
        open={!!capabilitiesModel}
        onOpenChange={(open) => {
          if (!open) {
            setCapabilitiesModel(null)
          }
        }}
        model={capabilitiesModel}
        isUpdating={updateLLMMutation.isPending}
        onSubmit={handleCapabilitiesSubmit}
      />

      {/* Change Default Model Dialog */}
      <ChangeDefaultModelDialog
        open={isChangeDefaultOpen}
        onOpenChange={setIsChangeDefaultOpen}
        models={llms}
        providers={allProvidersList.map((p: any) => ({ id: p.id, name: p.name }))}
        currentDefaultId={defaultModel?.id}
        isUpdating={setDefaultMutation.isPending}
        onSubmit={(modelId) => {
          setDefaultMutation.mutate(modelId, {
            onSuccess: () => setIsChangeDefaultOpen(false),
          })
        }}
      />
    </>
  )
}
