import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ThumbsDown, ThumbsUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useSearchFeedback } from "@/hooks/useSearchPassages"
import { cn } from "@/lib/utils"

/**
 * Pulgar arriba / abajo sobre un pasaje (`passageId`) o sobre la búsqueda completa. El
 * "no útil" pide un comentario opcional antes de enviar: es lo que más sirve para armar el
 * golden con preguntas reales (testplanBusqueda.md §6).
 */
export function SearchPassageFeedback({
  organizationId,
  searchLogId,
  passageId,
  label,
  className,
}: {
  organizationId: string
  searchLogId: string
  passageId?: string
  label: string
  className?: string
}) {
  const { t } = useTranslation("search")
  const feedback = useSearchFeedback(organizationId)
  const [sent, setSent] = useState<boolean | null>(null)
  const [askingComment, setAskingComment] = useState(false)
  const [comment, setComment] = useState("")

  const send = (useful: boolean, withComment?: string) => {
    feedback.mutate(
      { search_log_id: searchLogId, passage_id: passageId, useful, comment: withComment?.trim() || undefined },
      {
        onSuccess: () => {
          setSent(useful)
          setAskingComment(false)
        },
      },
    )
  }

  if (sent !== null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
        <Check className="size-3" />
        {t("feedback.thanks")}
      </span>
    )
  }

  if (askingComment) {
    return (
      <div className={cn("flex w-full flex-col gap-2", className)}>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("feedback.commentPlaceholder")}
          maxLength={2000}
          rows={2}
          className="text-xs"
        />
        <div className="flex justify-end gap-2">
          <HuemulButton
            variant="ghost"
            size="sm"
            label={t("feedback.skipComment")}
            disabled={feedback.isPending}
            onClick={() => send(false)}
            className="h-7 text-xs"
          />
          <HuemulButton
            size="sm"
            label={t("feedback.send")}
            loading={feedback.isPending}
            onClick={() => send(false, comment)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="mr-1 text-[11px] text-muted-foreground">{label}</span>
      <button
        type="button"
        aria-label={t("feedback.useful")}
        title={t("feedback.useful")}
        disabled={feedback.isPending}
        onClick={() => send(true)}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:cursor-pointer hover:bg-muted hover:text-[#15803d] disabled:opacity-50"
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={t("feedback.notUseful")}
        title={t("feedback.notUseful")}
        disabled={feedback.isPending}
        onClick={() => setAskingComment(true)}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:cursor-pointer hover:bg-muted hover:text-[#b42318] disabled:opacity-50"
      >
        <ThumbsDown className="size-3.5" />
      </button>
    </span>
  )
}
