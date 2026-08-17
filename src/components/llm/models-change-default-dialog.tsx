import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LLM } from '@/types/models'

interface ChangeDefaultModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  models: LLM[]
  providers: { id: string; name: string }[]
  currentDefaultId?: string
  isUpdating: boolean
  onSubmit: (modelId: string) => void
  canUpdate: boolean
}

export function ChangeDefaultModelDialog({
  open,
  onOpenChange,
  models,
  providers,
  currentDefaultId,
  isUpdating,
  onSubmit,
  canUpdate,
}: ChangeDefaultModelDialogProps) {
  const { t } = useTranslation('models')
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (open) {
      setSelectedId(currentDefaultId ?? '')
    }
  }, [open, currentDefaultId])

  const getProviderName = (providerId: string) =>
    providers.find((p) => p.id === providerId)?.name ?? ''

  const handleSave = () => {
    if (!selectedId || !canUpdate) return
    onSubmit(selectedId)
  }

  if (!canUpdate) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('changeDefaultDialog.title')}
      description={t('changeDefaultDialog.description')}
      icon={Star}
      saveAction={{
        label: isUpdating ? t('common:updating') : t('changeDefaultDialog.confirm'),
        onClick: handleSave,
        disabled: isUpdating || !selectedId || selectedId === currentDefaultId,
        loading: isUpdating,
        closeOnSuccess: false,
      }}
    >
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full hover:cursor-pointer">
          <SelectValue placeholder={t('changeDefaultDialog.selectModel')} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} className="hover:cursor-pointer">
              <span className="font-medium">{model.name}</span>
              <span className="ml-1.5 text-muted-foreground text-xs">
                {model.internal_name}
                {getProviderName(model.provider_id) && (
                  <> · {t('defaultBanner.via')} {getProviderName(model.provider_id)}</>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </HuemulDialog>
  )
}
