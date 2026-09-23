"use client"

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, GitMerge } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"

/**
 * Overlay centrado sobre el canvas punteado. `pointer-events: none` en el
 * contenedor y `auto` solo en los botones: el canvas sigue siendo pan/zoom-able.
 */
function StateOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-(--z-canvas-state) grid place-items-center p-6">{children}</div>
  )
}

/** Estado 1 — lienzo vacío (diagrama nuevo). */
export function CanvasEmptyPrompt({
  onOpenTree,
  onOpenDiagrams,
}: {
  onOpenTree?: () => void
  onOpenDiagrams?: () => void
}) {
  const { t } = useTranslation("diagrams")
  return (
    <StateOverlay>
      <div className="flex max-w-[320px] flex-col items-center gap-2.5 text-center">
        <GitMerge className="h-[34px] w-[34px] text-[#94a3b8]" strokeWidth={1.5} />
        <h2 className="text-[15px] font-semibold text-[#0f172a]">{t("canvasStates.emptyTitle")}</h2>
        <p className="text-[13px] leading-normal text-[#64748b]">{t("canvasStates.emptyDescription")}</p>
        {(onOpenTree || onOpenDiagrams) && (
          <div className="pointer-events-auto mt-1 flex flex-wrap items-center justify-center gap-2">
            {onOpenTree && <HuemulButton size="sm" label={t("canvasStates.openTree")} onClick={onOpenTree} />}
            {onOpenDiagrams && (
              <HuemulButton
                size="sm"
                variant="outline"
                label={t("canvasStates.openDiagram")}
                onClick={onOpenDiagrams}
              />
            )}
          </div>
        )}
      </div>
    </StateOverlay>
  )
}

export interface CanvasLoadErrorProps {
  diagramId: string
  onRetry: () => void
  onViewDiagrams?: () => void
}

/** Estado 5 — diagrama no encontrado / error al cargar (`?diagram=<id>`). */
export function CanvasLoadError({ diagramId, onRetry, onViewDiagrams }: CanvasLoadErrorProps) {
  const { t } = useTranslation("diagrams")
  // UUID completo es ruido: los primeros 8 caracteres bastan para reconocerlo.
  const shortId = diagramId.length > 8 ? `${diagramId.slice(0, 8)}…` : diagramId
  return (
    <StateOverlay>
      <div className="flex max-w-[320px] flex-col items-center gap-2.5 text-center">
        <AlertTriangle className="h-[34px] w-[34px] text-[#b45309]" strokeWidth={1.5} />
        <h2 className="text-[15px] font-semibold text-[#0f172a]">{t("canvasStates.errorTitle")}</h2>
        <p className="text-[13px] leading-normal text-[#64748b]">
          {t("canvasStates.errorDescription")}{" "}
          <code className="font-mono text-[11.5px] text-[#475569]">{shortId}</code>.
        </p>
        <div className="pointer-events-auto mt-1 flex items-center gap-2">
          <HuemulButton size="sm" variant="outline" label={t("canvasStates.retry")} onClick={onRetry} />
          {onViewDiagrams && (
            <HuemulButton size="sm" label={t("canvasStates.viewMine")} onClick={onViewDiagrams} />
          )}
        </div>
      </div>
    </StateOverlay>
  )
}

/** Estado 6 — cargando diagrama: skeleton de nodos, sin spinner a pantalla completa. */
export function CanvasLoadingSkeleton({ name }: { name?: string }) {
  const { t } = useTranslation("diagrams")
  const box = "absolute h-[52px] w-[150px] rounded-[10px] border border-[#e3e8ee] bg-[#edf0f4] animate-pulse"
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className={box} style={{ left: "22%", top: "26%" }} />
      <div className={box} style={{ left: "46%", top: "42%" }} />
      <div className={box} style={{ left: "66%", top: "24%" }} />
      <p className="absolute inset-x-0 bottom-[12%] text-center text-[12.5px] text-[#64748b]">
        {name ? t("canvasStates.loadingNamed", { name }) : t("canvasStates.loading")}
      </p>
    </div>
  )
}
