import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { ModelsStatusCardsProps } from "@/types/models"
export type { ModelsStatusCardsProps } from "@/types/models"

type StatusTone = "working" | "failing" | "pending"

// Paleta cerrada por estado: `dot` = color del punto y del texto del pill; `pill` = fondo del pill
// (y halo del punto). "Con errores" conserva el borde/fondo de "Funcionando".
const TONES: Record<StatusTone, { border: string; background: string; dot: string; pill: string }> = {
  working: { border: "#d7eedf", background: "#f5fbf7", dot: "#15803d", pill: "#eaf8ee" },
  failing: { border: "#d7eedf", background: "#f5fbf7", dot: "#b42318", pill: "#fdecea" },
  pending: { border: "#fbe3a6", background: "#fffcf3", dot: "#b45309", pill: "#fef3e2" },
}

interface StatusRowProps {
  tone: StatusTone
  label: string
  value: string
  pillLabel: string
  /** Descripción larga: solo en tooltip, no se muestra en pantalla. */
  description: string
  cta?: { label: string; primary: boolean; disabled?: boolean; onClick: () => void }
}

function StatusRow({ tone, label, value, pillLabel, description, cta }: StatusRowProps) {
  const colors = TONES[tone]

  return (
    <div
      title={description}
      className="flex h-11 min-w-0 items-center gap-2.5 rounded-[10px] border pl-3 pr-2"
      style={{ borderColor: colors.border, backgroundColor: colors.background }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: colors.dot, boxShadow: `0 0 0 3px ${colors.pill}` }}
      />
      <span className="whitespace-nowrap text-[12.5px] text-[#64748b]">{label}</span>
      <span className="min-w-0 truncate text-[13px] font-semibold text-[#0f172a]">{value}</span>
      <span
        className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: colors.dot, backgroundColor: colors.pill }}
      >
        {pillLabel}
      </span>
      <span className="flex-1" />
      {cta && (
        <button
          type="button"
          disabled={cta.disabled}
          onClick={cta.onClick}
          className={cn(
            "h-7 whitespace-nowrap rounded-[7px] border px-2.5 text-[12.5px] font-semibold transition-colors hover:cursor-pointer disabled:cursor-wait disabled:opacity-70",
            cta.primary
              ? "border-[#2563eb] bg-[#2563eb] text-white hover:border-[#1d4ed8] hover:bg-[#1d4ed8]"
              : "border-[#dfe4ec] bg-white text-[#334155] hover:border-[#93b4f5] hover:bg-[#f9fbff]",
          )}
        >
          {cta.label}
        </button>
      )}
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
  canViewEmbeddings,
  onTestDefault,
  onConnectProvider,
  onAddModel,
  onGoToEmbeddings,
}: ModelsStatusCardsProps) {
  const { t } = useTranslation('models')

  const grid = (children: ReactNode) => (
    <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">{children}</div>
  )

  if (isLoading) {
    return grid(
      [0, 1].map((i) => <div key={i} className="h-11 animate-pulse rounded-[10px] bg-[#f1f4f8]" />),
    )
  }

  const isTesting = defaultTestState === 'testing'
  const defaultFailing = !defaultWorking || defaultTestState === 'error'
  const defaultTone: StatusTone = !defaultConfigured ? 'pending' : defaultFailing ? 'failing' : 'working'
  const embeddingTone: StatusTone = !embeddingConfigured ? 'pending' : embeddingWorking ? 'working' : 'failing'

  const pillLabel = (tone: StatusTone) =>
    tone === 'working' ? t('status.working') : tone === 'failing' ? t('status.failing') : t('status.notConfigured')

  const defaultValue =
    defaultConfigured && defaultModel
      ? [defaultModel.name, defaultProviderName].filter(Boolean).join(' · ')
      : t('status.default.none')

  const defaultCta: StatusRowProps['cta'] = defaultConfigured
    ? canTest && defaultModel
      ? {
          label: isTesting ? t('status.default.testing') : t('status.default.test'),
          primary: false,
          disabled: isTesting,
          onClick: onTestDefault,
        }
      : undefined
    : !hasProviders
      ? canCreateProvider
        ? { label: t('status.default.connectProvider'), primary: true, onClick: onConnectProvider }
        : undefined
      : canCreateModel
        ? { label: t('status.default.addModel'), primary: true, onClick: onAddModel }
        : undefined

  return grid(
    <>
      <StatusRow
        tone={defaultTone}
        label={t('status.default.label')}
        value={defaultValue}
        pillLabel={pillLabel(defaultTone)}
        description={t('status.default.description')}
        cta={defaultCta}
      />
      <StatusRow
        tone={embeddingTone}
        label={t('status.search.label')}
        value={embeddingConfigured ? (embeddingProviderName ?? '—') : t('status.search.off')}
        pillLabel={pillLabel(embeddingTone)}
        description={t('status.search.description')}
        cta={
          canViewEmbeddings
            ? {
                label: embeddingConfigured ? t('status.search.view') : t('status.search.configure'),
                primary: !embeddingConfigured,
                onClick: onGoToEmbeddings,
              }
            : undefined
        }
      />
    </>,
  )
}
