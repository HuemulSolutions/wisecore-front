import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { isNoticeableAnalysisStatus, mediaAnalysisHintKey, mediaAnalysisLabelKey } from "@/lib/media-analysis"
import type { MediaAnalysisStatus } from "@/types/media"

/**
 * Indicador de si el archivo ya se puede encontrar en la búsqueda. Solo aparece cuando hay
 * algo que avisar: `completed` y `null` (extensión no indexable) no muestran nada.
 */
const STYLES: Record<Exclude<MediaAnalysisStatus, "completed">, string> = {
  not_analyzed: "border-[#fbe3a6] bg-[#fffcf3] text-[#b45309]",
  failed: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
  pending: "border-[#cfe0ff] bg-[#eef4ff] text-[#1d4ed8]",
  skipped: "border-[#e3e9f1] bg-[#f7f9fb] text-[#64748b]",
}

export function HuemulMediaAnalysisBadge({
  status,
  className,
}: {
  status: MediaAnalysisStatus | null | undefined
  className?: string
}) {
  const { t } = useTranslation("media")
  if (!isNoticeableAnalysisStatus(status) || status === "completed") return null

  return (
    <Badge
      variant="outline"
      title={t(mediaAnalysisHintKey(status))}
      className={cn("h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium", STYLES[status], className)}
    >
      {t(mediaAnalysisLabelKey(status))}
    </Badge>
  )
}
