"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { Panel } from "@xyflow/react"
import { Circle, CircleDot, Diamond, Shield, Square, Type } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasElementKind, FlowCanvasNodeType } from "@/types/document-type-relationships"
import type { CanvasElementPaletteProps } from "@/types/document-type-relationships"

/**
 * Paleta vertical flotante siempre visible para agregar elementos al canvas —
 * reemplaza el dropdown "Agregar ▾" que costaba 2 clics y no daba affordance
 * de qué se podía crear. Solo agrega elementos (Contenedor/Texto/Rol); cargar
 * diagrama y limpiar canvas viven en `CanvasActionsBar`.
 */
export function CanvasElementPalette({ canAddRole, canAddFlow, onAdd, compact }: CanvasElementPaletteProps) {
  const { t } = useTranslation("document-type-relationships")

  return (
    <Panel position="top-left" style={{ margin: 12 }}>
      <div className="flex flex-col gap-1.5 rounded-xl border bg-background/95 p-2 shadow-md backdrop-blur">
        {!compact && (
          <span className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("canvas.palette.title")}
          </span>
        )}
        <PaletteItem
          kind="container"
          icon={Square}
          label={t("sidebar.container")}
          tooltip={t("canvas.addContainer")}
          compact={compact}
          onAdd={onAdd}
        />
        <PaletteItem
          kind="text"
          icon={Type}
          label={t("sidebar.text")}
          tooltip={t("canvas.addText")}
          compact={compact}
          onAdd={onAdd}
        />
        {canAddRole && (
          <PaletteItem
            kind="role"
            icon={Shield}
            label={t("sidebar.role")}
            tooltip={t("canvas.addRole")}
            compact={compact}
            onAdd={onAdd}
          />
        )}
        {canAddFlow && (
          <>
            <div className="my-0.5 h-px bg-border" />
            <PaletteItem
              kind="startEvent"
              icon={Circle}
              label={t("sidebar.startEvent")}
              tooltip={t("canvas.addStartEvent")}
              compact={compact}
              onAdd={onAdd}
            />
            <PaletteItem
              kind="gateway"
              icon={Diamond}
              label={t("sidebar.gateway")}
              tooltip={t("canvas.addGateway")}
              compact={compact}
              onAdd={onAdd}
            />
            <PaletteItem
              kind="endEvent"
              icon={CircleDot}
              label={t("sidebar.endEvent")}
              tooltip={t("canvas.addEndEvent")}
              compact={compact}
              onAdd={onAdd}
            />
          </>
        )}
      </div>
    </Panel>
  )
}

function PaletteItem({
  kind,
  icon: Icon,
  label,
  tooltip,
  compact,
  onAdd,
}: {
  kind: CanvasElementKind | FlowCanvasNodeType
  icon: React.ComponentType<{ className?: string }>
  label: string
  tooltip: string
  compact?: boolean
  onAdd: (kind: CanvasElementKind | FlowCanvasNodeType) => void
}) {
  // Clicable y arrastrable a la vez: mismo payload que `asset-type-sidebar.tsx`,
  // así `handleDrop` del canvas lo consume sin cambios. `div role="button"` en vez
  // de `<button draggable>` — el drag nativo sobre <button> es errático en WebKit.
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData("application/canvas-element", JSON.stringify({ kind }))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd(kind)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onAdd(kind)
        }
      }}
      title={tooltip}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 select-none transition-colors",
        "hover:bg-accent hover:cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      {/* El icono es el elemento principal (para que se memorice antes que el
          texto); el label queda como ayuda secundaria para quien todavía no lo
          reconoce — nunca desaparece salvo en `compact` (canvas angosto). */}
      <Icon className="h-5 w-5 shrink-0 text-foreground/70" />
      {!compact && (
        <span className="text-[10px] font-medium leading-none text-muted-foreground">{label}</span>
      )}
    </div>
  )
}
