import type { ReactNode } from "react"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { ModelsStatusCardsProps } from "@/types/models"
export type { ModelsStatusCardsProps } from "@/types/models"

type Pill = "working" | "failing" | "pending"

const PILL_CLASSES: Record<Pill, string> = {
  working: "border-[#cdefd7] bg-[#eefbf1] text-[#15803d]",
  failing: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
  pending: "border-[#fbe3a6] bg-[#fff6dc] text-[#8a5a00]",
}

interface StatusCardProps {
  number: number
  configured: boolean
  failing?: boolean
  title: string
  description: string
  pill: { tone: Pill; label: string }
  children?: ReactNode
  actions?: ReactNode
}

/** Tarjeta de estado: configurada (blanca, ✓) o pendiente (ámbar, número del paso). */
function StatusCard({ number, configured, failing = false, title, description, pill, children, actions }: StatusCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border p-[18px]",
        configured ? "border-[#e3e9f1] bg-white" : "border-[#fbe3a6] bg-[#fffcf3]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
            !configured && "bg-[#fbe3a6] text-[#8a5a00]",
            configured && !failing && "bg-[#dcfce7] text-[#15803d]",
            configured && failing && "bg-[#fee4e2] text-[#b42318]",
          )}
        >
          {configured ? (failing ? <X className="size-3.5" /> : <Check className="size-3.5" />) : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-[#0f172a]">{title}</h3>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", PILL_CLASSES[pill.tone])}>
              {pill.label}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#64748b]">{description}</p>
        </div>
      </div>
      {children}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ModelsStatusCards({
  isLoading,
  defaultModel,
  defaultProviderName,
  defaultConfigured,
  defaultWorking,
  defaultTestState,
  hasProviders,
  embeddingConfigured,
  embeddingWorking,
  embeddingProviderName,
  canTest,
  canCreateProvider,
  canCreateModel,
  canConfigureEmbeddings,
  onTestDefault,
  onConnectProvider,
  onAddModel,
  onViewEmbeddings,
  onConfigureEmbeddings,
}: ModelsStatusCardsProps) {
  const { t } = useTranslation('models')

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-[14px] border border-[#e3e9f1] bg-[#f7f9fb]" />
        ))}
      </div>
    )
  }

  const defaultFailing = !defaultWorking || defaultTestState === 'error'

  const defaultCta = !hasProviders ? (
    canCreateProvider ? (
      <HuemulButton size="sm" label={t('status.default.connectProvider')} onClick={onConnectProvider} className="h-8 text-xs" />
    ) : null
  ) : canCreateModel ? (
    <HuemulButton size="sm" label={t('status.default.addModel')} onClick={onAddModel} className="h-8 text-xs" />
  ) : null

  return (
    <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
      <StatusCard
        number={1}
        configured={defaultConfigured}
        failing={defaultFailing}
        title={t('status.default.title')}
        description={t('status.default.description')}
        pill={
          defaultConfigured
            ? defaultFailing
              ? { tone: 'failing', label: t('status.failing') }
              : { tone: 'working', label: t('status.working') }
            : { tone: 'pending', label: t('status.notConfigured') }
        }
        actions={
          defaultConfigured ? (
            canTest && defaultModel && (
              <HuemulButton
                size="sm"
                variant="outline"
                label={defaultTestState === 'testing' ? t('status.default.testing') : t('status.default.testConnection')}
                loading={defaultTestState === 'testing'}
                onClick={onTestDefault}
                className="h-8 text-xs"
              />
            )
          ) : (
            defaultCta
          )
        }
      >
        {defaultConfigured && defaultModel && (
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-[#0f172a]">{defaultModel.name}</p>
            {defaultProviderName && <p className="truncate text-xs text-[#7c8798]">{defaultProviderName}</p>}
          </div>
        )}
      </StatusCard>

      <StatusCard
        number={2}
        configured={embeddingConfigured}
        failing={!embeddingWorking}
        title={t('status.search.title')}
        description={t('status.search.description')}
        pill={
          embeddingConfigured
            ? embeddingWorking
              ? { tone: 'working', label: t('status.working') }
              : { tone: 'failing', label: t('status.failing') }
            : { tone: 'pending', label: t('status.notConfigured') }
        }
        actions={
          canConfigureEmbeddings &&
          (embeddingConfigured ? (
            <HuemulButton
              size="sm"
              variant="outline"
              label={t('status.search.viewDetail')}
              onClick={onViewEmbeddings}
              className="h-8 text-xs"
            />
          ) : (
            <HuemulButton size="sm" label={t('status.search.configure')} onClick={onConfigureEmbeddings} className="h-8 text-xs" />
          ))
        }
      >
        {embeddingConfigured && embeddingProviderName && (
          <p className="truncate text-[13.5px] font-semibold text-[#0f172a]">{embeddingProviderName}</p>
        )}
      </StatusCard>
    </div>
  )
}
