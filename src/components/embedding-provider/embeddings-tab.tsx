import { useState } from "react"
import { Check, ChevronDown, Loader2, Plus, Radio, RefreshCw, Star, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import { coverageOf, isProviderComplete } from "@/lib/embedding-provider-options"
import type {
  EmbeddingProviderName,
  EmbeddingProviderSlot,
  EmbeddingTestState,
  EmbeddingsTabProps,
} from "@/types/embedding-provider"
export type { EmbeddingsTabProps } from "@/types/embedding-provider"

/**
 * Opción de proveedor para el primer alta ("Configurar"). Misma tarjeta que los espacios para
 * que la pestaña no cambie de disposición al configurar el primero.
 */
function EmbeddingOptionCard({
  name,
  display,
  description,
  actionLabel,
  onAction,
}: {
  name: EmbeddingProviderName
  display: string
  description: string
  actionLabel?: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#e1e6ed] bg-white p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <ModelsProviderAvatar type={name} />
        <span className="text-[14px] font-semibold text-[#0f172a]">{display}</span>
      </div>
      <p className="flex-1 text-[12.5px] leading-snug text-[#64748b]">{description}</p>
      {actionLabel && (
        <div>
          <HuemulButton size="sm" label={actionLabel} onClick={onAction} className="h-8 text-xs" />
        </div>
      )}
    </div>
  )
}

/** "¿Cómo funcionan los espacios?": para qué sirven, cómo se usan y qué implica cada acción. */
function HowItWorks({ maxProviders, defaultOpen }: { maxProviders: number; defaultOpen: boolean }) {
  const { t } = useTranslation('models')
  const [open, setOpen] = useState(defaultOpen)
  // El loader de i18n no admite arreglos: cada línea es una clave numerada.
  const list = (key: string, size: number) =>
    Array.from({ length: size }, (_, index) => t(`${key}.p${index + 1}`, { max: maxProviders, evaluation: maxProviders - 1 }))

  return (
    <section className="rounded-[12px] border border-[#dbe6fb] bg-[#f7faff]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-[18px] py-3 text-left hover:cursor-pointer"
      >
        <span className="text-[13.5px] font-semibold text-[#1e3a8a]">{t('embeddings.howItWorks.title', { max: maxProviders })}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-[#1e3a8a] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-5 border-t border-[#dbe6fb] px-[18px] py-4 text-[12.5px] leading-relaxed text-[#334155] lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#1e3a8a]">{t('embeddings.howItWorks.whatTitle')}</h3>
            {list('embeddings.howItWorks.what', 2).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#1e3a8a]">{t('embeddings.howItWorks.howTitle')}</h3>
            <ol className="flex list-decimal flex-col gap-1 pl-4">
              {list('embeddings.howItWorks.how', 4).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#1e3a8a]">{t('embeddings.howItWorks.implicationsTitle')}</h3>
            <ul className="flex list-disc flex-col gap-1 pl-4">
              {list('embeddings.howItWorks.implications', 5).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function IndexStatusChip({ status }: { status: EmbeddingProviderSlot['index_status'] }) {
  const { t } = useTranslation('models')
  const tone = {
    ready: "border-[#cdefd7] bg-[#eefbf1] text-[#15803d]",
    building: "border-[#bfd3fb] bg-[#eef4ff] text-[#1d4ed8]",
    failed: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
    none: "border-[#e3e9f1] bg-[#f6f8fb] text-[#64748b]",
  }[status] ?? "border-[#e3e9f1] bg-[#f6f8fb] text-[#64748b]"
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10.5px] font-semibold", tone)}>
      {status === 'building' && <Loader2 className="size-2.5 animate-spin" />}
      {t(`embeddings.slots.index.${status}`, { defaultValue: status })}
    </span>
  )
}

function CoverageBar({ provider }: { provider: EmbeddingProviderSlot }) {
  const { t, i18n } = useTranslation('models')
  const coverage = coverageOf(provider)
  if (coverage == null) {
    return <p className="text-[11.5px] text-[#7c8798]">{t('embeddings.slots.coverageEmpty')}</p>
  }
  const percent = Math.floor(coverage * 100)
  const format = (value: number) => value.toLocaleString(i18n.language)
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t('embeddings.slots.coverageLabel')}
        className="h-1.5 overflow-hidden rounded-full bg-[#eef2f7]"
      >
        <div
          className={cn("h-full rounded-full", coverage >= 1 ? "bg-[#22c55e]" : "bg-[#3b82f6]")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11.5px] text-[#64748b]">
        {t('embeddings.slots.coverage', {
          done: format(provider.chunks_with_vectors ?? 0),
          total: format(provider.chunks_total ?? 0),
          percent,
        })}
      </p>
    </div>
  )
}

function TestLine({ state }: { state: EmbeddingTestState | undefined }) {
  const { t } = useTranslation('models')
  if (!state || state === 'idle') return null
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[11.5px]",
        state === 'ok' && "text-[#15803d]",
        state === 'error' && "text-[#d92d20]",
        state === 'testing' && "text-[#7c8798]",
      )}
    >
      {state === 'testing' && <Loader2 className="size-3 animate-spin" />}
      {state === 'ok' && <Check className="size-3" />}
      {state === 'testing' ? t('embeddings.testTesting') : state === 'ok' ? t('embeddings.testOk') : t('embeddings.testError')}
    </span>
  )
}

const SLOT_BUTTON =
  "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-[7px] border border-[#dfe4ec] bg-white px-2 text-[12px] font-medium text-[#334155] hover:cursor-pointer hover:border-[#93b4f5] hover:bg-[#f9fbff] disabled:cursor-not-allowed disabled:opacity-60"

function EmbeddingSlotCard({
  provider,
  isOnly,
  testState,
  canUpdate,
  canDelete,
  onTest,
  onEdit,
  onMakeDefault,
  onBuildIndex,
  onDelete,
}: {
  provider: EmbeddingProviderSlot
  /** Es el único proveedor: borrarlo desconecta la búsqueda por significado. */
  isOnly: boolean
  testState: EmbeddingTestState | undefined
  canUpdate: boolean
  canDelete: boolean
  onTest: () => void
  onEdit: () => void
  onMakeDefault: () => void
  onBuildIndex: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('models')
  const title = provider.label || provider.display_name
  const canRebuild = provider.index_status === 'failed' || provider.index_status === 'none'
  const makeDefaultBlocked = provider.index_status !== 'ready'
  // El predeterminado solo se borra si es el único (desconectar): con otros, primero se promueve otro.
  const deleteBlocked = provider.is_default && !isOnly

  return (
    <article
      aria-label={title}
      className={cn(
        "flex flex-col gap-3 rounded-[12px] border bg-white p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        provider.is_default ? "border-[#9fd9b0]" : "border-[#e1e6ed]",
      )}
    >
      <div className="flex items-start gap-3">
        <ModelsProviderAvatar type={provider.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[14px] font-semibold text-[#0f172a]">{title}</span>
          <span className="truncate text-[12px] text-[#7c8798]">
            {[provider.label ? provider.display_name : null, provider.model_name].filter(Boolean).join(' · ') || '—'}
          </span>
        </div>
        {provider.is_default ? (
          <span className="shrink-0 rounded-full border border-[#cdefd7] bg-[#eefbf1] px-2 py-px text-[10.5px] font-semibold text-[#15803d]">
            {t('embeddings.slots.defaultChip')}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-[#e3e9f1] bg-[#f6f8fb] px-2 py-px text-[10.5px] font-semibold text-[#64748b]">
            {t('embeddings.slots.evaluationChip')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[#64748b]">
        <IndexStatusChip status={provider.index_status} />
        {provider.dimensions ? <span>{t('embeddings.slots.dimensions', { value: provider.dimensions })}</span> : null}
      </div>

      <CoverageBar provider={provider} />
      {provider.index_status === 'failed' && (
        <p className="text-[11.5px] leading-snug text-[#b42318]">{t('embeddings.slots.indexFailedHelp')}</p>
      )}
      <TestLine state={testState} />

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-[#eef2f7] pt-3">
        {canUpdate && !provider.is_default && (
          <button
            type="button"
            disabled={makeDefaultBlocked}
            title={makeDefaultBlocked ? t('embeddings.slots.makeDefaultBlocked') : undefined}
            onClick={onMakeDefault}
            className={cn(SLOT_BUTTON, "border-[#2563eb] text-[#1d4ed8]")}
          >
            <Star className="size-3" />
            {t('embeddings.slots.makeDefault')}
          </button>
        )}
        {canUpdate && (
          <button type="button" disabled={testState === 'testing'} onClick={onTest} className={SLOT_BUTTON}>
            <Radio className="size-3" />
            {t('embeddings.slots.test')}
          </button>
        )}
        {canUpdate && (
          <button type="button" onClick={onEdit} className={SLOT_BUTTON}>
            {t('embeddings.slots.edit')}
          </button>
        )}
        {canUpdate && canRebuild && (
          <button type="button" onClick={onBuildIndex} className={SLOT_BUTTON}>
            <RefreshCw className="size-3" />
            {t('embeddings.slots.rebuild')}
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            disabled={deleteBlocked}
            title={deleteBlocked ? t('embeddings.slots.deleteDefaultBlocked') : undefined}
            onClick={onDelete}
            aria-label={isOnly ? t('embeddings.disconnect') : t('embeddings.slots.delete')}
            className={cn(SLOT_BUTTON, "ml-auto border-transparent text-[#d92d20] hover:border-[#fecdca] hover:bg-[#fef3f2]")}
          >
            <Trash2 className="size-3" />
            {isOnly ? t('embeddings.slots.disconnect') : t('embeddings.slots.delete')}
          </button>
        )}
      </div>
    </article>
  )
}

function FreeSlotCard({ canCreate, onAdd }: { canCreate: boolean; onAdd: () => void }) {
  const { t } = useTranslation('models')
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#cfd8e3] bg-[#fafbfd] p-[18px] text-center">
      <span className="text-[13px] font-semibold text-[#475569]">{t('embeddings.slots.freeTitle')}</span>
      <p className="max-w-[240px] text-[12px] leading-snug text-[#7c8798]">{t('embeddings.slots.freeHelp')}</p>
      {canCreate && (
        <HuemulButton
          size="sm"
          variant="outline"
          icon={Plus}
          iconClassName="size-3.5"
          label={t('embeddings.slots.add')}
          onClick={onAdd}
          className="mt-1 h-8 text-xs"
        />
      )}
    </div>
  )
}

export function EmbeddingsTab({
  providers,
  maxProviders,
  options,
  testStates,
  canCreate,
  canUpdate,
  canDelete,
  onConfigureFirst,
  onAddProvider,
  onEditProvider,
  onTestProvider,
  onMakeDefault,
  onBuildIndex,
  onDeleteProvider,
}: EmbeddingsTabProps) {
  const { t } = useTranslation('models')
  const [promoting, setPromoting] = useState<EmbeddingProviderSlot | null>(null)
  const [deleting, setDeleting] = useState<EmbeddingProviderSlot | null>(null)

  const ordered = [...providers].sort((a, b) => Number(b.is_default) - Number(a.is_default))
  const freeSlots = Math.max(maxProviders - ordered.length, 0)
  const current = ordered.find((p) => p.is_default) ?? null
  const describe = (name: EmbeddingProviderName) => t(`embeddings.descriptions.${name}`, { defaultValue: '' })
  const nameOf = (provider: EmbeddingProviderSlot | null) => (provider ? provider.label || provider.display_name : '')
  const promotingIncomplete = !!promoting && !isProviderComplete(promoting)
  const deletingIsOnly = !!deleting && ordered.length === 1

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="max-w-3xl text-[13px] leading-relaxed text-[#64748b]">{t('embeddings.intro')}</p>
        <HuemulNotice tone="amber">{t('embeddings.notConfiguredBanner')}</HuemulNotice>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {options.map((option) => (
            <EmbeddingOptionCard
              key={option.name}
              name={option.name}
              display={option.display}
              description={describe(option.name)}
              actionLabel={canCreate ? t('embeddings.configure') : undefined}
              onAction={() => onConfigureFirst(option.name)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-3xl text-[13px] leading-relaxed text-[#64748b]">{t('embeddings.intro')}</p>
      <HowItWorks maxProviders={maxProviders} defaultOpen={ordered.length === 1} />

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[14px] font-semibold text-[#0f172a]">
          {t('embeddings.slots.title', { used: ordered.length, max: maxProviders })}
        </h2>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((provider) => (
            <EmbeddingSlotCard
              key={provider.id}
              provider={provider}
              isOnly={ordered.length === 1}
              testState={testStates[provider.id]}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onTest={() => onTestProvider(provider)}
              onEdit={() => onEditProvider(provider)}
              onMakeDefault={() => setPromoting(provider)}
              onBuildIndex={() => onBuildIndex(provider)}
              onDelete={() => setDeleting(provider)}
            />
          ))}
          {Array.from({ length: freeSlots }, (_, index) => (
            <FreeSlotCard key={`free-${index}`} canCreate={canCreate} onAdd={onAddProvider} />
          ))}
        </div>
      </section>

      <HuemulAlertDialog
        open={!!promoting}
        onOpenChange={(open) => !open && setPromoting(null)}
        icon={Star}
        iconClassName="text-[#2563eb]"
        title={t('embeddings.makeDefaultDialog.title', { name: nameOf(promoting) })}
        description={t('embeddings.makeDefaultDialog.description', { name: nameOf(promoting), current: nameOf(current) })}
        alert={
          promotingIncomplete
            ? {
                title: t('embeddings.makeDefaultDialog.incompleteTitle'),
                description: t('embeddings.makeDefaultDialog.incompleteDescription', {
                  percent: Math.floor((coverageOf(promoting!) ?? 0) * 100),
                }),
              }
            : undefined
        }
        actionVariant="default"
        actionLabel={promotingIncomplete ? t('embeddings.makeDefaultDialog.forceAction') : t('embeddings.makeDefaultDialog.action')}
        showSuccessState={false}
        onAction={async () => {
          if (promoting) await onMakeDefault(promoting, promotingIncomplete)
        }}
      />

      <HuemulAlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={
          deletingIsOnly
            ? t('embeddings.deleteDialog.disconnectTitle')
            : t('embeddings.deleteDialog.title', { name: nameOf(deleting) })
        }
        description={deletingIsOnly ? t('embeddings.disconnectConfirm') : t('embeddings.deleteDialog.description')}
        actionLabel={deletingIsOnly ? t('embeddings.disconnectAccept') : t('embeddings.deleteDialog.action')}
        showSuccessState={false}
        onAction={async () => {
          if (deleting) await onDeleteProvider(deleting)
        }}
      />
    </div>
  )
}
