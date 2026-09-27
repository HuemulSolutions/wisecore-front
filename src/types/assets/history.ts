import type { LucideIcon } from "lucide-react"
import type { ExecutionSummary } from "./sheets"

/** Qué tabs monta una apertura del sheet de historial. El orden define cuál arranca activo. */
export type AssetHistoryTab = "section" | "lifecycle" | "changes"

export type HistoryTone = "blue" | "violet" | "amber" | "green" | "slate" | "red"

/**
 * VM común de una fila de historial, genérico sobre el registro crudo del
 * backend (`raw`) para no perder nada que el panel derecho necesite —
 * `SectionHistoryEntry`, `ExecutionEvent` o `DocumentChangeLogEntry` según
 * el tab.
 */
export interface HistoryEntryVM<TRaw = unknown> {
  id: string
  icon: LucideIcon
  tone: HistoryTone
  /** Ya traducido a lenguaje de usuario: "Edición IA", "Avance automático". */
  typeLabel: string
  /** Línea de contexto de la fila (instrucción, etapa, campo). */
  context: string | null
  /** Resuelto contra el `userMap`; `null` ⇒ autor desconocido. */
  authorName: string | null
  createdAt: string
  /** El registro completo, para que el detalle acceda a lo que no entra en el VM. */
  raw: TRaw
}

/** Contrato uniforme de datos de un tab, sea cual sea su endpoint. */
export interface AssetHistoryTabData<TRaw = unknown> {
  entries: HistoryEntryVM<TRaw>[]
  /** Solo `true` cuando todavía no hay nada acumulado — el skeleton de carga inicial. */
  isLoading: boolean
  /** `true` mientras se trae una página siguiente con contenido ya acumulado — el spinner de "Cargar más", nunca el skeleton. */
  isLoadingMore: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  /** Solo cuando el backend lo da (sección, ciclo de vida). */
  total?: number
  hasNext: boolean
  loadMore: () => void
  /** Endpoint literal, para el estado de error. */
  endpoint: string
}

export interface AssetHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  /** Qué tabs monta esta apertura, en orden. El primero es el activo al abrir. */
  tabs: AssetHistoryTab[]
  /** Requerido si `tabs` incluye `"section"`. */
  sectionExecutionId?: string
  sectionName?: string
  /** Requeridos si `tabs` incluye `"lifecycle"` o `"changes"`. */
  documentId?: string
  executionId?: string
  allExecutions?: ExecutionSummary[]
  /** Va al título: "Historial · {{name}}". */
  entityName?: string
}
