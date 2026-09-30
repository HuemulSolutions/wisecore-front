import type { MediaAnalysisStatus } from "@/types/media"

/** Claves i18n (namespace `media`) del estado de análisis de un archivo para la búsqueda. */
const LABEL_KEYS: Record<MediaAnalysisStatus, string> = {
  completed: "analysis.completed",
  pending: "analysis.pending",
  not_analyzed: "analysis.notAnalyzed",
  failed: "analysis.failed",
  skipped: "analysis.skipped",
}

const HINT_KEYS: Record<MediaAnalysisStatus, string> = {
  completed: "analysis.completedHint",
  pending: "analysis.pendingHint",
  not_analyzed: "analysis.notAnalyzedHint",
  failed: "analysis.failedHint",
  skipped: "analysis.skippedHint",
}

export function mediaAnalysisLabelKey(status: MediaAnalysisStatus): string {
  return LABEL_KEYS[status]
}

export function mediaAnalysisHintKey(status: MediaAnalysisStatus): string {
  return HINT_KEYS[status]
}

/** Si el estado amerita un aviso visible: `completed` y `null` no muestran nada. */
export function isNoticeableAnalysisStatus(status: MediaAnalysisStatus | null | undefined): status is MediaAnalysisStatus {
  return !!status && status !== "completed"
}
