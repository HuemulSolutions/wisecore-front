import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { usePageAccess } from '@/hooks/usePageAccess'
import { useOrganization } from '@/contexts/organization-context'
import { useLlmConfigurationStatus, llmConfigStatusQueryKey } from '@/hooks/useLlmConfigurationStatus'
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout'
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied'
import { HuemulTabCount } from '@/huemul/components/huemul-tab-count'
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants'
import {
  getSupportedProviders,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} from '@/services/llm-provider'
import {
  getLLMs,
  getAllLLMs,
  createLLM,
  updateLLMModel,
  deleteLLM,
  setDefaultLLM,
  testLLMConnection,
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
import { resolveConnectionTests } from '@/lib/llm-capabilities'
import { buildEmbeddingProviderOptions } from '@/lib/embedding-provider-options'
import { showModelsToast } from '@/lib/models-toast'
import { handleApiError } from '@/lib/error-utils'
import {
  ModelsHeader,
  ModelsLoadingState,
  ModelsContentEmptyState,
  ModelsStatusCards,
  ModelsProvidersStrip,
  ModelsTable,
  ModelSheet,
} from '@/components/llm'
import { ProviderSheet } from '@/components/llm-provider'
import { EmbeddingsTab, EmbeddingProviderSheet } from '@/components/embedding-provider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { LLM, CreateLLMRequest, ModelDialogSubmitData, ModelTestState } from '@/types/models'
import type { CreateLLMProviderRequest, LLMProvider } from '@/types/llm-provider'
import type {
  EmbeddingProviderName,
  EmbeddingSheetSubmit,
  EmbeddingTestState,
} from '@/types/embedding-provider'

type ModelSheetState = { open: boolean; model: LLM | null }
type ProviderSheetState = { open: boolean; provider: LLMProvider | null }
type EmbeddingSheetState = { open: boolean; initialName: EmbeddingProviderName }

export default function Models() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('models')
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('models')

  const [modelSheet, setModelSheet] = useState<ModelSheetState>({ open: false, model: null })
  const [providerSheet, setProviderSheet] = useState<ProviderSheetState>({ open: false, provider: null })
  const [embeddingSheet, setEmbeddingSheet] = useState<EmbeddingSheetState>({ open: false, initialName: 'openai' })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [modelTests, setModelTests] = useState<Record<string, ModelTestState>>({})
  const [embeddingTest, setEmbeddingTest] = useState<EmbeddingTestState>('idle')

  // Verificar permisos
  const canListProviders = can('listProviders')
  const canCreateProvider = can('createProvider')
  const canUpdateProvider = can('updateProvider')
  const canDeleteProvider = can('deleteProvider')
  const canListModels = can('listModels')
  const canCreateModel = can('createModel')
  const canUpdateModel = can('updateModel')
  const canDeleteModel = can('deleteModel')
  const canTestModel = can('testModel')

  const isOrgReady = !!selectedOrganizationId && !!organizationToken

  // Tab activo: cae al primer tab disponible si el actual deja de estarlo
  // (ej. el usuario solo tiene permisos de un recurso de los dos).
  const [activeTab, setActiveTab] = useState<'models' | 'embeddings'>('models')
  useEffect(() => {
    if (activeTab === 'models' && !canListModels && canListProviders) setActiveTab('embeddings')
    if (activeTab === 'embeddings' && !canListProviders && canListModels) setActiveTab('models')
  }, [activeTab, canListModels, canListProviders])

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: supportedResponse } = useQuery({
    queryKey: ['supportedProviders', selectedOrganizationId],
    queryFn: getSupportedProviders,
    retry: 0,
    enabled: isOrgReady && canListProviders,
  })

  const { data: allProvidersResponse, isLoading: loadingProviders, error: errorProviders } = useQuery({
    queryKey: ['allProviders', selectedOrganizationId],
    queryFn: () => getAllProviders(),
    retry: 0,
    enabled: isOrgReady && canListProviders,
  })

  const { data: llmsResponse, isLoading: loadingLLMs, isFetching: fetchingLLMs, error: errorLLMs } = useQuery({
    queryKey: ['llms', 'list', selectedOrganizationId, page, pageSize, search],
    queryFn: () => getLLMs(page, pageSize, search),
    retry: 0,
    enabled: isOrgReady && canListModels,
  })

  // Lista completa (sin paginar ni filtrar): contadores por proveedor, modelo predeterminado y "primer modelo".
  const { data: allLlmsData } = useQuery({
    queryKey: ['llms', 'all', selectedOrganizationId],
    queryFn: getAllLLMs,
    retry: 0,
    enabled: isOrgReady && canListModels,
  })

  const { data: embeddingSupportedResponse, error: errorEmbeddingSupportedProviders } = useQuery({
    queryKey: ['embeddingSupportedProviders', selectedOrganizationId],
    queryFn: () => getSupportedEmbeddingProviders(1, 1000),
    retry: 0,
    enabled: isOrgReady && canListProviders,
  })

  const { data: embeddingProviderResponse, error: errorEmbeddingProvider } = useQuery({
    queryKey: ['embeddingProvider', selectedOrganizationId],
    queryFn: getEmbeddingProvider,
    retry: 0,
    enabled: isOrgReady && canListProviders,
  })

  const { data: configStatus, isLoading: loadingStatus } = useLlmConfigurationStatus(
    selectedOrganizationId,
    canListModels || canListProviders,
  )

  const llms: LLM[] = llmsResponse?.data ?? []
  const allLlms: LLM[] = useMemo(() => allLlmsData ?? [], [allLlmsData])
  const supportedProviders = supportedResponse?.data ?? []
  const allProvidersList: LLMProvider[] = allProvidersResponse?.data ?? []
  const configuredEmbedding = embeddingProviderResponse?.data ?? null
  const embeddingOptions = useMemo(
    () => buildEmbeddingProviderOptions(embeddingSupportedResponse?.data ?? [], configuredEmbedding),
    [embeddingSupportedResponse, configuredEmbedding],
  )

  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const model of allLlms) counts[model.provider_id] = (counts[model.provider_id] ?? 0) + 1
    return counts
  }, [allLlms])

  const defaultModel = allLlms.find((llm) => llm.is_default) ?? null
  const isFirstModel = allLlms.length === 0

  // ── Estado de configuración (tarjetas) ───────────────────────────────────
  const defaultConfigured = configStatus ? configStatus.default_llm.is_configured : !!defaultModel
  const defaultWorking = configStatus ? configStatus.default_llm.is_working !== false : true
  const embeddingConfigured = configStatus ? configStatus.embedding.is_configured : !!configuredEmbedding
  const embeddingWorking = (configStatus ? configStatus.embedding.is_working !== false : true) && embeddingTest !== 'error'
  const embeddingActiveName = embeddingOptions.find((o) => o.isActive)?.display

  // ── Invalidaciones ───────────────────────────────────────────────────────
  const invalidateModels = () => queryClient.invalidateQueries({ queryKey: ['llms'] })
  const invalidateProviders = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['supportedProviders'] }),
      queryClient.invalidateQueries({ queryKey: ['allProviders'] }),
    ])
  const invalidateEmbeddings = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['embeddingSupportedProviders'] }),
      queryClient.invalidateQueries({ queryKey: ['embeddingProvider'] }),
    ])
  // Tras cualquier cambio de modelos/proveedores/embeddings las tarjetas de estado (y el banner del layout) se actualizan.
  const invalidateStatus = () =>
    selectedOrganizationId
      ? queryClient.invalidateQueries({ queryKey: llmConfigStatusQueryKey(selectedOrganizationId) })
      : Promise.resolve()

  // ── Mutaciones ───────────────────────────────────────────────────────────
  const createProviderMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      invalidateProviders()
      invalidateStatus()
      setProviderSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.providerConnected'))
    },
  })

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLLMProviderRequest }) => updateProvider(id, data),
    onSuccess: () => {
      invalidateProviders()
      invalidateStatus()
      setProviderSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.providerUpdated'))
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      invalidateProviders()
      invalidateStatus()
      setProviderSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.providerDeleted'))
    },
  })

  const createLLMMutation = useMutation({
    mutationFn: async ({ payload, makeDefault }: { payload: CreateLLMRequest; makeDefault: boolean }) => {
      const created = await createLLM(payload)
      // El primer modelo queda como predeterminado; si esto falla el modelo ya existe, no se revierte.
      if (makeDefault && created?.id) {
        try {
          await setDefaultLLM(created.id)
        } catch (error) {
          handleApiError(error, { fallbackMessage: t('errors.failedToLoadModels') })
        }
      }
      return created
    },
    onSuccess: (created) => {
      invalidateModels()
      invalidateStatus()
      setModelSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.modelCreated', { name: created.name }))
    },
  })

  const updateLLMMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLLMRequest }) => updateLLMModel(id, data),
    onSuccess: () => {
      invalidateModels()
      invalidateStatus()
      setModelSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.modelUpdated'))
    },
  })

  const deleteLLMMutation = useMutation({
    mutationFn: deleteLLM,
    onSuccess: () => {
      invalidateModels()
      invalidateStatus()
      showModelsToast(t('toast.modelDeleted'))
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (model: LLM) => setDefaultLLM(model.id),
    onSuccess: (_, model) => {
      invalidateModels()
      invalidateStatus()
      showModelsToast(t('toast.defaultUpdated', { name: model.name }))
    },
  })

  const createEmbeddingMutation = useMutation({
    mutationFn: createEmbeddingProvider,
    onSuccess: () => {
      invalidateEmbeddings()
      invalidateStatus()
      setEmbeddingSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.embeddingConfigured'))
    },
  })

  const updateEmbeddingMutation = useMutation({
    mutationFn: updateEmbeddingProvider,
    onSuccess: () => {
      invalidateEmbeddings()
      invalidateStatus()
      setEmbeddingSheet((s) => ({ ...s, open: false }))
      showModelsToast(t('toast.embeddingUpdated'))
    },
  })

  const deleteEmbeddingMutation = useMutation({
    mutationFn: deleteEmbeddingProvider,
    onSuccess: () => {
      invalidateEmbeddings()
      invalidateStatus()
      setEmbeddingTest('idle')
      showModelsToast(t('toast.embeddingDeleted'))
    },
  })

  // ── Pruebas de conexión (estado inline, sin toast) ───────────────────────
  const runModelTest = async (model: LLM) => {
    if (!canTestModel) return
    setModelTests((prev) => ({ ...prev, [model.id]: 'testing' }))
    // Un modelo solo-imagen no tiene chat/completions: se prueba por su endpoint de generación.
    const kind = resolveConnectionTests(model)[0] ?? 'chat'
    try {
      await (kind === 'image' ? testImageGenerationConnection() : testLLMConnection(model.id))
      setModelTests((prev) => ({ ...prev, [model.id]: 'ok' }))
    } catch {
      setModelTests((prev) => ({ ...prev, [model.id]: 'error' }))
    } finally {
      invalidateStatus()
    }
  }

  const runEmbeddingTest = async () => {
    if (!canUpdateProvider) return
    setEmbeddingTest('testing')
    try {
      await testEmbeddingProviderConnection()
      setEmbeddingTest('ok')
    } catch {
      setEmbeddingTest('error')
    } finally {
      invalidateStatus()
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openCreateProvider = () => setProviderSheet({ open: true, provider: null })
  const openEditProvider = (provider: LLMProvider) => setProviderSheet({ open: true, provider })
  const openAddModel = () => setModelSheet({ open: true, model: null })

  const openProviderOfModel = (model: LLM) => {
    const provider = allProvidersList.find((p) => p.id === model.provider_id)
    if (provider) openEditProvider(provider)
  }

  // Desde el sheet de modelo: cerrarlo y abrir el de proveedor (nunca dos sheets apilados).
  const connectProviderFromModelSheet = () => {
    setModelSheet((s) => ({ ...s, open: false }))
    openCreateProvider()
  }

  const openEmbeddingSheet = (initialName: EmbeddingProviderName) => {
    setEmbeddingTest('idle')
    setEmbeddingSheet({ open: true, initialName })
  }

  const handleSubmitModel = (data: ModelDialogSubmitData) => {
    const editing = modelSheet.model
    const payload: CreateLLMRequest = {
      name: data.name,
      internal_name: data.internal_name,
      capabilities: data.capabilities,
      provider_id: data.provider_id ?? editing?.provider_id ?? '',
      input_price_per_1m_tokens: data.input_price_per_1m_tokens ?? null,
      output_price_per_1m_tokens: data.output_price_per_1m_tokens ?? null,
    }
    if (editing) {
      if (!canUpdateModel) return
      updateLLMMutation.mutate({ id: editing.id, data: payload })
      return
    }
    if (!canCreateModel) return
    createLLMMutation.mutate({ payload, makeDefault: isFirstModel })
  }

  const handleSubmitProvider = (data: CreateLLMProviderRequest) => {
    const editing = providerSheet.provider
    if (editing) {
      if (!canUpdateProvider) return
      updateProviderMutation.mutate({ id: editing.id, data })
      return
    }
    if (!canCreateProvider) return
    createProviderMutation.mutate(data)
  }

  const handleDeleteProvider = async () => {
    const editing = providerSheet.provider
    if (!editing || !canDeleteProvider) return
    await deleteProviderMutation.mutateAsync(editing.id)
  }

  const handleSubmitEmbedding = (submit: EmbeddingSheetSubmit) => {
    if (submit.mode === 'update') {
      if (!canUpdateProvider) return
      updateEmbeddingMutation.mutate(submit.payload)
      return
    }
    if (!canCreateProvider) return
    createEmbeddingMutation.mutate(submit.payload)
  }

  const handleDisconnectEmbedding = async () => {
    if (!canDeleteProvider) return
    await deleteEmbeddingMutation.mutateAsync()
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([invalidateProviders(), invalidateModels(), invalidateEmbeddings(), invalidateStatus()])
    } finally {
      setIsRefreshing(false)
    }
  }

  // 1. Esperar mientras se cargan los permisos
  if (isLoadingPermissions) {
    return <ModelsLoadingState />
  }

  // 2. Gate de página: ¿tiene algún permiso sobre llm o llm_provider?
  if (!canAccessPage) {
    return <HuemulAccessDenied />
  }

  // 3. Esperar la query de proveedores
  if (loadingProviders) {
    return <ModelsLoadingState />
  }

  const hasError = !!errorProviders
  const hasEmbeddingError = !!errorEmbeddingSupportedProviders || !!errorEmbeddingProvider
  const modelsTabActive = activeTab === 'models'

  return (
    <>
      <HuemulPageLayout
        header={<ModelsHeader onRefresh={handleRefresh} isLoading={isRefreshing || fetchingLLMs} />}
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: (
              <div className="flex flex-col gap-5">
                <ModelsStatusCards
                  isLoading={loadingStatus && !configStatus}
                  defaultModel={defaultModel}
                  defaultProviderName={defaultModel?.provider?.name ?? defaultModel?.provider_name}
                  defaultConfigured={defaultConfigured}
                  defaultWorking={defaultWorking}
                  defaultTestState={defaultModel ? modelTests[defaultModel.id] : undefined}
                  hasProviders={allProvidersList.length > 0}
                  embeddingConfigured={embeddingConfigured}
                  embeddingWorking={embeddingWorking}
                  embeddingProviderName={embeddingActiveName}
                  canTest={canTestModel}
                  canCreateProvider={canCreateProvider}
                  canCreateModel={canCreateModel}
                  canConfigureEmbeddings={canListProviders && (embeddingConfigured || canCreateProvider)}
                  onTestDefault={() => defaultModel && runModelTest(defaultModel)}
                  onConnectProvider={openCreateProvider}
                  onAddModel={openAddModel}
                  onViewEmbeddings={() => setActiveTab('embeddings')}
                  onConfigureEmbeddings={() => {
                    setActiveTab('embeddings')
                    openEmbeddingSheet('openai')
                  }}
                />

                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as 'models' | 'embeddings')}
                  className="w-full flex-1 min-h-0"
                >
                  <TabsList className="shrink-0">
                    {canListModels && (
                      <TabsTrigger value="models" className="hover:cursor-pointer">
                        <HuemulTabCount label={t('tabs.models')} count={allLlms.length} active={modelsTabActive} />
                      </TabsTrigger>
                    )}
                    {canListProviders && (
                      <TabsTrigger value="embeddings" className="hover:cursor-pointer">
                        <span className="inline-flex items-center gap-1.5">
                          {t('tabs.embeddings')}
                          <span
                            title={embeddingConfigured ? t('tabs.embeddingsConfigured') : t('tabs.embeddingsNotConfigured')}
                            className={cn('size-2 rounded-full', embeddingConfigured ? 'bg-[#22c55e]' : 'bg-[#f5b70a]')}
                          />
                        </span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {canListModels && (
                    <TabsContent value="models" className="mt-4 flex min-h-0 flex-col gap-5">
                      {hasError ? (
                        <ModelsContentEmptyState
                          type="error"
                          message={t('errors.failedToLoadProviders')}
                          onRetry={handleRefresh}
                        />
                      ) : (
                        <>
                          {canListProviders && (
                            <ModelsProvidersStrip
                              providers={allProvidersList}
                              modelCounts={modelCounts}
                              canCreate={canCreateProvider}
                              canEdit={canUpdateProvider}
                              onEdit={openEditProvider}
                              onCreate={openCreateProvider}
                            />
                          )}
                          <ModelsTable
                            models={llms}
                            isLoading={loadingLLMs}
                            isFetching={fetchingLLMs}
                            error={errorLLMs as Error | null}
                            hasProviders={allProvidersList.length > 0}
                            search={search}
                            onSearchChange={handleSearchChange}
                            testStates={modelTests}
                            isDeleting={deleteLLMMutation.isPending}
                            onTest={runModelTest}
                            onEdit={(model) => setModelSheet({ open: true, model })}
                            onSetDefault={(model) => setDefaultMutation.mutate(model)}
                            onDelete={async (model) => {
                              if (!canDeleteModel) return
                              await deleteLLMMutation.mutateAsync(model.id)
                            }}
                            onReviewProvider={openProviderOfModel}
                            onAddModel={openAddModel}
                            onConnectProvider={openCreateProvider}
                            onRetry={handleRefresh}
                            canCreateModel={canCreateModel}
                            canUpdateModel={canUpdateModel}
                            canDeleteModel={canDeleteModel}
                            canTestModel={canTestModel}
                            canCreateProvider={canCreateProvider}
                            canUpdateProvider={canUpdateProvider}
                            pagination={{
                              page: llmsResponse?.page ?? page,
                              pageSize: llmsResponse?.page_size ?? pageSize,
                              hasNext: llmsResponse?.has_next,
                              onPageChange: setPage,
                              onPageSizeChange: (size) => {
                                setPageSize(size)
                                setPage(1)
                              },
                            }}
                          />
                        </>
                      )}
                    </TabsContent>
                  )}

                  {!canListModels && !canListProviders && <HuemulAccessDenied />}

                  {canListProviders && (
                    <TabsContent value="embeddings" className="mt-4 min-h-0">
                      {hasEmbeddingError ? (
                        <ModelsContentEmptyState
                          type="error"
                          message={t('errors.failedToLoadEmbeddings')}
                          onRetry={handleRefresh}
                        />
                      ) : (
                        <EmbeddingsTab
                          configured={configuredEmbedding}
                          options={embeddingOptions}
                          testState={embeddingTest}
                          canCreate={canCreateProvider}
                          canUpdate={canUpdateProvider}
                          canDelete={canDeleteProvider}
                          onTest={runEmbeddingTest}
                          onEditCredentials={() => configuredEmbedding && openEmbeddingSheet(configuredEmbedding.name)}
                          onChooseProvider={openEmbeddingSheet}
                          onDisconnect={handleDisconnectEmbedding}
                        />
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            ),
            className: 'p-6 md:p-8 pt-0 md:pt-0',
          },
        ]}
      />

      <ModelSheet
        open={modelSheet.open}
        onOpenChange={(open) => !open && setModelSheet((s) => ({ ...s, open: false }))}
        model={modelSheet.model}
        providers={allProvidersList}
        isFirstModel={isFirstModel}
        isSaving={createLLMMutation.isPending || updateLLMMutation.isPending}
        onSubmit={handleSubmitModel}
        onConnectProvider={connectProviderFromModelSheet}
        canSave={modelSheet.model ? canUpdateModel : canCreateModel}
      />

      <ProviderSheet
        open={providerSheet.open}
        onOpenChange={(open) => !open && setProviderSheet((s) => ({ ...s, open: false }))}
        provider={providerSheet.provider}
        supportedProviders={supportedProviders}
        modelCount={providerSheet.provider ? (modelCounts[providerSheet.provider.id] ?? 0) : 0}
        isSaving={createProviderMutation.isPending || updateProviderMutation.isPending}
        onSubmit={handleSubmitProvider}
        onDelete={handleDeleteProvider}
        canSave={providerSheet.provider ? canUpdateProvider : canCreateProvider}
        canDelete={canDeleteProvider}
      />

      <EmbeddingProviderSheet
        open={embeddingSheet.open}
        onOpenChange={(open) => !open && setEmbeddingSheet((s) => ({ ...s, open: false }))}
        configured={configuredEmbedding}
        options={embeddingOptions}
        initialName={embeddingSheet.initialName}
        isSaving={createEmbeddingMutation.isPending || updateEmbeddingMutation.isPending}
        testState={embeddingTest}
        onTest={runEmbeddingTest}
        onSubmit={handleSubmitEmbedding}
        canTest={canUpdateProvider}
        canSave={configuredEmbedding ? canUpdateProvider || canCreateProvider : canCreateProvider}
      />
    </>
  )
}
