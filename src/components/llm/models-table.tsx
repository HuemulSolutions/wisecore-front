import { useEffect, useState } from "react"
import { Check, Loader2, Pencil, Plus, Radio, Search, Star, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { formatUsdPrecise } from "@/lib/format-tokens"
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import { ModelsContentEmptyState } from "@/components/llm/models-content-empty-state"
import type { LLM, ModelsTableProps, ModelTestState } from "@/types/models"
export type { ModelsTableProps } from "@/types/models"

const GRID_COLUMNS = "minmax(0,1.3fr) 170px minmax(0,1.2fr) 150px 300px"
const SEARCH_DEBOUNCE_MS = 400

function TestButton({ state, onClick }: { state: ModelTestState | undefined; onClick: () => void }) {
  const { t } = useTranslation('models')
  const isTesting = state === 'testing'

  return (
    <button
      type="button"
      disabled={isTesting}
      onClick={onClick}
      title={t('table.testTitle')}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-xs font-medium transition-colors hover:cursor-pointer disabled:cursor-wait",
        state === 'ok' && "border-[#cdefd7] bg-[#eefbf1] text-[#15803d]",
        state === 'error' && "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
        (state === undefined || isTesting) && "border-[#dfe4ec] bg-white text-[#475569] hover:border-[#93b4f5]",
      )}
    >
      {isTesting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === 'ok' ? (
        <Check className="size-3.5" />
      ) : state === 'error' ? (
        <X className="size-3.5" />
      ) : (
        <Radio className="size-3.5" />
      )}
      {isTesting
        ? t('table.testing')
        : state === 'ok'
          ? t('table.testOk')
          : state === 'error'
            ? t('table.testRetry')
            : t('table.test')}
    </button>
  )
}

export function ModelsTable({
  models,
  isLoading,
  isFetching,
  error,
  hasProviders,
  search,
  onSearchChange,
  testStates,
  isDeleting,
  onTest,
  onEdit,
  onSetDefault,
  onDelete,
  onReviewProvider,
  onAddModel,
  onConnectProvider,
  onRetry,
  canCreateModel,
  canUpdateModel,
  canDeleteModel,
  canTestModel,
  canCreateProvider,
  canUpdateProvider,
  pagination,
}: ModelsTableProps) {
  const { t } = useTranslation('models')
  const [inputValue, setInputValue] = useState(search)
  const debouncedSearch = useDebounce(inputValue, SEARCH_DEBOUNCE_MS)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  // Vaciar la búsqueda desde fuera (CTA "Limpiar búsqueda") también limpia el input.
  useEffect(() => {
    setInputValue(search)
  }, [search])

  useEffect(() => {
    if (debouncedSearch !== search) onSearchChange(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const isSearching = search.trim() !== ''
  const addDisabled = !hasProviders && !canCreateProvider

  const handleAdd = () => (hasProviders ? onAddModel() : onConnectProvider())

  const handleConfirmDelete = async (model: LLM) => {
    try {
      await onDelete(model)
      setConfirmingDeleteId(null)
    } catch {
      // el error ya lo muestra el manejador global de mutaciones; la confirmación queda abierta
    }
  }

  const renderEmpty = () => {
    const key = isSearching ? 'noResults' : !hasProviders ? 'noProviders' : 'noModels'
    const cta = isSearching
      ? { show: true, onClick: () => onSearchChange('') }
      : !hasProviders
        ? { show: canCreateProvider, onClick: onConnectProvider }
        : { show: canCreateModel, onClick: onAddModel }

    return (
      <div className="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
        <h3 className="text-[14px] font-semibold text-[#0f172a]">{t(`empty.${key}.title`)}</h3>
        <p className="max-w-md text-[12.5px] text-[#64748b]">{t(`empty.${key}.text`)}</p>
        {cta.show && (
          <HuemulButton
            size="sm"
            variant={isSearching ? 'outline' : 'default'}
            label={t(`empty.${key}.cta`)}
            onClick={cta.onClick}
            className="mt-2 h-8 text-xs"
          />
        )}
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-[12px] border border-[#e1e6ed] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5eaf0] px-[18px] py-3.5">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[#0f172a]">{t('table.title')}</h2>
          <p className="text-[12.5px] text-[#7c8798]">{t('table.help')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa6b5]" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('table.searchPlaceholder')}
              className="h-8 w-full rounded-[9px] border border-[#dfe4ec] bg-white pl-8 pr-3 text-xs text-[#0f172a] outline-none placeholder:text-[#9aa6b5] focus:border-[#2563eb] focus:shadow-[0_0_0_3px_#dbe7fe]"
            />
          </div>
          {canCreateModel && (
            <HuemulButton
              size="sm"
              icon={Plus}
              iconClassName="size-3.5"
              label={t('table.addModel')}
              onClick={handleAdd}
              disabled={addDisabled}
              className={cn("h-8 text-xs", !hasProviders && "opacity-60")}
            />
          )}
        </div>
      </div>

      {error ? (
        <div className="p-4">
          <ModelsContentEmptyState type="error" message={t('errors.failedToLoadModels')} onRetry={onRetry} />
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[10px] bg-[#f7f9fb]" />
          ))}
        </div>
      ) : models.length === 0 ? (
        renderEmpty()
      ) : (
        <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-70")}>
          <div className="min-w-[1010px]">
            <div
              className="grid items-center gap-3 border-b border-[#e1e6ed] bg-[#f1f4f8] px-[18px] py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c8798]"
              style={{ gridTemplateColumns: GRID_COLUMNS }}
            >
              <span>{t('table.columns.model')}</span>
              <span>{t('table.columns.provider')}</span>
              <span>{t('table.columns.can')}</span>
              <span>{t('table.columns.price')}</span>
              <span />
            </div>

            {models.map((model) => {
              const providerName = model.provider?.name ?? model.provider_name
              const providerType = model.provider?.type
              const testState = testStates[model.id]
              const hasPrice = model.input_price_per_1m_tokens != null || model.output_price_per_1m_tokens != null
              const isConfirming = confirmingDeleteId === model.id

              return (
                <div key={model.id} className="border-b border-[#eef2f7] last:border-b-0">
                  <div
                    className={cn("grid items-center gap-3 px-[18px] py-3", model.is_default ? "bg-[#fffdf6]" : "bg-white")}
                    style={{ gridTemplateColumns: GRID_COLUMNS }}
                  >
                    {/* Modelo */}
                    <div className="flex min-w-0 items-center gap-2.5">
                      <button
                        type="button"
                        disabled={!canUpdateModel || model.is_default}
                        onClick={() => onSetDefault(model)}
                        title={model.is_default ? t('table.default') : t('table.setDefault')}
                        className={cn(
                          "shrink-0 transition-colors",
                          canUpdateModel && !model.is_default ? "hover:cursor-pointer hover:text-[#f5b70a]" : "cursor-default",
                          model.is_default ? "text-[#f5b70a]" : "text-[#c3ccd8]",
                        )}
                      >
                        <Star className={cn("size-[18px]", model.is_default && "fill-[#f5b70a]")} />
                      </button>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{model.name}</span>
                          {model.is_default && (
                            <span className="shrink-0 rounded-full border border-[#f5deb0] bg-[#fff6dc] px-2 py-px text-[10px] font-semibold text-[#8a5a00]">
                              {t('table.default')}
                            </span>
                          )}
                        </span>
                        <span className="truncate font-mono text-xs text-[#7c8798]">{model.internal_name}</span>
                      </div>
                    </div>

                    {/* Proveedor */}
                    <div className="flex min-w-0 items-center gap-2">
                      {providerName ? (
                        <>
                          {providerType && <ModelsProviderAvatar type={providerType} size="sm" />}
                          <span className="truncate text-[13px] text-[#334155]">{providerName}</span>
                        </>
                      ) : (
                        <span className="text-[#9aa6b5]">—</span>
                      )}
                    </div>

                    {/* Puede */}
                    <div className="flex flex-wrap gap-1.5">
                      {(model.capabilities ?? []).map((cap) => (
                        <span
                          key={cap}
                          title={t(`capabilities.${cap}.description`, { defaultValue: '' })}
                          className="rounded-full border border-[#e3e9f1] bg-[#f7f9fb] px-2 py-0.5 text-[11.5px] font-medium text-[#475569]"
                        >
                          {t(`capabilities.${cap}.label`, { defaultValue: cap })}
                        </span>
                      ))}
                    </div>

                    {/* Precio */}
                    <div className="flex flex-col">
                      {hasPrice ? (
                        <>
                          <span className="font-mono text-[12.5px] text-[#0f172a]">
                            {formatUsdPrecise(model.input_price_per_1m_tokens)} · {formatUsdPrecise(model.output_price_per_1m_tokens)}
                          </span>
                          <span className="text-[11px] text-[#7c8798]">{t('table.priceLegend')}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[12.5px] text-[#7c8798]">{t('table.noPrice')}</span>
                          <span className="text-[11px] text-[#9aa6b5]">{t('table.noPriceHint')}</span>
                        </>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-1.5">
                      {isConfirming ? (
                        <>
                          <span className="mr-1 text-xs font-medium text-[#0f172a]">{t('table.confirmDelete')}</span>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmingDeleteId(null)}
                            className="h-8 rounded-[8px] border border-[#dfe4ec] bg-white px-2.5 text-xs font-medium text-[#475569] hover:cursor-pointer hover:border-[#93b4f5] disabled:opacity-50"
                          >
                            {t('table.confirmCancel')}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleConfirmDelete(model)}
                            className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#d92d20] px-2.5 text-xs font-semibold text-white hover:cursor-pointer hover:bg-[#b42318] disabled:opacity-60"
                          >
                            {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                            {t('table.confirmAccept')}
                          </button>
                        </>
                      ) : (
                        <>
                          {canTestModel && <TestButton state={testState} onClick={() => onTest(model)} />}
                          {canUpdateModel && (
                            <button
                              type="button"
                              onClick={() => onEdit(model)}
                              title={t('table.edit')}
                              aria-label={t('table.edit')}
                              className="flex size-8 items-center justify-center rounded-[8px] border border-[#dfe4ec] bg-white text-[#475569] hover:cursor-pointer hover:border-[#93b4f5]"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}
                          {canDeleteModel && (
                            <span title={model.is_default ? t('table.deleteBlocked') : t('table.delete')} className="inline-flex">
                              <button
                                type="button"
                                disabled={model.is_default}
                                onClick={() => setConfirmingDeleteId(model.id)}
                                aria-label={t('table.delete')}
                                className="flex size-8 items-center justify-center rounded-[8px] border border-[#dfe4ec] bg-white text-[#475569] hover:cursor-pointer hover:border-[#f3a19a] hover:text-[#d92d20] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#dfe4ec] disabled:hover:text-[#475569]"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {testState === 'error' && (
                    <div className="px-[18px] pb-3">
                      <HuemulNotice
                        tone="red"
                        action={
                          canUpdateProvider && (
                            <button
                              type="button"
                              onClick={() => onReviewProvider(model)}
                              className="rounded-[8px] border border-[#f3a19a] bg-white px-2.5 py-1 text-xs font-semibold text-[#b42318] hover:cursor-pointer hover:bg-[#fef3f2]"
                            >
                              {t('table.reviewProvider')}
                            </button>
                          )
                        }
                      >
                        {t('table.testFailed', { provider: providerName ?? '' })}
                      </HuemulNotice>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!error && !isLoading && (models.length > 0 || pagination.page > 1) && (
        <HuemulPagination
          variant="detailed"
          page={pagination.page}
          pageSize={pagination.pageSize}
          hasNext={pagination.hasNext}
          hasPrevious={pagination.page > 1}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        />
      )}
    </section>
  )
}
