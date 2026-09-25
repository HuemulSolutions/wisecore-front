import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { LLM } from '@/types/models'

interface ModelsDefaultBannerProps {
  defaultModel: LLM | undefined
  providerName?: string
  onChangeDefault: () => void
  canUpdateModel: boolean
}

export function ModelsDefaultBanner({
  defaultModel,
  providerName,
  onChangeDefault,
  canUpdateModel,
}: ModelsDefaultBannerProps) {
  const { t } = useTranslation('models')

  if (!defaultModel) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/50 dark:bg-yellow-950/20">
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 shrink-0 fill-yellow-400 text-yellow-400" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
            {t('defaultBanner.label')}
          </p>
          <p className="text-sm font-medium text-foreground">
            {defaultModel.name}{' '}
            <span className="font-normal text-muted-foreground">
              {defaultModel.internal_name}
              {providerName && (
                <>
                  {' · '}
                  {t('defaultBanner.via')} {providerName}
                </>
              )}
            </span>
          </p>
        </div>
      </div>
      {canUpdateModel && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 hover:cursor-pointer"
          onClick={onChangeDefault}
        >
          {t('defaultBanner.changeDefault')}
        </Button>
      )}
    </div>
  )
}
