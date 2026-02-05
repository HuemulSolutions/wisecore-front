import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { 
  getSupportedProviders, 
  getLLMs, 
  createProvider, 
  updateProvider, 
  deleteProvider,
  getProvider,
  createLLM, 
  updateLLMModel, 
  deleteLLM, 
  setDefaultLLM,
  testLLMConnection
} from '@/services/llms'
import { 
  ModelsHeader,
  ModelsLoadingState, 
  ModelsContentEmptyState,
  ProviderCard,
  EditProviderDialog,
  ModelDialog,
  DeleteProviderDialog,
  DeleteModelDialog
} from '@/components/models'
import type { LLM, CreateLLMRequest } from '@/services/llms'

export default function Models() {
  const queryClient = useQueryClient()
  const { 
    hasPermission, 
    hasAnyPermission,
    isOrgAdmin,
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
  const [isDeletingModel, setIsDeletingModel] = useState(false)
  const [isDeletingProvider, setIsDeletingProvider] = useState(false)
  const [testingModelId, setTestingModelId] = useState<string | null>(null)

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
  const { data: supportedResponse, isLoading: loadingSupportedProviders, error: errorSupportedProviders } = useQuery({
    queryKey: ['supportedProviders'],
    queryFn: getSupportedProviders,
    retry: 0,
    enabled: canListProviders,
  })

  const { data: llms = [], isLoading: loadingLLMs, error: errorLLMs } = useQuery({
    queryKey: ['llms'],
    queryFn: getLLMs,
    retry: 0,
    enabled: canListModels && openProviders.length > 0, // Solo cargar cuando hay providers abiertos y tiene permisos
  })

  // Extract data from wrapped responses
  const supportedProviders = supportedResponse?.data || []

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      setEditingProvider(null)
      toast.success('Provider configured successfully')
    },
  })

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      setEditingProvider(null)
      toast.success('Provider updated successfully')
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
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

  // Process supported providers with configured_id
  const combinedProviders = (supportedProviders as any[]).map((provider) => {
    const isConfigured = !!provider.configured_id
    return {
      ...provider,
      id: isConfigured ? provider.configured_id : `unconfigured-${provider.name}`,
      display_name: provider.display,
      isConfigured
    }
  })

  // Helper functions
  const getProviderModels = (providerId: string) => {
    const actualId = providerId.startsWith('unconfigured-') ? null : providerId
    return (llms as LLM[]).filter((llm) => llm.provider_id === actualId)
  }

  // Event handlers
  const handleUpdateProvider = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingProvider) return
    const formData = new FormData(event.currentTarget)
    
    // Build data object dynamically based on required fields
    const requiredFields = getRequiredFields(editingProvider)
    const providerKey = (editingProvider as any).providerKey || editingProvider.name
    
    const data: any = {
      name: providerKey, // Use the provider key automatically (e.g., 'openai', 'azure_openai')
    }
    
    // Only include fields that are required for this provider
    if (requiredFields.api_key) {
      data.key = formData.get('key') as string
    }
    if (requiredFields.endpoint) {
      data.endpoint = formData.get('endpoint') as string
    }
    if (requiredFields.deployment) {
      data.deployment = formData.get('deployment') as string
    }
    
    // Check if this is a new provider (unconfigured) or updating existing
    if (editingProvider.isConfigured === false || editingProvider.id.startsWith('unconfigured-')) {
      // Create new provider
      createProviderMutation.mutate(data)
    } else {
      // Update existing provider
      updateProviderMutation.mutate({ id: editingProvider.id, data })
    }
  }

  const handleCreateModel = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data: CreateLLMRequest = {
      name: formData.get('displayName') as string,
      internal_name: formData.get('technicalName') as string,
      provider_id: selectedProviderId,
    }
    createLLMMutation.mutate(data)
  }

  const handleUpdateModel = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingModel) return
    const formData = new FormData(event.currentTarget)
    const data: Partial<CreateLLMRequest> = {
      name: formData.get('displayName') as string,
      internal_name: formData.get('technicalName') as string,
    }
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

    setIsDeletingModel(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          deleteLLMMutation.mutate(deletingModel.id, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          })
        }),
        minDelay
      ])
    } finally {
      setIsDeletingModel(false)
      setDeletingModel(null)
    }
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

  // Helper function to get required fields for a provider
  const getRequiredFields = (provider: any) => {
    return {
      api_key: provider.api_key === true,
      endpoint: provider.endpoint === true,
      deployment: provider.deployment === true
    }
  }

  // Handle provider edit
  const handleEditProvider = async (provider: any) => {
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: false }))
    // Delay to allow dropdown to close before dialog opens
    setTimeout(async () => {
      try {
        // Fetch provider details from the API
        const providerDetails = await getProvider(provider.id)
        
        // Keep the boolean requirement fields from the original provider
        // Only add the string values for the actual data fields
        const editProvider: any = {
          ...provider, // This has the boolean fields: api_key, endpoint, deployment
          providerKey: provider.name
        }
        
        // Add the actual values from API without overwriting boolean fields
        if (providerDetails.key !== undefined) {
          editProvider.key = providerDetails.key
        }
        // For endpoint and deployment, check if they're boolean first
        if (typeof provider.endpoint === 'boolean') {
          // It's a boolean, so keep it and add the value separately if exists
          if (providerDetails.endpoint !== undefined) {
            editProvider.endpointValue = providerDetails.endpoint
          }
        } else {
          // It's already a value, update it
          if (providerDetails.endpoint !== undefined) {
            editProvider.endpointValue = providerDetails.endpoint
          }
        }
        
        if (typeof provider.deployment === 'boolean') {
          if (providerDetails.deployment !== undefined) {
            editProvider.deploymentValue = providerDetails.deployment
          }
        } else {
          if (providerDetails.deployment !== undefined) {
            editProvider.deploymentValue = providerDetails.deployment
          }
        }
        
        setEditingProvider(editProvider)
      } catch (error: any) {
        toast.error(`Failed to load provider details: ${error.message}`)
      }
    }, 0)
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

    setIsDeletingProvider(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          deleteProviderMutation.mutate(deletingProvider.id, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          })
        }),
        minDelay
      ])
    } finally {
      setIsDeletingProvider(false)
      setDeletingProvider(null)
    }
  }

  const handleConfigureProvider = (provider: any) => {
    setEditingProvider({
      ...provider,
      providerKey: provider.name // This should be the key like 'openai', 'azure_openai', etc.
    })
  }

  const handleCreateModelForProvider = (providerId: string) => {
    setSelectedProviderId(providerId)
    setIsCreateModelOpen(true)
  }

  const closeAllDropdowns = () => {
    setOpenDropdowns({})
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['supportedProviders'] }),
        queryClient.invalidateQueries({ queryKey: ['llms'] })
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
  if (isLoadingPermissions || loadingSupportedProviders) {
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

  // Only show full page error for supported providers
  const hasError = errorSupportedProviders

  // Determine error message
  let errorMessage = 'Failed to load supported providers'

  return (
    <div className="p-6 space-y-6">
      <ModelsHeader 
        onRefresh={handleRefresh}
        configuredProviders={hasError ? 0 : combinedProviders.filter((p: any) => p.isConfigured).length}
        totalModels={hasError ? 0 : (llms as LLM[]).length}
        isLoading={isRefreshing}
      />

      {/* Show error state in content area */}
      {hasError ? (
        <ModelsContentEmptyState 
          type="error" 
          message={errorMessage} 
          onRetry={handleRefresh}
        />
      ) : !combinedProviders.length ? (
        <ModelsContentEmptyState type="empty" />
      ) : (
        <div className="space-y-4 overflow-auto max-h-[80vh]">
          {combinedProviders.map((provider: any) => (
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

      {/* Edit Provider Dialog */}
      <EditProviderDialog
        open={!!editingProvider}
        onOpenChange={() => setEditingProvider(null)}
        provider={editingProvider}
        onSubmit={handleUpdateProvider}
        isUpdating={updateProviderMutation.isPending}
        isCreating={createProviderMutation.isPending}
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
        open={!!deletingProvider}
        onOpenChange={(open) => {
          if (!open && !isDeletingProvider) {
            setDeletingProvider(null)
          }
        }}
        provider={deletingProvider}
        onConfirm={confirmDeleteProvider}
        isDeleting={isDeletingProvider}
      />

      {/* Delete Model Dialog */}
      <DeleteModelDialog
        open={!!deletingModel}
        onOpenChange={(open) => {
          if (!open && !isDeletingModel) {
            setDeletingModel(null)
          }
        }}
        model={deletingModel}
        onConfirm={confirmDeleteModel}
        isDeleting={isDeletingModel}
      />
    </div>
  )
}