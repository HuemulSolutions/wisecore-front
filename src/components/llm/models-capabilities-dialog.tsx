import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ModelCapabilitiesDialogProps } from "@/types/models"
export type { ModelCapabilitiesDialogProps } from "@/types/models"
import { LLM_CAPABILITIES } from "@/lib/llm-capabilities"

export function ModelCapabilitiesDialog({
  open,
  onOpenChange,
  model,
  isUpdating,
  onSubmit,
  canUpdate,
}: ModelCapabilitiesDialogProps) {
  const { t } = useTranslation('models')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (model && open) {
      setSelected(model.capabilities ?? [])
    }
  }, [model, open])

  useEffect(() => {
    if (!open) {
      setSelected([])
    }
  }, [open])

  const toggle = (cap: string) => {
    setSelected((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    )
  }

  const handleSave = () => {
    if (!model || !canUpdate) return
    onSubmit(model, selected)
  }

  if (!canUpdate) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('capabilitiesDialog.title', { name: model?.name })}
      description={t('capabilitiesDialog.description')}
      icon={Settings}
      saveAction={{
        label: isUpdating ? t('common:updating') : t('capabilitiesDialog.save'),
        onClick: handleSave,
        disabled: isUpdating || selected.length === 0,
        loading: isUpdating,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-3">
        {LLM_CAPABILITIES.map((cap) => (
          <div key={cap} className="flex items-center gap-3">
            <Checkbox
              id={`cap-${cap}`}
              checked={selected.includes(cap)}
              onCheckedChange={() => toggle(cap)}
              disabled={isUpdating}
              className="hover:cursor-pointer"
            />
            <Label
              htmlFor={`cap-${cap}`}
              className="text-sm hover:cursor-pointer select-none"
            >
              {t(`capabilitiesDialog.capabilities.${cap}`)}
            </Label>
          </div>
        ))}
      </div>
    </HuemulDialog>
  )
}
