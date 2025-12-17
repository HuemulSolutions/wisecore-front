import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, CheckCircle, Circle, Settings, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [editingProvider, setEditingProvider] = useState<(LLMProvider & { 
    isConfigured?: boolean; 
    isSupported?: boolean; 
    display_name?: string;
    api_key_required?: boolean;
    endpoint_required?: boolean;
    deployment_required?: boolean;
    providerKey?: string;
  }) | null>(null)

  // isCreateProviderOpen removed - providers are configured from supported providers list
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [editingModel, setEditingModel] = useState<LLM | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<(LLMProvider & { 
    isConfigured?: boolean; 
    isSupported?: boolean; 
    display_name?: string;
  }) | null>(null)
  const [deletingModel, setDeletingModel] = useState<LLM | null>(null)
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({})

  // Queries with optimized caching
  const { data: supportedProvidersResponse, isLoading: loadingSupportedProviders } = useQuery({
    queryKey: ['supportedProviders'],
    queryFn: getSupportedProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  })

  const { data: configuredProvidersResponse, isLoading: loadingConfiguredProviders } = useQuery({
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
      setEditingProvider(null)
      toast.success('Provider configured successfully')
    },
    onError: (error) => {
      toast.error(`Error configuring provider: ${error.message}`)
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
    if (!supportedProvidersResponse?.data) return []
    
    const supportedProviders = supportedProvidersResponse.data
    const configuredProviders = configuredProvidersResponse?.data || []
    
    console.log('🔍 Supported providers:', supportedProviders)
    console.log('🔍 Configured providers:', configuredProviders)
    
    // Create a lookup map of configured providers by name
    const configuredMap = new Map<string, LLMProvider>()
    configuredProviders.forEach((config: LLMProvider) => {
      configuredMap.set(config.name, config)
    })
    
    console.log('🔍 Configured map:', configuredMap)
    
    // Convert supported providers object to array with combined data
    return Object.entries(supportedProviders).map(([providerKey, supportedData]) => {
      // Check if this provider exists in configured providers
      const configuredProvider = configuredMap.get(providerKey)
      const isConfigured = !!configuredProvider
      
      console.log(`🔍 Checking provider ${providerKey}:`, { 
        isConfigured,
        configuredProvider 
      })
      
      if (isConfigured && configuredProvider) {
        // Provider is configured - use configured provider data and merge with supported requirements
        const result = {
          id: configuredProvider.id,
          name: providerKey, // Use the provider key from supported (e.g., 'openai', 'azure_openai')
          display_name: configuredProvider.display_name || supportedData.display,
          key: configuredProvider.key || '',
          endpoint: configuredProvider.endpoint || '',
          deployment: configuredProvider.deployment || '',
          // Requirements from supported endpoint (for editing forms)
          api_key_required: supportedData.api_key,
          endpoint_required: supportedData.endpoint,
          deployment_required: supportedData.deployment,
          isConfigured: true,
          providerKey
        }
        console.log(`✅ Provider ${providerKey} is CONFIGURED:`, result)
        return result
      } else {
        // Provider is supported but not configured yet
        const result = {
          id: `unconfigured-${providerKey}`,
          name: providerKey,
          display_name: supportedData.display,
          key: '',
          endpoint: '',
          deployment: '',
          // Requirements from supported endpoint
          api_key_required: supportedData.api_key,
          endpoint_required: supportedData.endpoint,
          deployment_required: supportedData.deployment,
          isConfigured: false,
          providerKey
        }
        console.log(`❌ Provider ${providerKey} is NOT configured:`, result)
        return result
      }
    })
  }, [supportedProvidersResponse, configuredProvidersResponse])

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
    if (supportedProvidersResponse?.data && Object.keys(supportedProvidersResponse.data).length > 0) {
      const transactionId = supportedProvidersResponse.transaction_id
      
      if (transactionId && transactionId !== lastLoggedId.current) {
        console.log(`✅ Supported providers fetched:`, supportedProvidersResponse)
        lastLoggedId.current = transactionId
      }
    }
  }, [supportedProvidersResponse])

  // Debug final providers combination
  React.useEffect(() => {
    if (allProviders.length > 0) {
      console.log('🎯 Final allProviders:', allProviders)
      // Log summary of configured vs unconfigured
      const configured = allProviders.filter(p => p.isConfigured).length
      const unconfigured = allProviders.filter(p => !p.isConfigured).length
      console.log(`📊 Providers summary: ${configured} configured, ${unconfigured} unconfigured`)
    }
  }, [allProviders])

  // Helper functions
  const getProviderModels = (providerId: string) => {
    return llms.filter(llm => llm.provider_id === providerId)
  }

  const getProviderStatus = (provider: any) => {
    const models = getProviderModels(provider.id)
    return {
      configured: provider.isConfigured === true, // Simplificamos: si isConfigured es true, está configurado
      modelCount: models.length
    }
  }

  // handleCreateProvider removed - providers are configured from supported providers list

  const handleUpdateProvider = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingProvider) return
    const formData = new FormData(event.currentTarget)
    
    // Build data object dynamically based on required fields
    const requiredFields = getRequiredFields(editingProvider)
    const providerKey = (editingProvider as any).providerKey || editingProvider.name
    
    console.log('📤 Sending provider data:')
    console.log('  - Provider key (name):', providerKey)
    console.log('  - Display name:', editingProvider.display_name)
    console.log('  - Required fields:', requiredFields)
    
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
      api_key: provider.api_key_required === true,
      endpoint: provider.endpoint_required === true,
      deployment: provider.deployment_required === true
    }
  }

  // Handle provider edit
  const handleEditProvider = (provider: any) => {
    console.log('📝 Editing provider:', provider)
    console.log('📝 Provider name (key):', provider.name)
    console.log('📝 Provider display_name:', provider.display_name)
    setEditingProvider({
      ...provider,
      providerKey: provider.name // Ensure we have the correct provider key
    })
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

  // Loading state
  if (loadingSupportedProviders || loadingConfiguredProviders || loadingLLMs) {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Skeleton className="h-9 w-48" />
          </div>
          <Card className="border border-border bg-card">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Error or empty state
  if (!allProviders || allProviders.length === 0) {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Models Configuration</h1>
            </div>
          </div>
          <Card className="border border-border bg-card">
            <div className="text-center py-12">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No providers available</h3>
              <p className="text-muted-foreground">Please check your connection or try again later.</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Models Configuration</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {allProviders.filter(p => p.isConfigured).length} configured providers
            </Badge>
            <Badge variant="outline" className="text-sm">
              {llms.length} models
            </Badge>
          </div>
        </div>

        {/* Providers List */}
        <div className="space-y-4 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        {allProviders.map((provider: any) => {
          const status = getProviderStatus(provider)
          const isOpen = openProviders.includes(provider.id)
          const models = getProviderModels(provider.id)

          return (
            <Card key={provider.id} className="border border-border bg-card">
              <Collapsible 
          open={isOpen} 
          onOpenChange={(open) => {
            if (open) {
              setOpenProviders(prev => [...prev, provider.id])
            } else {
              setOpenProviders(prev => prev.filter(id => id !== provider.id))
            }
          }}
          className="h-auto"
              >
          <div className="flex w-full items-center p-4">
            <CollapsibleTrigger
              className="flex items-center gap-3 text-left hover:bg-muted/20 rounded-lg p-2 flex-1"
            >
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <span className="text-lg font-semibold text-foreground">
            {(provider.display_name || provider.name).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{provider.display_name || provider.name}</h3>
                <div className="flex items-center gap-2 text-sm mt-1">
            {status.configured ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge className="bg-green-100/80 text-green-700 border-green-200">Configured</Badge>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {status.modelCount} model{status.modelCount !== 1 ? 's' : ''}
            </span>
                </div>
              </div>
            </CollapsibleTrigger>
            
            {/* Action buttons - solo mostrar para proveedores configurados */}
            {provider.isConfigured && (
              <div className="flex items-center gap-1 mr-2">
                {isMobile ? (
            <DropdownMenu 
              open={openDropdowns[`provider-${provider.id}`] || false}
              onOpenChange={(open) => 
                setOpenDropdowns(prev => ({ ...prev, [`provider-${provider.id}`]: open }))
              }
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-muted/20"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
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
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditProvider(provider)
                }}
                className="hover:cursor-pointer h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteProvider(provider)
                }}
                className="hover:cursor-pointer h-8 w-8 p-0"
                disabled={deleteProviderMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
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
                className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-muted/20"
              >
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          {isOpen && (
            <CollapsibleContent className="px-6 pt-6 pb-6 bg-muted/30 border-t border-border overflow-visible">
              {provider.isConfigured ? (
                <>
            {/* Models Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-foreground">Models</h4>
                <Button
                  size="sm"
                  onClick={() => {
              setSelectedProviderId(provider.id)
              setIsCreateModelOpen(true)
                  }}
                  className="hover:cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30">
                <TableHead className="text-foreground font-medium">Display Name</TableHead>
                <TableHead className="text-foreground font-medium">Technical Name</TableHead>
                <TableHead className="text-foreground font-medium">Default</TableHead>
                <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} className="border-b border-border hover:bg-muted/20 transition">
                    <TableCell className="font-semibold text-foreground">{model.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                {model.internal_name}
                    </TableCell>
                    <TableCell>
                <Checkbox
                  checked={model.is_default || false}
                  onCheckedChange={(checked) =>
                    handleDefaultChange(model.id, checked as boolean)
                  }
                />
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                {isMobile ? (
                  <DropdownMenu 
                    open={openDropdowns[`model-${model.id}`] || false}
                    onOpenChange={(open) => 
                      setOpenDropdowns(prev => ({ ...prev, [`model-${model.id}`]: open }))
                    }
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                  variant="outline"
                  size="sm"
                  className="hover:cursor-pointer h-8 w-8 p-0"
                      >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
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
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditModel(model)}
                      className="hover:cursor-pointer h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteModel(model)}
                      className="hover:cursor-pointer h-8 w-8 p-0"
                      disabled={deleteLLMMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-muted-foreground">
              {(provider.display_name || provider.name).charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{provider.display_name || provider.name}</h3>
                <p className="text-muted-foreground mb-6">
                  Configure this provider to start using its models
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingProvider({
              ...provider,
              key: '',
              endpoint: '',
              deployment: '',
              providerKey: provider.name // This should be the key like 'openai', 'azure_openai', etc.
                  })
                }}
                className="hover:cursor-pointer"
              >
                Configure Provider
              </Button>
            </div>
                </>
              )}
            </CollapsibleContent>
          )}
              </Collapsible>
            </Card>
          )
        })}
        </div>

        {/* Empty State when no models exist */}
        {allProviders.filter(p => p.isConfigured).length === 0 && (
          <Card className="border border-border bg-card">
            <div className="text-center py-12">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No providers configured</h3>
              <p className="text-muted-foreground">
                Configure providers above to start creating and managing AI models.
              </p>
            </div>
          </Card>
        )}
      </div>

        {/* Create Provider Dialog - Removed: Providers are configured from supported providers list */}

        {/* Edit Provider Dialog */}
      <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProvider?.isConfigured === false || editingProvider?.id?.startsWith('unconfigured-') ? (
                <>
                  <Settings className="h-5 w-5 text-[#4464f7]" />
                  Configure Provider - {editingProvider?.display_name || editingProvider?.name}
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5 text-[#4464f7]" />
                  Edit Provider - {editingProvider?.display_name || editingProvider?.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingProvider?.isConfigured === false || editingProvider?.id?.startsWith('unconfigured-') 
                ? `Set up your ${editingProvider?.display_name || editingProvider?.name} provider configuration with your API credentials.`
                : `Update the configuration settings for your ${editingProvider?.display_name || editingProvider?.name} provider.`
              }
            </DialogDescription>
          </DialogHeader>
          {editingProvider && (
            <form onSubmit={handleUpdateProvider}>
              <div className="space-y-6">
                <div className="space-y-4">
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
                      : 'Update Configuration'
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
                Add Model to {allProviders.find((p: any) => p.id === selectedProviderId)?.display_name || allProviders.find((p: any) => p.id === selectedProviderId)?.name}
              </DialogTitle>
              <DialogDescription>
                Add a new AI model to your {allProviders.find((p: any) => p.id === selectedProviderId)?.display_name || allProviders.find((p: any) => p.id === selectedProviderId)?.name} provider configuration.
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