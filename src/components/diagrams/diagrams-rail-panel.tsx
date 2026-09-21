"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { cn } from "@/lib/utils"

export interface DiagramsRailPanelProps {
  title: string
  /** Contador de la cabecera, ej. "8 de 24". */
  counter?: string
  /** Slot a la derecha del título (ej. botón de refresh). */
  actions?: ReactNode
  onClose: () => void
  /** Se llama al cerrar para devolver el foco al botón del riel. */
  onCloseFocusRef?: React.RefObject<HTMLButtonElement | null>
  /** Ocultar la cabecera cuando el contenido ya trae la suya (ej. el árbol). */
  hideHeader?: boolean
  className?: string
  children: ReactNode
}

/**
 * Panel superpuesto de 300px sobre el canvas. NO es un Sheet/Dialog: un modal
 * bloquearía el drop del árbol sobre el canvas. Sin focus trap por la misma
 * razón (hay que poder arrastrar hacia afuera); cierra con Esc y con pointerdown
 * fuera, y devuelve el foco al botón del riel.
 */
export function DiagramsRailPanel({
  title,
  counter,
  actions,
  onClose,
  onCloseFocusRef,
  hideHeader,
  className,
  children,
}: DiagramsRailPanelProps) {
  const { t } = useTranslation("diagrams")
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const close = () => {
      onCloseRef.current()
      onCloseFocusRef?.current?.focus()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target || panelRef.current?.contains(target)) return
      // Clic en el propio riel: lo resuelve su onToggle (cierra al re-pulsar).
      if ((target as HTMLElement).closest?.("[data-diagrams-rail]")) return
      // Portales (dropdowns, dialogs) abiertos desde el panel.
      if ((target as HTMLElement).closest?.("[data-radix-popper-content-wrapper],[role='dialog'],[role='menu']")) return
      onCloseRef.current()
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [onCloseFocusRef])

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className={cn(
        "absolute inset-y-0 left-0 z-(--z-canvas-rail-panel) flex w-[300px] flex-col border-r border-[#e9edf2] bg-white shadow-lg",
        className,
      )}
    >
      {!hideHeader && (
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[#e9edf2] px-3">
          <h2 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#0f172a]">{title}</h2>
          {counter && <span className="text-[11.5px] text-slate-400">{counter}</span>}
          {actions}
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            icon={X}
            iconClassName="h-4 w-4"
            tooltip={t("rail.close")}
            aria-label={t("rail.close")}
            onClick={() => {
              onClose()
              onCloseFocusRef?.current?.focus()
            }}
          />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
