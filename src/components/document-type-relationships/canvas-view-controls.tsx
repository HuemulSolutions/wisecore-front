"use client"

import { useTranslation } from "react-i18next"
import { Panel, useReactFlow, useStore } from "@xyflow/react"
import { Lock, LockOpen, Maximize, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CANVAS_SURFACE_SUBTLE } from "./canvas-surface"

export interface CanvasViewControlsProps {
  /** Lienzo bloqueado: no se mueven, conectan ni seleccionan nodos (pan y zoom siguen). */
  locked: boolean
  onToggleLock: () => void
}

const BUTTON_CLASS =
  "grid h-7 w-7 place-items-center rounded-[7px] border-0 bg-transparent font-[inherit] text-[#475569] transition-colors hover:cursor-pointer hover:bg-[#f4f6f9] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

/**
 * Controles de vista flotantes abajo a la izquierda (`chrome="editor"`): zoom,
 * ajustar a la vista y bloquear el lienzo. Reemplazan al `<Controls />` de React
 * Flow y se muestran también en modo solo lectura.
 */
export function CanvasViewControls({ locked, onToggleLock }: CanvasViewControlsProps) {
  const { t } = useTranslation("diagrams")
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const zoom = useStore((s) => s.transform[2])

  return (
    <Panel position="bottom-left" style={{ margin: 16 }}>
      <div className={cn("flex h-9 items-center gap-0.5 rounded-[10px] px-1", CANVAS_SURFACE_SUBTLE)}>
        <button
          type="button"
          title={t("viewControls.zoomOut")}
          aria-label={t("viewControls.zoomOut")}
          onClick={() => void zoomOut({ duration: 150 })}
          className={BUTTON_CLASS}
        >
          <Minus className="h-[15px] w-[15px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          title={t("viewControls.resetZoom")}
          aria-label={t("viewControls.resetZoom")}
          onClick={() => void zoomTo(1, { duration: 150 })}
          className="min-w-10 rounded-[7px] border-0 bg-transparent text-center font-[inherit] text-xs font-semibold text-[#475569] hover:cursor-pointer hover:bg-[#f4f6f9] h-7"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          title={t("viewControls.zoomIn")}
          aria-label={t("viewControls.zoomIn")}
          onClick={() => void zoomIn({ duration: 150 })}
          className={BUTTON_CLASS}
        >
          <Plus className="h-[15px] w-[15px]" strokeWidth={1.8} />
        </button>

        <div className="mx-[3px] h-[18px] w-px bg-[#e9edf2]" />

        <button
          type="button"
          title={t("viewControls.fit")}
          aria-label={t("viewControls.fit")}
          onClick={() => void fitView({ duration: 200 })}
          className={BUTTON_CLASS}
        >
          <Maximize className="h-[15px] w-[15px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          title={locked ? t("viewControls.unlock") : t("viewControls.lock")}
          aria-label={locked ? t("viewControls.unlock") : t("viewControls.lock")}
          aria-pressed={locked}
          onClick={onToggleLock}
          className={cn(BUTTON_CLASS, locked && "bg-[#eef2ff] text-[#1d4ed8] hover:bg-[#eef2ff]")}
        >
          {locked ? (
            <Lock className="h-[15px] w-[15px]" strokeWidth={1.8} />
          ) : (
            <LockOpen className="h-[15px] w-[15px]" strokeWidth={1.8} />
          )}
        </button>
      </div>
    </Panel>
  )
}
