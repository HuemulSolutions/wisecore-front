"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy, Check, ExternalLink, Share2 } from "lucide-react"
import { toast } from "sonner"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

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
      showCancelButton={false}
      saveAction={{
        label: t("share.openInNewTab"),
        icon: ExternalLink,
        variant: "outline",
        onClick: () => {
          if (url) window.open(url, "_blank", "noopener,noreferrer")
        },
        closeOnSuccess: false,
      }}
    >
      <InputGroup>
        <InputGroupInput
          readOnly
          value={url ?? ""}
          onFocus={(e) => e.currentTarget.select()}
          className="font-mono text-xs"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={handleCopy}
            aria-label={t("share.copy")}
            title={copied ? t("share.copied") : t("share.copy")}
          >
            {copied ? <Check className="text-green-600" /> : <Copy />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </HuemulDialog>
  )
}
