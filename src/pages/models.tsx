import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, CheckCircle, Circle, Settings, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  getAllProviders,
  getSupportedProviders,
  getLLMs,
  createProvider,
  updateProvider,
  deleteProvider,
  createLLM,
  updateLLMModel,
  deleteLLM,
  setDefaultLLM,

  type LLMProvider,
  type LLM,
  type CreateLLMProviderRequest,
  type CreateLLMRequest,
} from '@/services/llms'

export default function ModelsPage() {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [openProviders, setOpenProviders] = useState<string[]>([])
  // Removed unused showApiKeys state
  const [editingProvider, setEditingProvider] = useState<(LLMProvider & { isConfigured?: boolean; isSupported?: boolean }) | null>(null)

  const [isCreateProviderOpen, setIsCreateProviderOpen] = useState(false)
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [editingModel, setEditingModel] = useState<LLM | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<(LLMProvider & { isConfigured?: boolean; isSupported?: boolean }) | null>(null)
  const [deletingModel, setDeletingModel] = useState<LLM | null>(null)
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({})

  // Queries with optimized caching
  const { data: supportedProviders = [], isLoading: loadingSupportedProviders } = useQuery({
    queryKey: ['supportedProviders'],
    queryFn: getSupportedProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  })

  const { data: configuredProviders = [], isLoading: loadingConfiguredProviders } = useQuery({
    queryKey: ['providers'],
    queryFn: getAllProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  })

  const { data: llms = [], isLoading: loadingLLMs } = useQuery<LLM[]>({
    queryKey: ['llms'],
    queryFn: getLLMs,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  })

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      setIsCreateProviderOpen(false)
      setEditingProvider(null)
      toast.success('Provider created successfully')
    },
    onError: (error) => {
      toast.error(`Error creating provider: ${error.message}`)
    },
  })

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLLMProviderRequest> }) =>
      updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      setEditingProvider(null)
      toast.success('Provider updated successfully')
    },
    onError: (error) => {
      toast.error(`Error updating provider: ${error.message}`)
    },
  })



  const createLLMMutation = useMutation({
    mutationFn: createLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setIsCreateModelOpen(false)
      toast.success('Model created successfully')
    },
    onError: (error) => {
      toast.error(`Error creating model: ${error.message}`)
    },
  })

  const updateLLMMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLLMRequest> }) =>
      updateLLMModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      setEditingModel(null)
      toast.success('Model updated successfully')
    },
    onError: (error) => {
      toast.error(`Error updating model: ${error.message}`)
    },
  })

  const deleteLLMMutation = useMutation({
    mutationFn: deleteLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      toast.success('Model deleted successfully')
    },
    onError: (error) => {
      toast.error(`Error deleting model: ${error.message}`)
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llms'] })
      toast.success('Default model updated')
    },
    onError: (error) => {
      toast.error(`Error setting default model: ${error.message}`)
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] })
      toast.success('Provider deleted successfully')
    },
    onError: (error) => {
      toast.error(`Error deleting provider: ${error.message}`)
    },
  })

  // Combine supported and configured providers
  const allProviders = React.useMemo(() => {
    if (!supportedProviders || !configuredProviders) return []
    
    // Handle different possible response structures
    let supportedList: any[] = []
    if (Array.isArray(supportedProviders)) {
      supportedList = supportedProviders
    } else if (supportedProviders && typeof supportedProviders === 'object') {
      const providerObj = supportedProviders as any
      if (providerObj.data && Array.isArray(providerObj.data)) {
        supportedList = providerObj.data
      } else if (providerObj.data && typeof providerObj.data === 'object') {
        // Handle case where data is an object with provider keys
        // e.g., { data: { azure_openai: {...}, openai: {...}, anthropic: {...} } }
        supportedList = Object.keys(providerObj.data).map(key => {
          const providerData = providerObj.data[key]
          
          return {
            name: providerData.display,
            id: key,
            originalKey: key,
            display: providerData.display,
            api_key: providerData.api_key,
            endpoint: providerData.endpoint,
            deployment: providerData.deployment,
            ...providerData
          }
        })
      } else if (Array.isArray(providerObj.providers)) {
        supportedList = providerObj.providers
      } else if (Array.isArray(providerObj.supported)) {
        supportedList = providerObj.supported
      }
    }
    
    const configuredList = Array.isArray(configuredProviders) ? configuredProviders : []
    
    if (!Array.isArray(supportedList)) {
      console.warn('Supported providers is not an array:', supportedProviders)
      return configuredList
    }
    
    return supportedList.map((supported: any) => {
      // Use display name from supported providers or fallback to processed name
      const supportedName = supported.display || (typeof supported === 'string' ? supported : supported.name || supported.id || supported)
      const supportedKey = supported.originalKey || supported.id || supportedName.toLowerCase().replace(/\s+/g, '_')
      
      const configured = configuredList.find((config: LLMProvider) => 
        config.name.toLowerCase() === supportedName.toLowerCase() ||
        config.name.toLowerCase().replace(/\s+/g, '_') === supportedKey
      )
      
      if (configured) {
        // If configured, merge with supported data but use display name
        return {
          ...configured,
          name: supportedName, // Always use the display name from supported providers
          display: supported.display,
          // Preserve field configuration from supported provider
          api_key: supported.api_key,
          endpoint_required: supported.endpoint,
          deployment_required: supported.deployment,
          isConfigured: true
        }
      }
      
      return {
        id: `supported-${supportedKey}`,
        name: supportedName,
        key: '',
        endpoint: '',
        deployment: '',
        originalKey: supportedKey,
        isSupported: true,
        isConfigured: false,
        // Preserve field configuration from supported provider
        api_key: supported.api_key,
        endpoint_required: supported.endpoint,
        deployment_required: supported.deployment,
        display: supported.display
      }
    })
  }, [supportedProviders, configuredProviders])

  // Ref to track last logged transaction ID and component mount count
  const lastLoggedId = React.useRef<string | undefined>(undefined)
  const mountCount = React.useRef(0)

  // Track component mounts for debugging StrictMode
  React.useEffect(() => {
    mountCount.current += 1
    console.log(`🔄 Models page mounted (count: ${mountCount.current})`)
    
    return () => {
      console.log(`🔚 Models page unmounting (count: ${mountCount.current})`)
    }
  }, [])

  // Debug logging - only when data changes (reduced for StrictMode)
  React.useEffect(() => {
    if (supportedProviders && Object.keys(supportedProviders).length > 0) {
      // Only log once per unique transaction_id to avoid StrictMode duplicates
      const transactionId = (supportedProviders as any)?.transaction_id
      
      if (transactionId && transactionId !== lastLoggedId.current) {
        console.log(`✅ Supported providers fetched (mount ${mountCount.current}):`, supportedProviders)
        lastLoggedId.current = transactionId
      } else if (transactionId) {
        console.log(`📋 Using cached supported providers data (mount ${mountCount.current})`)
      }
    }
  }, [supportedProviders])

  // Helper functions
  const getProviderModels = (providerId: string) => {
    return llms.filter(llm => llm.provider_id === providerId)
  }

  const getProviderStatus = (provider: any) => {
    const models = getProviderModels(provider.id)
    return {
      configured: provider.isConfigured !== false && (provider.key || models.length > 0),
      modelCount: models.length
    }
  }

  const handleCreateProvider = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data: CreateLLMProviderRequest = {
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      endpoint: formData.get('endpoint') as string,
      deployment: formData.get('deployment') as string,
    }
    createProviderMutation.mutate(data)
  }

  const handleUpdateProvider = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingProvider) return
    const formData = new FormData(event.currentTarget)
    
    // Build data object dynamically based on required fields
    const requiredFields = getRequiredFields(editingProvider)
    const data: any = {
      name: formData.get('name') as string,
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
    if (editingProvider.isConfigured === false || editingProvider.id.startsWith('supported-')) {
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
    setEditingModel(model)
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: false }))
  }

  const handleDeleteModel = (model: LLM) => {
    setDeletingModel(model)
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: false }))
  }

  const confirmDeleteModel = () => {
    if (deletingModel) {
      deleteLLMMutation.mutate(deletingModel.id)
      setDeletingModel(null)
    }
  }

  const handleDefaultChange = (llmId: string, isDefault: boolean) => {
    if (isDefault) {
      setDefaultMutation.mutate(llmId)
    }
  }

  // Helper function to get required fields for a provider
  const getRequiredFields = (provider: any) => {
    return {
      api_key: provider.api_key === true,
      endpoint: provider.endpoint_required === true || provider.endpoint === true,
      deployment: provider.deployment_required === true || provider.deployment === true
    }
  }

  // Handle provider edit
  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider)
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: false }))
  }

  // Handle provider delete
  const handleDeleteProvider = (provider: any) => {
    setDeletingProvider(provider)
    // Close dropdown after opening dialog
    setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: false }))
  }

  const confirmDeleteProvider = () => {
    if (deletingProvider) {
      deleteProviderMutation.mutate(deletingProvider.id)
      setDeletingProvider(null)
    }
  }

  if (loadingSupportedProviders || loadingConfiguredProviders || loadingLLMs) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!allProviders || allProviders.length === 0) {
    return (
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">
            Manage your LLM providers and models in one place
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No providers available. Please check your connection or try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">
          Manage your LLM providers and models in one place
        </p>
      </div>

      {/* Providers List */}
      <div className="space-y-3">
        {allProviders.map((provider: any) => {
          const status = getProviderStatus(provider)
          const isOpen = openProviders.includes(provider.id)
          const models = getProviderModels(provider.id)

          return (
            <div key={provider.id} className="border border-gray-200 rounded-lg bg-white">
              <Collapsible 
                open={isOpen} 
                onOpenChange={(open) => {
                  if (open) {
                    setOpenProviders(prev => [...prev, provider.id])
                  } else {
                    setOpenProviders(prev => prev.filter(id => id !== provider.id))
                  }
                }}
              >
                <div className="flex w-full items-center p-4">
                  <CollapsibleTrigger
                    className="flex items-center gap-3 text-left hover:bg-gray-50 rounded-lg p-2 flex-1"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-700">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        {status.configured ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 font-medium">Configured</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500 font-medium">Not configured</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {status.modelCount} model{status.modelCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  {/* Action buttons */}
                  {status.configured && (
                    <div className="flex items-center gap-1 mr-2">
                      {isMobile ? (
                        <DropdownMenu 
                          open={openDropdowns[`provider-${provider.id}`] || false}
                          onOpenChange={(open) => 
                            setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: open }))
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-gray-50"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditProvider(provider)}
                              className="hover:cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2 text-blue-600" />
                              Edit Provider
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProvider(provider)}
                              className="hover:cursor-pointer text-red-600"
                              disabled={deleteProviderMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deleteProviderMutation.isPending ? 'Deleting...' : 'Delete Provider'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditProvider(provider)
                            }}
                            className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProvider(provider)
                            }}
                            className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-red-50"
                            disabled={deleteProviderMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Chevron button */}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-gray-50"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                {isOpen && (
                  <CollapsibleContent className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                    {status.configured ? (
                      <>
                        {/* Models Section */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-900">Models</h4>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProviderId(provider.id)
                                setIsCreateModelOpen(true)
                              }}
                              className="hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Model
                            </Button>
                          </div>
                          <div className="bg-gray-50 rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-gray-200">
                                  <TableHead className="text-gray-600 font-medium">Display Name</TableHead>
                                  <TableHead className="text-gray-600 font-medium">Technical Name</TableHead>
                                  <TableHead className="text-gray-600 font-medium">Default</TableHead>
                                  <TableHead className="text-gray-600 font-medium">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {models.map((model) => (
                                  <TableRow key={model.id} className="border-b border-gray-100 hover:bg-white">
                                    <TableCell className="font-semibold text-gray-900">{model.name}</TableCell>
                                    <TableCell className="text-gray-500 font-mono text-sm">
                                      {model.internal_name}
                                    </TableCell>
                                    <TableCell>
                                      <Checkbox
                                        checked={model.is_default || false}
                                        onCheckedChange={(checked) =>
                                          handleDefaultChange(model.id, checked as boolean)
                                        }
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        {isMobile ? (
                                          <DropdownMenu 
                                            open={openDropdowns[`model-${model.id}`] || false}
                                            onOpenChange={(open) => 
                                              setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: open }))
                                            }
                                          >
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-gray-50"
                                              >
                                                <MoreVertical className="h-4 w-4 text-gray-600" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={() => handleEditModel(model)}
                                                className="hover:cursor-pointer"
                                              >
                                                <Edit className="h-4 w-4 mr-2 text-blue-600" />
                                                Edit Model
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleDeleteModel(model)}
                                                className="hover:cursor-pointer text-red-600"
                                                disabled={deleteLLMMutation.isPending}
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {deleteLLMMutation.isPending ? 'Deleting...' : 'Delete Model'}
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        ) : (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditModel(model)}
                                              className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-blue-50"
                                            >
                                              <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteModel(model)}
                                              className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-red-50"
                                              disabled={deleteLLMMutation.isPending}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Configuration Section for unconfigured providers */}
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                              <span className="text-2xl font-bold text-gray-400">
                                {provider.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{provider.name}</h3>
                            <p className="text-gray-500 mb-6">
                              Configure this provider to start using its models
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setEditingProvider({
                                ...provider,
                                key: '',
                                endpoint: '',
                                deployment: ''
                              })
                            }}
                            className="hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Configure Provider
                          </Button>
                        </div>
                      </>
                    )}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          )
        })}
      </div>

      {/* Create Provider Dialog */}
      <Dialog open={isCreateProviderOpen} onOpenChange={setIsCreateProviderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateProvider}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#4464f7]" />
                Add Provider
              </DialogTitle>
              <DialogDescription>
                Create a new LLM provider configuration to enable AI model access.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Provider Name *
                  </label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g., OpenAI, Azure OpenAI..." 
                    className="w-full"
                    required 
                  />
                </div>
                {/* Show API Key field only if required by provider */}
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    API Key *
                  </label>
                  <Input 
                    id="key" 
                    name="key" 
                    type="password" 
                    placeholder="Enter your API key..." 
                    className="w-full"
                    required 
                  />
                </div>
                {/* Note: This is the generic create form - specific provider forms are handled in edit dialog */}
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Endpoint
                  </label>
                  <Input 
                    id="endpoint" 
                    name="endpoint" 
                    placeholder="https://api.example.com/v1" 
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Deployment
                  </label>
                  <Input 
                    id="deployment" 
                    name="deployment" 
                    placeholder="Enter deployment name..." 
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateProviderOpen(false)}
                disabled={createProviderMutation.isPending}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProviderMutation.isPending}
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProvider?.isConfigured === false || editingProvider?.id?.startsWith('supported-') ? (
                <>
                  <Settings className="h-5 w-5 text-[#4464f7]" />
                  Configure Provider - {editingProvider?.name}
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5 text-[#4464f7]" />
                  Edit Provider - {editingProvider?.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingProvider?.isConfigured === false || editingProvider?.id?.startsWith('supported-') 
                ? `Set up your ${editingProvider?.name} provider configuration with your API credentials.`
                : `Update the configuration settings for your ${editingProvider?.name} provider.`
              }
            </DialogDescription>
          </DialogHeader>
          {editingProvider && (
            <form onSubmit={handleUpdateProvider}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Provider Name *
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingProvider.name}
                      className="w-full"
                      required
                    />
                  </div>
                  {/* Show API Key field only if required by provider */}
                  {getRequiredFields(editingProvider).api_key && (
                    <div>
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        API Key *
                      </label>
                      <Input
                        id="edit-key"
                        name="key"
                        type="password"
                        defaultValue={editingProvider.key}
                        placeholder="Enter your API key..."
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                  {/* Show Endpoint field only if required by provider */}
                  {getRequiredFields(editingProvider).endpoint && (
                    <div>
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Endpoint *
                      </label>
                      <Input
                        id="edit-endpoint"
                        name="endpoint"
                        defaultValue={editingProvider.endpoint}
                        placeholder="https://api.example.com/v1"
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                  {/* Show Deployment field only if required by provider */}
                  {getRequiredFields(editingProvider).deployment && (
                    <div>
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Deployment *
                      </label>
                      <Input
                        id="edit-deployment"
                        name="deployment"
                        defaultValue={editingProvider.deployment}
                        placeholder="Enter deployment name..."
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                  {/* Hidden fields for non-required fields to ensure form data consistency */}
                  {!getRequiredFields(editingProvider).api_key && (
                    <input type="hidden" name="key" value="" />
                  )}
                  {!getRequiredFields(editingProvider).endpoint && (
                    <input type="hidden" name="endpoint" value="" />
                  )}
                  {!getRequiredFields(editingProvider).deployment && (
                    <input type="hidden" name="deployment" value="" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingProvider(null)}
                  disabled={updateProviderMutation.isPending || createProviderMutation.isPending}
                  className="hover:cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProviderMutation.isPending || createProviderMutation.isPending}
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                >
                  {(updateProviderMutation.isPending || createProviderMutation.isPending) 
                    ? 'Saving...' 
                    : (editingProvider?.isConfigured === false || editingProvider?.id?.startsWith('supported-'))
                      ? 'Configure Provider'
                      : 'Update Provider'
                  }
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>      {/* Create Model Dialog */}
      <Dialog open={isCreateModelOpen} onOpenChange={setIsCreateModelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateModel}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#4464f7]" />
                Add Model to {allProviders.find((p: any) => p.id === selectedProviderId)?.name}
              </DialogTitle>
              <DialogDescription>
                Add a new AI model to your {allProviders.find((p: any) => p.id === selectedProviderId)?.name} provider configuration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Display Name *
                  </label>
                  <Input 
                    id="displayName" 
                    name="displayName" 
                    placeholder="e.g. GPT-4 Turbo" 
                    className="w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Technical Name *
                  </label>
                  <Input
                    id="technicalName"
                    name="technicalName"
                    placeholder="e.g., gpt-4-turbo-preview"
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use the exact model name as specified by the provider's API documentation.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModelOpen(false)}
                disabled={createLLMMutation.isPending}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLLMMutation.isPending}
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                {createLLMMutation.isPending ? 'Creating...' : 'Save Model'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Model Dialog */}
      <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-[#4464f7]" />
              Edit Model - {editingModel?.name}
            </DialogTitle>
            <DialogDescription>
              Update the configuration for your AI model.
            </DialogDescription>
          </DialogHeader>
          {editingModel && (
            <form onSubmit={handleUpdateModel}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Display Name *
                    </label>
                    <Input 
                      id="edit-displayName" 
                      name="displayName" 
                      defaultValue={editingModel.name}
                      placeholder="e.g. GPT-4 Turbo" 
                      className="w-full"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Technical Name *
                    </label>
                    <Input
                      id="edit-technicalName"
                      name="technicalName"
                      defaultValue={editingModel.internal_name}
                      placeholder="e.g., gpt-4-turbo-preview"
                      className="w-full"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use the exact model name as specified by the provider's API documentation.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingModel(null)}
                  disabled={updateLLMMutation.isPending}
                  className="hover:cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateLLMMutation.isPending}
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                >
                  {updateLLMMutation.isPending ? 'Updating...' : 'Update Model'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Provider Confirmation Dialog */}
      <AlertDialog open={!!deletingProvider} onOpenChange={() => setDeletingProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{deletingProvider?.name}</strong> provider? 
              This will remove all configuration but keep it available for future setup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProvider(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProvider}
              className="bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 focus:ring-2 focus:ring-offset-2"
              disabled={deleteProviderMutation.isPending}
            >
              {deleteProviderMutation.isPending ? 'Deleting...' : 'Delete Provider'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Model Confirmation Dialog */}
      <AlertDialog open={!!deletingModel} onOpenChange={() => setDeletingModel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the model <strong>"{deletingModel?.name}"</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingModel(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteModel}
              className="bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 focus:ring-2 focus:ring-offset-2"
              disabled={deleteLLMMutation.isPending}
            >
              {deleteLLMMutation.isPending ? 'Deleting...' : 'Delete Model'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}