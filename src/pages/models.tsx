import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { handleApiError } from '@/lib/error-utils'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { 
  getSupportedProviders,
  getAllProviders, 
  createProvider, 
  updateProvider, 
  deleteProvider,
  getProvider,
} from '@/services/llm-provider'
import { 
  getLLMs, 
  createLLM, 
  updateLLMModel, 
  deleteLLM, 
  setDefaultLLM,
  testLLMConnection
} from '@/services/llms'
import {
  getSupportedEmbeddingProviders,
  getEmbeddingProvider,
  createEmbeddingProvider,
  updateEmbeddingProvider,
  deleteEmbeddingProvider,
} from '@/services/embedding-provider'
import { 
  ModelsHeader,
  ModelsLoadingState, 
  ModelsContentEmptyState,
  ModelDialog,
  DeleteModelDialog,
} from '@/components/llm'
import {
  ProviderCard,
  EditProviderDialog,
  DeleteProviderDialog,
  CreateProviderDialog,
} from '@/components/llm-provider'
import {
  EmbeddingProviderCard,
  EmbeddingProviderEditDialog,
} from '@/components/embedding-provider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { LLM, CreateLLMRequest } from '@/types/llm'
import type { CreateLLMProviderRequest } from '@/types/llm-provider'

export default function Models() {
  const queryClient = useQueryClient()
  const { 
    hasPermission, 
    hasAnyPermission,
    isOrgAdmin,
    isRootAdmin,
    isLoading: isLoadingPermissions 
  } = useUserPermissions()
  
  // State management
  const [openProviders, setOpenProviders] = useState<string[]>([])
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [deletingProvider, setDeletingProvider] = useState<any>(null)
  const [editingModel, setEditingModel] = useState<LLM | null>(null)
  const [deletingModel, setDeletingModel] = useState<LLM | null>(null)
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [testingModelId, setTestingModelId] = useState<string | null>(null)
  const [openEmbeddingProviders, setOpenEmbeddingProviders] = useState<string[]>([])
  const [editingEmbeddingProvider, setEditingEmbeddingProvider] = useState<any>(null)
  const [deletingEmbeddingProvider, setDeletingEmbeddingProvider] = useState<any>(null)
  const [isDeletingEmbeddingProvider, setIsDeletingEmbeddingProvider] = useState(false)
  const [isCreateProviderOpen, setIsCreateProviderOpen] = useState(false)

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
    queryFn: getAllProviders,
    retry: 0,
    enabled: canListProviders,
  })

  const { data: llms = [], isLoading: loadingLLMs, error: errorLLMs } = useQuery({
    queryKey: ['llms'],
    queryFn: getLLMs,
    retry: 0,
    enabled: canListModels && openProviders.length > 0, // Solo cargar cuando hay providers abiertos y tiene permisos
  })

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setEditingProvider(null)
      setIsCreateProviderOpen(false)
      toast.success('Provider configured successfully')
    },
  })

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLLMProviderRequest }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setEditingProvider(null)
      toast.success('Provider updated successfully')
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['allProviders'] })
      setDeletingProvider(null)
      toast.success('Provider deleted successfully')
    },
  })

  const createLLMMutation = useMutation({
    mutationFn: createLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setIsCreateModelOpen(false)
      toast.success('Model created successfully')
    },
  })

  const updateLLMMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLLMRequest> }) => updateLLMModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setEditingModel(null)
      toast.success('Model updated successfully')
    },
  })

  const deleteLLMMutation = useMutation({
    mutationFn: deleteLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setDeletingModel(null)
      toast.success('Model deleted successfully')
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (llmId: string) => setDefaultLLM(llmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      toast.success('Default model updated successfully')
    },
  })

  const testLLMConnectionMutation = useMutation({
    mutationFn: testLLMConnection,
    onSuccess: () => {
      toast.success('Connection successful')
    },
    onSettled: () => {
      setTestingModelId(null)
    },
  })

  const createEmbeddingProviderMutation = useMutation({
    mutationFn: createEmbeddingProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setEditingEmbeddingProvider(null)
      toast.success('Embeddings provider configured successfully')
    },
  })

  const updateEmbeddingProviderMutation = useMutation({
    mutationFn: updateEmbeddingProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setEditingEmbeddingProvider(null)
      toast.success('Embeddings provider updated successfully')
    },
  })

  const deleteEmbeddingProviderMutation = useMutation({
    mutationFn: deleteEmbeddingProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] })
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] })
      setDeletingEmbeddingProvider(null)
      toast.success('Embeddings provider deleted successfully')
    },
  })

  // Process providers - split into organization and managed
  const orgProviders = allProvidersList.filter((p: any) => !p.is_managed).map((p: any) => ({ ...p, isConfigured: true }))
  const managedProviders = allProvidersList.filter((p: any) => p.is_managed).map((p: any) => ({ ...p, isConfigured: true }))

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
  const getProviderModels = (providerId: string) => {
    return (llms as LLM[]).filter((llm) => llm.provider_id === providerId)
  }

  // Event handlers
  const handleUpdateProvider = (data: CreateLLMProviderRequest) => {
    if (!editingProvider) return
    updateProviderMutation.mutate({ id: editingProvider.id, data })
  }

  const handleCreateModel = (data: { name: string; internal_name: string; capabilities: string[] }) => {
    const payload: CreateLLMRequest = {
      ...data,
      provider_id: selectedProviderId,
    }
    createLLMMutation.mutate(payload)
  }

  const handleUpdateModel = (data: { name: string; internal_name: string; capabilities: string[] }) => {
    if (!editingModel) return
    updateLLMMutation.mutate({ id: editingModel.id, data })
  }

  const handleEditModel = (model: LLM) => {
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: false }))
    // Delay to allow dropdown to close before dialog opens
    setTimeout(() => {
      setEditingModel(model)
    }, 0)
  }

  const handleDeleteModel = (model: LLM) => {
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: false }))
    // Delay to allow dropdown to close before dialog opens
    setTimeout(() => {
      setDeletingModel(model)
    }, 0)
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

  const handleDefaultChange = (llmId: string, isDefault: boolean) => {
    if (isDefault) {
      setDefaultMutation.mutate(llmId)
    }
  }

  const handleTestModel = (model: LLM) => {
    // Close dropdown after opening test
    setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: false }))
    setTestingModelId(model.id)
    testLLMConnectionMutation.mutate(model.id)
  }

  // Handle provider edit
  const handleEditProvider = async (provider: any) => {
    // Close dropdown (for mobile)
    setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: false }))
    try {
      // Fetch provider details from the API
      const providerDetails = await getProvider(provider.id)
      
      // Look up required fields from supported providers using type
      const supportedProvider = (supportedProviders as any[]).find((sp: any) => sp.type === provider.type)
      
      const editProvider: any = {
        ...provider,
        providerKey: provider.type,
        api_key: supportedProvider?.requires_api_key === true,
        endpoint: supportedProvider?.requires_endpoint === true,
        deployment: supportedProvider?.requires_deployment === true,
      }
      
      // Add the actual values from API
      if (providerDetails.key !== undefined) {
        editProvider.key = providerDetails.key
      }
      if (providerDetails.endpoint !== undefined) {
        editProvider.endpointValue = providerDetails.endpoint
      }
      if (providerDetails.deployment !== undefined) {
        editProvider.deploymentValue = providerDetails.deployment
      }
      
      setEditingProvider(editProvider)
    } catch (error) {
      handleApiError(error, { fallbackMessage: 'Failed to load provider details' })
    }
  }

  // Handle provider delete
  const handleDeleteProvider = (provider: any) => {
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: false }))
    // Delay to allow dropdown to close before dialog opens
    setTimeout(() => {
      setDeletingProvider(provider)
    }, 0)
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

  const handleConfigureProvider = (provider: any) => {
    const supportedProvider = (supportedProviders as any[]).find((sp: any) => sp.type === provider.type)
    setEditingProvider({
      ...provider,
      providerKey: provider.type,
      api_key: supportedProvider?.requires_api_key === true,
      endpoint: supportedProvider?.requires_endpoint === true,
      deployment: supportedProvider?.requires_deployment === true,
    })
  }

  const handleCreateModelForProvider = (providerId: string) => {
    setSelectedProviderId(providerId)
    setIsCreateModelOpen(true)
  }

  const handleConfigureEmbeddingProvider = (provider: any) => {
    setEditingEmbeddingProvider(provider)
  }

  const handleEditEmbeddingProvider = (provider: any) => {
    setOpenDropdowns(prev => ({ ...prev, [`embedding-provider-${provider.id}`]: false }))
    setTimeout(() => {
      setEditingEmbeddingProvider(provider)
    }, 0)
  }

  const handleDeleteEmbeddingProvider = (provider: any) => {
    setOpenDropdowns(prev => ({ ...prev, [`embedding-provider-${provider.id}`]: false }))
    setTimeout(() => {
      setDeletingEmbeddingProvider(provider)
    }, 0)
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

  const closeAllDropdowns = () => {
    setOpenDropdowns({})
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
      toast.success('Data refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = () => closeAllDropdowns()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Mostrar loading mientras se cargan permisos o proveedores
  if (isLoadingPermissions || loadingProviders) {
    return <ModelsLoadingState />
  }

  // Si no tiene permisos para listar proveedores, mostrar mensaje
  if (!canListProviders) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Only show full page error for providers
  const hasError = errorProviders
  const hasEmbeddingError = errorEmbeddingSupportedProviders || errorEmbeddingProvider
  const activeDeletingProvider = deletingProvider || deletingEmbeddingProvider

  // Determine error message
  const errorMessage = 'Failed to load providers'

  return (
    <div className="p-6 space-y-6">
      <ModelsHeader 
        onRefresh={handleRefresh}
        configuredProviders={hasError ? 0 : allProvidersList.length}
        totalModels={hasError ? 0 : (llms as LLM[]).length}
        isLoading={isRefreshing}
      />

      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models" className="hover:cursor-pointer">Models</TabsTrigger>
          <TabsTrigger value="embeddings" className="hover:cursor-pointer">Embeddings</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          {/* Show error state in content area */}
          {hasError ? (
            <ModelsContentEmptyState 
              type="error" 
              message={errorMessage} 
              onRetry={handleRefresh}
            />
          ) : (
            <div className="space-y-6">
              {!allProvidersList.length ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Organization Providers</h3>
                    {canCreateProvider && (
                      <HuemulButton
                        icon={Plus}
                        label="New Provider"
                        size="sm"
                        onClick={() => setIsCreateProviderOpen(true)}
                      />
                    )}
                  </div>
                  <ModelsContentEmptyState type="empty" />
                </div>
              ) : (
                <>
              {/* Organization Providers */}
              {orgProviders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Organization Providers</h3>
                      <p className="text-xs text-muted-foreground">Providers configured by your organization.</p>
                    </div>
                    {canCreateProvider && (
                      <HuemulButton
                        icon={Plus}
                        label="New Provider"
                        size="sm"
                        onClick={() => setIsCreateProviderOpen(true)}
                      />
                    )}
                  </div>
                  {orgProviders.map((provider: any) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      models={getProviderModels(provider.id)}
                      isOpen={openProviders.includes(provider.id)}
                      onToggle={(open) => {
                        if (open) {
                          setOpenProviders(prev => [...prev, provider.id])
                        } else {
                          setOpenProviders(prev => prev.filter(id => id !== provider.id))
                        }
                      }}
                      onEditProvider={handleEditProvider}
                      onDeleteProvider={handleDeleteProvider}
                      onConfigureProvider={handleConfigureProvider}
                      onCreateModel={handleCreateModelForProvider}
                      onEditModel={handleEditModel}
                      onDeleteModel={handleDeleteModel}
                      onTestModel={handleTestModel}
                      onDefaultChange={handleDefaultChange}
                      isDeleting={deleteProviderMutation.isPending}
                      isDeletingModel={deleteLLMMutation.isPending}
                      testingModelId={testingModelId}
                      isLoadingModels={loadingLLMs}
                      modelsError={errorLLMs}
                      openDropdowns={openDropdowns}
                      onDropdownChange={(key, open) => {
                        setOpenDropdowns(prev => ({ ...prev, [key]: open }))
                      }}
                      canCreateProvider={canCreateProvider}
                      canUpdateProvider={canUpdateProvider}
                      canDeleteProvider={canDeleteProvider}
                      canCreateModel={canCreateModel}
                      canUpdateModel={canUpdateModel}
                      canDeleteModel={canDeleteModel}
                    />
                  ))}
                </div>
              )}
              
              {managedProviders.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Managed Providers</h3>
                    <p className="text-xs text-muted-foreground">Providers managed by your platform administrator. These cannot be edited or deleted.</p>
                  </div>
                  {managedProviders.map((provider: any) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      models={getProviderModels(provider.id)}
                      isOpen={openProviders.includes(provider.id)}
                      onToggle={(open) => {
                        if (open) {
                          setOpenProviders(prev => [...prev, provider.id])
                        } else {
                          setOpenProviders(prev => prev.filter(id => id !== provider.id))
                        }
                      }}
                      onEditProvider={handleEditProvider}
                      onDeleteProvider={handleDeleteProvider}
                      onConfigureProvider={handleConfigureProvider}
                      onCreateModel={handleCreateModelForProvider}
                      onEditModel={handleEditModel}
                      onDeleteModel={handleDeleteModel}
                      onTestModel={handleTestModel}
                      onDefaultChange={handleDefaultChange}
                      isDeleting={deleteProviderMutation.isPending}
                      isDeletingModel={deleteLLMMutation.isPending}
                      testingModelId={testingModelId}
                      isLoadingModels={loadingLLMs}
                      modelsError={errorLLMs}
                      openDropdowns={openDropdowns}
                      onDropdownChange={(key, open) => {
                        setOpenDropdowns(prev => ({ ...prev, [key]: open }))
                      }}
                      canCreateProvider={false}
                      canUpdateProvider={isRootAdmin}
                      canDeleteProvider={isRootAdmin}
                      canCreateModel={canCreateModel}
                      canUpdateModel={canUpdateModel}
                      canDeleteModel={canDeleteModel}
                    />
                  ))}
                </div>
              )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="embeddings">
          {hasEmbeddingError ? (
            <ModelsContentEmptyState
              type="error"
              message="Failed to load embeddings provider"
              onRetry={handleRefresh}
            />
          ) : !combinedEmbeddingProviders.length ? (
            <ModelsContentEmptyState type="empty" />
          ) : (
            <div className="space-y-3">
              {combinedEmbeddingProviders.map((provider: any) => (
                <EmbeddingProviderCard
                  key={provider.id}
                  provider={provider}
                  isOpen={openEmbeddingProviders.includes(provider.id)}
                  onToggle={(open) => {
                    if (open) {
                      setOpenEmbeddingProviders(prev => [...prev, provider.id])
                    } else {
                      setOpenEmbeddingProviders(prev => prev.filter(id => id !== provider.id))
                    }
                  }}
                  onEditProvider={handleEditEmbeddingProvider}
                  onDeleteProvider={handleDeleteEmbeddingProvider}
                  onConfigureProvider={handleConfigureEmbeddingProvider}
                  isDeleting={isDeletingEmbeddingProvider}
                  openDropdowns={openDropdowns}
                  onDropdownChange={(key, open) => {
                    setOpenDropdowns(prev => ({ ...prev, [key]: open }))
                  }}
                  canCreateProvider={canCreateProvider}
                  canUpdateProvider={canUpdateProvider}
                  canDeleteProvider={canDeleteProvider}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
