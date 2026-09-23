import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import type { ModelsProvidersStripProps } from "@/types/models"
export type { ModelsProvidersStripProps } from "@/types/models"

export function ModelsProvidersStrip({
  providers,
  modelCounts,
  canCreate,
  canEdit,
  onEdit,
  onCreate,
}: ModelsProvidersStripProps) {
  const { t } = useTranslation('models')

  return (
    <section className="flex flex-col gap-2.5">
      <div>
        <h2 className="text-[14px] font-semibold text-[#0f172a]">{t('providers.title')}</h2>
        <p className="text-[12.5px] text-[#7c8798]">{t('providers.help')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {providers.map((provider) => {
          const count = modelCounts[provider.id] ?? 0
          const details = [
            provider.display_name,
            provider.is_managed ? t('providers.managed') : null,
            t(count === 1 ? 'providers.modelOne' : 'providers.modelMany', { count }),
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <button
              key={provider.id}
              type="button"
              disabled={!canEdit}
              onClick={() => onEdit(provider)}
              className={cn(
                "flex w-[236px] items-center gap-2.5 rounded-[12px] border border-[#e3e9f1] bg-white p-3 text-left transition-colors",
                canEdit ? "hover:cursor-pointer hover:border-[#93b4f5]" : "cursor-default",
              )}
            >
              <ModelsProviderAvatar type={provider.type} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{provider.name}</span>
                <span className="truncate text-xs text-[#7c8798]">{details}</span>
              </span>
            </button>
          )
        })}

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              "flex w-[236px] items-center gap-2.5 rounded-[12px] border border-dashed bg-white p-3 text-left transition-colors hover:cursor-pointer",
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
    </section>
  )
}
