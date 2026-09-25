import { useLayoutEffect, useRef, useState } from "react"
import { ChevronRight, Plug, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import type { LLMProvider } from "@/types/llm-provider"
import type { ModelsProvidersStripProps } from "@/types/models"
export type { ModelsProvidersStripProps } from "@/types/models"

// Deben coincidir con `w-[236px]` de las tarjetas y `gap-3` del contenedor.
const CARD_WIDTH = 236
const CARD_GAP = 12

export function ModelsProvidersStrip({
  providers,
  modelCounts,
  canCreate,
  canEdit,
  onEdit,
  onCreate,
}: ModelsProvidersStripProps) {
  const { t } = useTranslation('models')
  const listRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [listOpen, setListOpen] = useState(false)

  // Cuántas tarjetas entran en una fila según el ancho disponible.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    setWidth(el.clientWidth)
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const perRow = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
  // La tira es siempre de 1 fila, con "Conectar proveedor" ocupando su último lugar.
  const capacity = Math.max(perRow - (canCreate ? 1 : 0), 1)
  const hasOverflow = providers.length > capacity
  const visibleProviders = hasOverflow ? providers.slice(0, capacity) : providers

  const providerDetails = (provider: LLMProvider) => {
    const count = modelCounts[provider.id] ?? 0
    return [
      provider.display_name,
      provider.is_managed ? t('providers.managed') : null,
      t(count === 1 ? 'providers.modelOne' : 'providers.modelMany', { count }),
    ]
      .filter(Boolean)
      .join(' · ')
  }

  // El sheet de edición es el de la página: se cierra el listado antes para no apilar sheets.
  const handleEditFromList = (provider: LLMProvider) => {
    setListOpen(false)
    onEdit(provider)
  }

  return (
    <section className="flex shrink-0 flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[#0f172a]">{t('providers.title')}</h2>
          <p className="text-[12.5px] text-[#7c8798]">{t('providers.help')}</p>
        </div>
        {hasOverflow && (
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="flex h-8 shrink-0 items-center rounded-[8px] border border-[#dfe4ec] bg-white px-2.5 text-xs font-medium text-[#475569] transition-colors hover:cursor-pointer hover:border-[#93b4f5]"
          >
            {t('providers.showAll', { count: providers.length })}
          </button>
        )}
      </div>

      {/* Invisible hasta medir el ancho: evita el parpadeo de mostrar todas las filas un instante. */}
      <div ref={listRef} className={cn("flex flex-wrap gap-3", width === 0 && "invisible")}>
        {visibleProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={!canEdit}
            onClick={() => onEdit(provider)}
            className={cn(
              "flex w-[236px] items-center gap-2.5 rounded-[11px] border border-[#e1e6ed] bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors",
              canEdit ? "hover:cursor-pointer hover:border-[#93b4f5] hover:bg-[#f9fbff]" : "cursor-default",
            )}
          >
            <ModelsProviderAvatar type={provider.type} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{provider.name}</span>
              <span className="truncate text-xs text-[#7c8798]">{providerDetails(provider)}</span>
            </span>
          </button>
        ))}

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              "flex w-[236px] items-center gap-2.5 rounded-[11px] border border-dashed bg-white p-3 text-left transition-colors hover:cursor-pointer",
              providers.length === 0
                ? "border-[#2563eb] bg-[#f5f9ff]"
                : "border-[#c3ccd8] hover:border-[#93b4f5]",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
              <Plus className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{t('providers.addTitle')}</span>
              <span className="truncate text-xs text-[#7c8798]">{t('providers.addSubtitle')}</span>
            </span>
          </button>
        )}
      </div>

      <HuemulSheet
        open={listOpen}
        onOpenChange={setListOpen}
        title={t('providers.title')}
        description={t('providers.help')}
        icon={Plug}
        iconVariant="tile"
        maxWidth="w-full sm:w-[480px] sm:max-w-[480px]"
        cancelLabel={t('providers.close')}
        saveAction={
          canCreate
            ? { label: t('providers.addTitle'), icon: Plus, onClick: onCreate }
            : undefined
        }
      >
        <div className="flex flex-col gap-2 py-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              disabled={!canEdit}
              onClick={() => handleEditFromList(provider)}
              className={cn(
                "flex items-center gap-3 rounded-[10px] border border-[#e3e9f1] bg-white px-3 py-2.5 text-left transition-colors",
                canEdit ? "hover:cursor-pointer hover:border-[#93b4f5]" : "cursor-default",
              )}
            >
              <ModelsProviderAvatar type={provider.type} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{provider.name}</span>
                <span className="truncate text-xs text-[#7c8798]">{providerDetails(provider)}</span>
              </span>
              {canEdit && <ChevronRight className="size-4 shrink-0 text-[#b6c0cd]" />}
            </button>
          ))}
        </div>
      </HuemulSheet>
    </section>
  )
}
