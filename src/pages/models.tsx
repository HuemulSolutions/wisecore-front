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
import { HUEMUL_UNDERLINE_TAB_TRIGGER_CLASS } from '@/huemul/components/huemul-detail-surface'
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
  setLLMForPurpose,
  clearLLMForPurpose,
  testLLMConnection,
} from '@/services/llms'
import { testImageGenerationConnection } from '@/services/image-generation'
import {
  getSupportedEmbeddingProviders,
  getEmbeddingProvider,
  createEmbeddingProvider,
  deleteEmbeddingProvider,
  listEmbeddingProviders,
  createAdditionalEmbeddingProvider,
  updateEmbeddingProviderById,
  setDefaultEmbeddingProvider,
  buildEmbeddingProviderIndex,
  deleteEmbeddingProviderById,
  testEmbeddingProviderById,
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
import type { LLM, CreateLLMRequest, LlmPurpose, ModelDialogSubmitData, ModelTestState } from '@/types/models'
import { mediaQueryKeys } from '@/hooks/useMedia'
import type { CreateLLMProviderRequest, LLMProvider } from '@/types/llm-provider'
import type {
  EmbeddingProviderName,
  EmbeddingProviderSlot,
  EmbeddingSheetMode,
  EmbeddingSheetSubmit,
  EmbeddingTestState,
} from '@/types/embedding-provider'

type ModelSheetState = { open: boolean; model: LLM | null }
type ProviderSheetState = { open: boolean; provider: LLMProvider | null }
type EmbeddingSheetState = {
  open: boolean
  initialName: EmbeddingProviderName
  mode: EmbeddingSheetMode
  editing: EmbeddingProviderSlot | null
}

/** Tope de proveedores de embeddings si el backend todavía no lo informa (organización sin ninguno). */
const DEFAULT_MAX_EMBEDDING_PROVIDERS = 3
/** Mientras un proveedor calcula sus vectores, la pestaña se refresca para mostrar el avance. */
const EMBEDDING_PROGRESS_REFRESH_MS = 15_000

export default function Models() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('models')
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('models')

  const [modelSheet, setModelSheet] = useState<ModelSheetState>({ open: false, model: null })
  const [providerSheet, setProviderSheet] = useState<ProviderSheetState>({ open: false, provider: null })
  const [embeddingSheet, setEmbeddingSheet] = useState<EmbeddingSheetState>({
    open: false,
    initialName: 'openai',
    mode: 'create',
    editing: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [modelTests, setModelTests] = useState<Record<string, ModelTestState>>({})
  const [embeddingTests, setEmbeddingTests] = useState<Record<string, EmbeddingTestState>>({})

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

  // Los espacios de la pestaña Embeddings: todos los proveedores, con la cobertura de sus vectores.
  const { data: embeddingProvidersData, error: errorEmbeddingProviders } = useQuery({
    queryKey: ['embeddingProviders', selectedOrganizationId],
    queryFn: listEmbeddingProviders,
    retry: 0,
    enabled: isOrgReady && canListProviders,
    refetchInterval: (query) => {
      const providers = (query.state.data ?? []) as EmbeddingProviderSlot[]
      const inProgress = providers.some(
        (p) => p.index_status === 'building' || (p.coverage_ratio != null && p.coverage_ratio < 1),
      )
      return inProgress && activeTab === 'embeddings' ? EMBEDDING_PROGRESS_REFRESH_MS : false
    },
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
  const embeddingProviders: EmbeddingProviderSlot[] = useMemo(() => embeddingProvidersData ?? [], [embeddingProvidersData])
  const maxEmbeddingProviders = embeddingProviders[0]?.max_providers ?? DEFAULT_MAX_EMBEDDING_PROVIDERS
  const defaultEmbedding = embeddingProviders.find((p) => p.is_default) ?? null
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
  const rerankModel = allLlms.find((llm) => llm.is_rerank_default) ?? null
  const imageAnalysisModel = allLlms.find((llm) => llm.is_image_analysis_default) ?? null
  const isFirstModel = allLlms.length === 0

  // ── Estado de configuración (tarjetas) ───────────────────────────────────
  const defaultConfigured = configStatus ? configStatus.default_llm.is_configured : !!defaultModel
  const defaultWorking = configStatus ? configStatus.default_llm.is_working !== false : true
  const embeddingConfigured = configStatus ? configStatus.embedding.is_configured : !!configuredEmbedding
  const embeddingWorking =
    (configStatus ? configStatus.embedding.is_working !== false : true) &&
    (!defaultEmbedding || embeddingTests[defaultEmbedding.id] !== 'error')
  const evaluationEmbeddings = embeddingProviders.length - (defaultEmbedding ? 1 : 0)
  const defaultEmbeddingName =
    defaultEmbedding?.label || defaultEmbedding?.display_name || embeddingOptions.find((o) => o.isActive)?.display
  const embeddingActiveName =
    defaultEmbeddingName && evaluationEmbeddings > 0
      ? t('status.search.withEvaluation', { name: defaultEmbeddingName, count: evaluationEmbeddings })
      : defaultEmbeddingName

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
      queryClient.invalidateQueries({ queryKey: ['embeddingProviders'] }),
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

  const purposeName = (purpose: LlmPurpose) => t(`table.purposes.${purpose}`)

  const setPurposeMutation = useMutation({
    mutationFn: ({ model, purpose }: { model: LLM; purpose: LlmPurpose }) => setLLMForPurpose(model.id, purpose),
    onSuccess: (result, { model, purpose }) => {
      invalidateModels()
      invalidateStatus()
      showModelsToast(t('toast.purposeSet', { name: model.name, purpose: purposeName(purpose) }))
      // Marcar el LLM de imágenes encola el análisis de las que quedaron `not_analyzed`.
      if (result?.media_scan_enqueued) {
        showModelsToast(t('toast.mediaScanEnqueued'))
        queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all })
      }
    },
  })

  const clearPurposeMutation = useMutation({
    mutationFn: (purpose: LlmPurpose) => clearLLMForPurpose(purpose),
    onSuccess: (_, purpose) => {
      invalidateModels()
      invalidateStatus()
      showModelsToast(t('toast.purposeCleared', { purpose: purposeName(purpose) }))
    },
  })

  const closeEmbeddingSheet = () => setEmbeddingSheet((s) => ({ ...s, open: false }))
  const afterEmbeddingChange = () => {
    invalidateEmbeddings()
    invalidateStatus()
  }

  // Primer proveedor de la organización (queda como predeterminado).
  const createEmbeddingMutation = useMutation({
    mutationFn: createEmbeddingProvider,
    onSuccess: () => {
      afterEmbeddingChange()
      closeEmbeddingSheet()
      showModelsToast(t('toast.embeddingConfigured'))
    },
  })

  // Proveedor de evaluación en un espacio libre.
  const addEmbeddingMutation = useMutation({
    mutationFn: createAdditionalEmbeddingProvider,
    onSuccess: () => {
      afterEmbeddingChange()
      closeEmbeddingSheet()
      showModelsToast(t('toast.embeddingProviderAdded'))
    },
  })

  const updateEmbeddingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateEmbeddingProviderById>[1] }) =>
      updateEmbeddingProviderById(id, payload),
    onSuccess: (updated) => {
      afterEmbeddingChange()
      closeEmbeddingSheet()
      showModelsToast(updated?.model_changed ? t('toast.embeddingUpdatedReindex') : t('toast.embeddingUpdated'))
    },
  })

  const setDefaultEmbeddingMutation = useMutation({
    mutationFn: ({ provider, force }: { provider: EmbeddingProviderSlot; force: boolean }) =>
      setDefaultEmbeddingProvider(provider.id, force),
    onSuccess: (_, { provider }) => {
      afterEmbeddingChange()
      showModelsToast(t('toast.embeddingDefaultChanged', { name: provider.label || provider.display_name }))
    },
  })

  const buildEmbeddingIndexMutation = useMutation({
    mutationFn: (provider: EmbeddingProviderSlot) => buildEmbeddingProviderIndex(provider.id),
    onSuccess: () => {
      afterEmbeddingChange()
      showModelsToast(t('toast.embeddingIndexQueued'))
    },
  })

  // El predeterminado solo se borra cuando es el único (desconectar, ruta singular); el resto, por id.
  const deleteEmbeddingMutation = useMutation({
    mutationFn: (provider: EmbeddingProviderSlot) =>
      provider.is_default ? deleteEmbeddingProvider() : deleteEmbeddingProviderById(provider.id),
    onSuccess: (_, provider) => {
      afterEmbeddingChange()
      setEmbeddingTests((prev) => {
        const next = { ...prev }
        delete next[provider.id]
        return next
      })
      showModelsToast(provider.is_default ? t('toast.embeddingDeleted') : t('toast.embeddingProviderDeleted'))
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

  const runEmbeddingTest = async (provider: EmbeddingProviderSlot) => {
    if (!canUpdateProvider) return
    setEmbeddingTests((prev) => ({ ...prev, [provider.id]: 'testing' }))
    try {
      await testEmbeddingProviderById(provider.id)
      setEmbeddingTests((prev) => ({ ...prev, [provider.id]: 'ok' }))
    } catch {
      setEmbeddingTests((prev) => ({ ...prev, [provider.id]: 'error' }))
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

  const openFirstEmbeddingSheet = (initialName: EmbeddingProviderName) =>
    setEmbeddingSheet({ open: true, initialName, mode: 'create', editing: null })
  const openAddEmbeddingSheet = () =>
    setEmbeddingSheet({ open: true, initialName: embeddingOptions[0]?.name ?? 'openai', mode: 'add', editing: null })
  const openEditEmbeddingSheet = (provider: EmbeddingProviderSlot) =>
    setEmbeddingSheet({ open: true, initialName: provider.name, mode: 'edit', editing: provider })

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
    if (submit.mode === 'edit') {
      if (!canUpdateProvider) return
      updateEmbeddingMutation.mutate({ id: submit.providerId, payload: submit.payload })
      return
    }
    if (!canCreateProvider) return
    if (submit.mode === 'add') {
      addEmbeddingMutation.mutate(submit.payload)
      return
    }
    createEmbeddingMutation.mutate(submit.payload)
  }

  const handleMakeDefaultEmbedding = async (provider: EmbeddingProviderSlot, force: boolean) => {
    if (!canUpdateProvider) return
    await setDefaultEmbeddingMutation.mutateAsync({ provider, force })
  }

  const handleDeleteEmbedding = async (provider: EmbeddingProviderSlot) => {
    if (!canDeleteProvider) return
    await deleteEmbeddingMutation.mutateAsync(provider)
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
  const hasEmbeddingError = !!errorEmbeddingSupportedProviders || !!errorEmbeddingProvider || !!errorEmbeddingProviders
  const modelsTabActive = activeTab === 'models'

  return (
    <>
      {/* Un solo root de Tabs: la barra (TabsList) vive en el header y los TabsContent en la columna. */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'models' | 'embeddings')}
        className="h-full gap-0"
      >
      <HuemulPageLayout
        className="bg-[#f3f5f8]"
        header={
          <div>
            <div className="bg-white px-7 pt-5">
              <ModelsHeader onRefresh={handleRefresh} isLoading={isRefreshing || fetchingLLMs} />
            </div>
            <div className="bg-white px-7 pb-3">
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
                rerankModel={rerankModel}
                imageAnalysisModel={imageAnalysisModel}
                canTest={canTestModel}
                canCreateProvider={canCreateProvider}
                canCreateModel={canCreateModel}
                canViewEmbeddings={canListProviders}
                canChoosePurposeModel={canListModels && canUpdateModel}
                models={allLlms}
                isPurposePending={setPurposeMutation.isPending || clearPurposeMutation.isPending}
                onSetPurpose={(model, purpose) => setPurposeMutation.mutate({ model, purpose })}
                onClearPurpose={(purpose) => clearPurposeMutation.mutate(purpose)}
                onTestDefault={() => {
                  if (!defaultModel) return
                  if (canListModels) setActiveTab('models')
                  runModelTest(defaultModel)
                }}
                onConnectProvider={openCreateProvider}
                onAddModel={openAddModel}
                onGoToEmbeddings={() => setActiveTab('embeddings')}
              />
            </div>

            {/* La línea que separa el header del contenido es esta barra de tabs (de borde a borde). */}
            <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#e1e6ed] bg-white px-7 py-0">
              {canListModels && (
                <TabsTrigger value="models" className={HUEMUL_UNDERLINE_TAB_TRIGGER_CLASS}>
                  <HuemulTabCount label={t('tabs.models')} count={allLlms.length} active={modelsTabActive} />
                </TabsTrigger>
              )}
              {canListProviders && (
                <TabsTrigger value="embeddings" className={HUEMUL_UNDERLINE_TAB_TRIGGER_CLASS}>
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
          </div>
        }
        headerClassName="border-b-0 p-0"
        columns={[
          {
            content: (
              <>
                  {canListModels && (
                    <TabsContent value="models" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
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
                            onSetPurpose={(model, purpose) => setPurposeMutation.mutate({ model, purpose })}
                            onClearPurpose={(purpose) => clearPurposeMutation.mutate(purpose)}
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
                    <TabsContent value="embeddings" className="min-h-0 flex-1 overflow-y-auto">
                      {hasEmbeddingError ? (
                        <ModelsContentEmptyState
                          type="error"
                          message={t('errors.failedToLoadEmbeddings')}
                          onRetry={handleRefresh}
                        />
                      ) : (
                        <EmbeddingsTab
                          providers={embeddingProviders}
                          maxProviders={maxEmbeddingProviders}
                          options={embeddingOptions}
                          testStates={embeddingTests}
                          canCreate={canCreateProvider}
                          canUpdate={canUpdateProvider}
                          canDelete={canDeleteProvider}
                          onConfigureFirst={openFirstEmbeddingSheet}
                          onAddProvider={openAddEmbeddingSheet}
                          onEditProvider={openEditEmbeddingSheet}
                          onTestProvider={runEmbeddingTest}
                          onMakeDefault={handleMakeDefaultEmbedding}
                          onBuildIndex={(provider) => buildEmbeddingIndexMutation.mutate(provider)}
                          onDeleteProvider={handleDeleteEmbedding}
                        />
                      )}
                    </TabsContent>
                  )}
              </>
            ),
            className: 'overflow-hidden p-7',
          },
        ]}
      />
      </Tabs>

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
        onOpenChange={(open) => !open && closeEmbeddingSheet()}
        mode={embeddingSheet.mode}
        editing={embeddingSheet.editing}
        options={embeddingOptions}
        initialName={embeddingSheet.initialName}
        isSaving={createEmbeddingMutation.isPending || addEmbeddingMutation.isPending || updateEmbeddingMutation.isPending}
        testState={embeddingSheet.editing ? (embeddingTests[embeddingSheet.editing.id] ?? 'idle') : 'idle'}
        onTest={() => embeddingSheet.editing && runEmbeddingTest(embeddingSheet.editing)}
        onSubmit={handleSubmitEmbedding}
        canTest={canUpdateProvider && embeddingSheet.mode === 'edit'}
        canSave={embeddingSheet.mode === 'edit' ? canUpdateProvider : canCreateProvider}
      />
    </>
  )
}
