"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { Panel } from "@xyflow/react"
import { Circle, CircleDot, Diamond, Hand, MousePointer2, Shield, Square, Type } from "lucide-react"
import { cn } from "@/lib/utils"
import { CANVAS_SURFACE } from "./canvas-surface"
import type { CanvasElementKind, FlowCanvasNodeType } from "@/types/document-type-relationships"
import type { CanvasElementPaletteProps } from "@/types/document-type-relationships"

/**
 * Paleta vertical flotante siempre visible para agregar elementos al canvas —
 * reemplaza el dropdown "Agregar ▾" que costaba 2 clics y no daba affordance
 * de qué se podía crear. Solo agrega elementos (Contenedor/Texto/Rol); cargar
 * diagrama y limpiar canvas viven en `CanvasActionsBar`.
 *
 * Variante `editor` (/diagrams): panel de 156px colapsable a una tira de iconos
 * de 40px. El estado de colapso vive en el canvas (atajo `[`, auto-colapso por
 * alto y persistencia).
 */
export function CanvasElementPalette({
  canAddRole,
  canAddFlow,
  onAdd,
  compact,
  editor,
  activeTool,
  onChangeTool,
  collapsed = false,
  onToggleCollapsed,
}: CanvasElementPaletteProps) {
  const { t } = useTranslation("document-type-relationships")
  const { t: tDiagrams } = useTranslation("diagrams")

  if (editor) {
    const tip = (key: string) => tDiagrams(`palette.tips.${key}`)
    // Colapsado no hay etiqueta visible: el title lleva nombre + atajo + descripción.
    const withHelp = (label: string, shortcut: string, tipKey: string) => {
      const description = tip(tipKey)
      return collapsed
        ? `${label}  ·  ${shortcut} — ${description.charAt(0).toLocaleLowerCase()}${description.slice(1)}`
        : description
    }
    const toolTitle = (label: string, shortcut: string) => (collapsed ? `${label}  ·  ${shortcut}` : undefined)

    return (
      <Panel position="top-left" style={{ margin: 16 }}>
        <div
          style={{ width: collapsed ? 40 : 156 }}
          className={cn(
            "flex flex-col gap-px overflow-hidden rounded-[11px] transition-[width] duration-[160ms] ease-out",
            collapsed ? "p-[5px]" : "p-1.5",
            CANVAS_SURFACE,
          )}
        >
          {collapsed ? (
            <>
              <button
                type="button"
                title={tDiagrams("palette.expandTitle")}
                aria-label={tDiagrams("palette.expandAria")}
                aria-expanded={false}
                onClick={onToggleCollapsed}
                className={cn(TOGGLE_CLASS, "h-[26px] w-[30px] self-center rounded-[7px]")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 7l5 5-5 5" />
                  <path d="M6 5v14" />
                </svg>
              </button>
              <div className="mx-1 mb-[3px] mt-0.5 h-px bg-[#e9edf2]" />
            </>
          ) : (
            <div className="flex items-center gap-1.5 pb-[5px] pl-2 pr-1 pt-0.5">
              <span className="flex-1 text-[11px] font-semibold text-[#475569]">
                {tDiagrams("palette.title")}
              </span>
              <button
                type="button"
                title={tDiagrams("palette.collapseTitle")}
                aria-label={tDiagrams("palette.collapseAria")}
                aria-expanded={true}
                onClick={onToggleCollapsed}
                className={cn(TOGGLE_CLASS, "h-[22px] w-[22px] rounded-md")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 7l-5 5 5 5" />
                  <path d="M18 5v14" />
                </svg>
              </button>
            </div>
          )}

          <ToolRow
            icon={Hand}
            label={t("canvas.palette.move")}
            title={toolTitle(t("canvas.palette.move"), "H") ?? tip("move")}
            shortcut="H"
            collapsed={collapsed}
            active={activeTool === "move"}
            onClick={() => onChangeTool?.("move")}
          />
          <ToolRow
            icon={MousePointer2}
            label={t("canvas.palette.select")}
            title={toolTitle(t("canvas.palette.select"), "V") ?? tip("select")}
            shortcut="V"
            collapsed={collapsed}
            active={activeTool === "select"}
            onClick={() => onChangeTool?.("select")}
          />

          {!collapsed && <GroupHeading>{tDiagrams("palette.groupAdd")}</GroupHeading>}
          <EditorPaletteRow kind="container" icon={Square} label={t("sidebar.container")} ariaLabel={t("canvas.addContainer")} title={withHelp(t("sidebar.container"), "C", "container")} shortcut="C" collapsed={collapsed} onAdd={onAdd} />
          <EditorPaletteRow kind="text" icon={Type} label={t("sidebar.text")} ariaLabel={t("canvas.addText")} title={withHelp(t("sidebar.text"), "T", "text")} shortcut="T" collapsed={collapsed} onAdd={onAdd} />
          {canAddRole && (
            <EditorPaletteRow kind="role" icon={Shield} label={t("sidebar.role")} ariaLabel={t("canvas.addRole")} title={withHelp(t("sidebar.role"), "R", "role")} shortcut="R" collapsed={collapsed} onAdd={onAdd} />
          )}

          {canAddFlow && (
            <>
              {collapsed ? (
                <div className="mx-1 my-[3px] h-px bg-[#e9edf2]" />
              ) : (
                <GroupHeading>{tDiagrams("palette.groupFlow")}</GroupHeading>
              )}
              <EditorPaletteRow kind="startEvent" icon={Circle} label={t("sidebar.startEvent")} ariaLabel={t("canvas.addStartEvent")} title={withHelp(t("sidebar.startEvent"), "1", "start")} shortcut="1" collapsed={collapsed} onAdd={onAdd} />
              <EditorPaletteRow kind="gateway" icon={Diamond} label={t("sidebar.gateway")} ariaLabel={t("canvas.addGateway")} title={withHelp(t("sidebar.gateway"), "2", "gateway")} shortcut="2" collapsed={collapsed} onAdd={onAdd} />
              <EditorPaletteRow kind="endEvent" icon={CircleDot} label={t("sidebar.endEvent")} ariaLabel={t("canvas.addEndEvent")} title={withHelp(t("sidebar.endEvent"), "3", "end")} shortcut="3" collapsed={collapsed} onAdd={onAdd} />
            </>
          )}

          {!collapsed && (
            <>
              <div className="mx-1 mb-[3px] mt-[5px] h-px bg-[#e9edf2]" />
              <p className="px-2 pb-[3px] text-[10.5px] leading-[1.4] text-[#94a3b8]">{tDiagrams("palette.note")}</p>
            </>
          )}
        </div>
      </Panel>
    )
  }

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

const TOGGLE_CLASS =
  "grid place-items-center border-0 bg-transparent font-[inherit] text-[#94a3b8] transition-colors hover:cursor-pointer hover:bg-[#f4f6f9] hover:text-[#334155] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

const ROW_CLASS =
  "flex items-center rounded-[7px] border-0 text-left font-[inherit] text-xs font-semibold select-none transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
const ROW_IDLE_CLASS = "bg-transparent text-[#475569] hover:bg-[#f4f6f9] hover:text-[#1d4ed8]"
const ROW_ACTIVE_CLASS = "bg-[#eef2ff] text-[#1d4ed8]"
// Expandido: fila de 29px a todo el ancho. Colapsado: botón de 30×30 centrado (sin gap:
// las etiquetas quedan en w-0/opacity-0 para que el fundido conviva con la transición de width).
const rowSize = (collapsed: boolean) =>
  collapsed ? "h-[30px] w-[30px] justify-center gap-0 self-center p-0" : "h-[29px] w-full gap-2 px-2"
const labelClass = (collapsed: boolean) =>
  cn("truncate transition-opacity duration-[120ms]", collapsed ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")
const keyClass = (collapsed: boolean) =>
  cn("text-[10px] font-semibold text-[#93a4c4] transition-opacity duration-[120ms]", collapsed ? "w-0 opacity-0" : "opacity-100")

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 pb-[3px] pt-2 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#a5aebc]">
      {children}
    </span>
  )
}

function ToolRow({
  icon: Icon,
  label,
  title,
  shortcut,
  collapsed,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  title: string
  shortcut: string
  collapsed: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(ROW_CLASS, rowSize(collapsed), "cursor-pointer", active ? ROW_ACTIVE_CLASS : ROW_IDLE_CLASS)}
    >
      <Icon className="h-4 w-4 flex-none" strokeWidth={1.8} />
      <span className={labelClass(collapsed)}>{label}</span>
      <span className={keyClass(collapsed)}>{shortcut}</span>
    </button>
  )
}

// El payload del MIME propio usa los `node_type` del backend (snake_case).
const DIAGRAM_ELEMENT_KIND: Record<CanvasElementKind | FlowCanvasNodeType, string> = {
  container: "container",
  text: "text",
  role: "role",
  startEvent: "start_event",
  gateway: "gateway",
  endEvent: "end_event",
}

/**
 * Fila de la paleta del cromo de editor. `div role="button"` en vez de `<button
 * draggable>`: el drag nativo sobre <button> es errático en WebKit.
 */
function EditorPaletteRow({
  kind,
  icon: Icon,
  label,
  ariaLabel,
  title,
  shortcut,
  collapsed,
  onAdd,
}: {
  kind: CanvasElementKind | FlowCanvasNodeType
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  ariaLabel: string
  title: string
  shortcut: string
  collapsed: boolean
  onAdd: (kind: CanvasElementKind | FlowCanvasNodeType) => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData("application/diagram-element", JSON.stringify({ kind: DIAGRAM_ELEMENT_KIND[kind] }))
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
      title={title}
      aria-label={ariaLabel}
      className={cn(ROW_CLASS, rowSize(collapsed), ROW_IDLE_CLASS, "cursor-grab active:cursor-grabbing")}
    >
      <Icon className="h-4 w-4 flex-none" strokeWidth={1.8} />
      <span className={labelClass(collapsed)}>{label}</span>
      <span className={keyClass(collapsed)}>{shortcut}</span>
    </div>
  )
}
