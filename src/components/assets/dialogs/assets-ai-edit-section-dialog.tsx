import { useState, useEffect } from "react"
import { Bot } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"

interface AiEditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (prompt: string) => void
  isProcessing?: boolean
}

export function AiEditSectionDialog({
  open,
  onOpenChange,
  onSend,
  isProcessing = false,
}: AiEditSectionDialogProps) {
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const [aiPrompt, setAiPrompt] = useState("")

  useEffect(() => {
    if (!open) {
      setAiPrompt("")
    }
  }, [open])

  const handleSubmit = () => {
    if (aiPrompt.trim()) {
      onSend(aiPrompt.trim())
      setAiPrompt("")
    }
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('aiEditSection.title')}
      icon={Bot}
      maxWidth="sm:max-w-md"
      maxHeight="max-h-[90vh]"
      cancelLabel={tCommon('cancel')}
      saveAction={{
        label: t('aiEditSection.send'),
        onClick: handleSubmit,
        disabled: !aiPrompt.trim(),
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <HuemulField
        type="textarea"
        label=""
        placeholder={t('aiEditSection.promptPlaceholder')}
        value={aiPrompt}
        onChange={(v) => setAiPrompt(String(v))}
        rows={5}
        inputClassName="min-h-[120px]"
      />
    </HuemulDialog>
  )
}
