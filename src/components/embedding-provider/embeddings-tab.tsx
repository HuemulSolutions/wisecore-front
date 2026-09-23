import { useState } from "react"
import { Check, Loader2, Radio } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import type { EmbeddingProviderName, EmbeddingsTabProps } from "@/types/embedding-provider"
export type { EmbeddingsTabProps } from "@/types/embedding-provider"

function DetailRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7c8798]">{label}</span>
      <span className={cn("truncate text-[13px] text-[#0f172a]", mono && "font-mono")}>{value}</span>
    </div>
  )
}

export function EmbeddingsTab({
  configured,
  options,
  testState,
  canCreate,
  canUpdate,
  canDelete,
  onTest,
  onEditCredentials,
  onChooseProvider,
  onDisconnect,
}: EmbeddingsTabProps) {
  const { t } = useTranslation('models')
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const active = options.find((o) => o.isActive)
  const others = options.filter((o) => !o.isActive)

  const describe = (name: EmbeddingProviderName) =>
    t(`embeddings.descriptions.${name}`, { defaultValue: '' })

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await onDisconnect()
      setConfirmingDisconnect(false)
    } catch {
      // el error lo muestra el manejador global; la confirmación queda abierta
    } finally {
      setIsDisconnecting(false)
    }
  }

  const testMessage =
    testState === 'testing'
      ? t('embeddings.testTesting')
      : testState === 'ok'
        ? t('embeddings.testOk')
        : testState === 'error'
          ? t('embeddings.testError')
          : t('embeddings.testIdle')

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-3xl text-[13px] leading-relaxed text-[#64748b]">{t('embeddings.intro')}</p>

      {configured && active ? (
        <>
          <section className="overflow-hidden rounded-[14px] border border-[#e3e9f1] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-[18px]">
              <div className="flex min-w-0 items-center gap-3">
                <ModelsProviderAvatar type={active.name} />
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-[#0f172a]">{active.display}</span>
                    <span className="rounded-full border border-[#cdefd7] bg-[#eefbf1] px-2 py-px text-[10.5px] font-semibold text-[#15803d]">
                      {t('embeddings.active')}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      testState === 'ok' && "text-[#15803d]",
                      testState === 'error' && "text-[#d92d20]",
                      (testState === 'idle' || testState === 'testing') && "text-[#7c8798]",
                    )}
                  >
                    {testState === 'testing' && <Loader2 className="size-3 animate-spin" />}
                    {testState === 'ok' && <Check className="size-3" />}
                    {testMessage}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <HuemulButton
                    size="sm"
                    variant="outline"
                    icon={Radio}
                    iconClassName="size-3.5"
                    label={t('embeddings.testConnection')}
                    loading={testState === 'testing'}
                    onClick={onTest}
                    className="h-8 text-xs"
                  />
                )}
                {canUpdate && (
                  <HuemulButton
                    size="sm"
                    variant="outline"
                    label={t('embeddings.editCredentials')}
                    onClick={onEditCredentials}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-[#eef2f7] px-[18px] py-3.5 sm:grid-cols-3">
              <DetailRow label={t('embeddings.apiKeySaved')} value={t('embeddings.apiKeySavedValue')} mono={false} />
              {active.requiresEndpoint && configured.endpoint && (
                <DetailRow label={t('embeddings.endpoint')} value={configured.endpoint} />
              )}
              {active.requiresDeployment && configured.deployment && (
                <DetailRow label={t('embeddings.deployment')} value={configured.deployment} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f7] bg-[#f7f9fb] px-[18px] py-2.5">
              <span className="text-xs text-[#7c8798]">{t('embeddings.encryptedNote')}</span>
              {canDelete &&
                (confirmingDisconnect ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="max-w-md text-xs text-[#0f172a]">{t('embeddings.disconnectConfirm')}</span>
                    <button
                      type="button"
                      disabled={isDisconnecting}
                      onClick={() => setConfirmingDisconnect(false)}
                      className="h-8 rounded-[8px] border border-[#dfe4ec] bg-white px-2.5 text-xs font-medium text-[#475569] hover:cursor-pointer hover:border-[#93b4f5] disabled:opacity-50"
                    >
                      {t('embeddings.disconnectCancel')}
                    </button>
                    <button
                      type="button"
                      disabled={isDisconnecting}
                      onClick={handleDisconnect}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#d92d20] px-2.5 text-xs font-semibold text-white hover:cursor-pointer hover:bg-[#b42318] disabled:opacity-60"
                    >
                      {isDisconnecting && <Loader2 className="size-3.5 animate-spin" />}
                      {t('embeddings.disconnectAccept')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDisconnect(true)}
                    className="text-xs font-semibold text-[#d92d20] hover:cursor-pointer hover:underline"
                  >
                    {t('embeddings.disconnect')}
                  </button>
                ))}
            </div>
          </section>

          {canCreate && others.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h2 className="text-[14px] font-semibold text-[#0f172a]">{t('embeddings.switchTitle')}</h2>
              <div className="overflow-hidden rounded-[14px] border border-[#e3e9f1] bg-white">
                {others.map((option) => (
                  <div
                    key={option.name}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] px-[18px] py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ModelsProviderAvatar type={option.name} size="sm" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{option.display}</span>
                        <span className="truncate text-xs text-[#7c8798]">{describe(option.name)}</span>
                      </div>
                    </div>
                    <HuemulButton
                      size="sm"
                      variant="outline"
                      label={t('embeddings.useProvider')}
                      onClick={() => onChooseProvider(option.name)}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <HuemulNotice tone="amber">{t('embeddings.notConfiguredBanner')}</HuemulNotice>
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {options.map((option) => (
              <div key={option.name} className="flex flex-col gap-3 rounded-[14px] border border-[#e3e9f1] bg-white p-[18px]">
                <div className="flex items-center gap-3">
                  <ModelsProviderAvatar type={option.name} />
                  <span className="text-[14px] font-semibold text-[#0f172a]">{option.display}</span>
                </div>
                <p className="text-[12.5px] leading-snug text-[#64748b]">{describe(option.name)}</p>
                {canCreate && (
                  <div>
                    <HuemulButton
                      size="sm"
                      label={t('embeddings.configure')}
                      onClick={() => onChooseProvider(option.name)}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
