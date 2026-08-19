"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy, Check, ExternalLink, Share2 } from "lucide-react"
import { toast } from "sonner"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"

interface WorkflowShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string | null
  description: string
}

/**
 * Dialog que muestra la URL para compartir un workflow (template o ejecución)
 * a otro usuario de la organización — ver ia context/fullscreen-share-route-guide.md.
 * Mismo patrón de "copiar" que token-create-sheet.tsx (no hay util de
 * clipboard compartido en el repo).
 */
export function WorkflowShareDialog({ open, onOpenChange, url, description }: WorkflowShareDialogProps) {
  const { t } = useTranslation("workflow")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t("share.copied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("share.copyFailed"))
    }
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("share.dialogTitle")}
      description={description}
      icon={Share2}
      showCancelButton
      cancelLabel={t("share.close")}
      extraActions={[
        {
          label: t("share.openInNewTab"),
          icon: ExternalLink,
          variant: "outline",
          onClick: () => {
            if (url) window.open(url, "_blank", "noopener,noreferrer")
          },
          closeOnSuccess: false,
        },
      ]}
      saveAction={{
        label: copied ? t("share.copied") : t("share.copy"),
        icon: copied ? Check : Copy,
        onClick: handleCopy,
        closeOnSuccess: false,
      }}
    >
      <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <code className="flex-1 break-all font-mono text-xs text-foreground">{url}</code>
      </div>
    </HuemulDialog>
  )
}
