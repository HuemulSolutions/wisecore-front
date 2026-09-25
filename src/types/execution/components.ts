export interface ExecutionInfoProps {
  execution: {
    id: string;
    document_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  onRefresh?: () => void;
  isGenerating: boolean;
}

export interface ExecutionStatusBannerProps {
  executionId: string | null;
  onExecutionComplete?: (completedExecutionId?: string) => void;
  className?: string;
}

/**
 * Un único banner de progreso agregado para toda una corrida single/from —
 * reemplaza el banner por sección (uno por cada sección en scope, ver
 * "ia context" del rediseño de feedback de ejecución).
 */
export interface ExecutionRunProgressBannerProps {
  /** Cambia en cada corrida — usado como `key` por el padre para forzar remount y no arrastrar estado local (toast ya mostrado, dismiss) entre corridas. */
  runToken: string;
  phase: 'idle' | 'arming' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: { done: number; total: number };
  executionMode: 'single' | 'from';
  currentSectionName?: string;
  failureMessage?: string | null;
  /** true mientras el contenido regenerado todavía no llegó al caché de document-content (ver isAwaitingFreshContent en AssetContent) — retrasa el auto-cierre para evitar el flash de contenido viejo. */
  isAwaitingFreshContent?: boolean;
  onRefresh: () => void;
  onDismiss?: () => void;
  className?: string;
}
