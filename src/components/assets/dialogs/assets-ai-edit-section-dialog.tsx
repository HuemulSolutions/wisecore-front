import { useState, useEffect } from "react"
import { Bot } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Textarea } from "@/components/ui/textarea"

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
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ask AI to Edit"
      icon={Bot}
      maxWidth="md"
      maxHeight="90vh"
      showDefaultFooter
      onCancel={() => onOpenChange(false)}
      onSubmit={handleSubmit}
      submitLabel="Send"
      cancelLabel="Cancel"
      isSubmitting={isProcessing}
      isValid={!!aiPrompt.trim()}
    >
      <Textarea
        placeholder="Describe how you want to modify this content..."
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        className="min-h-[120px]"
        rows={5}
      />
    </ReusableDialog>
  )
}
