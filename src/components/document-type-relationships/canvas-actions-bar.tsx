"use client"

import { useTranslation } from "react-i18next"
import { Panel } from "@xyflow/react"
import { Eye, MoreHorizontal, Pencil, Plus, Save, Trash2, Workflow } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { CanvasActionsBarProps } from "@/types/document-type-relationships"

/**
 * Barra de acciones fija arriba a la derecha del canvas: siempre visible (nada
 * detrás de un dropdown salvo "Cargar diagrama"/"Limpiar canvas", que son
 * destructivas de trabajo no guardado). Presentacional pura — no conoce
 * permisos ni el modo del canvas: un handler `undefined` simplemente no se
 * renderiza (RBAC se resuelve en `relationships-canvas.tsx`).
 */
export function CanvasActionsBar({
  diagramName,
  isDirty,
  isSaving,
  isEmpty,
  compact,
  collapsed,
  onSaveChanges,
  onSaveAsNew,
  onEditMetadata,
  onLoadDiagram,
  onClearCanvas,
}: CanvasActionsBarProps) {
  const { t } = useTranslation("document-type-relationships")

  const hasAnyAction = !!(onSaveChanges || onSaveAsNew || onEditMetadata || onLoadDiagram || onClearCanvas)
  if (!hasAnyAction && !diagramName) return null

  const statusText = isDirty ? t("canvas.actions.unsavedChanges") : t("canvas.actions.allChangesSaved")

  if (collapsed) {
    return (
      <Panel position="top-right" style={{ margin: 12 }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HuemulButton
              variant="outline"
              size="icon-sm"
              className="relative shadow-sm"
              disabled={isSaving}
              tooltip={diagramName ?? t("canvas.actions.untitledDiagram")}
            >
              <Workflow className="h-3.5 w-3.5" />
              {isDirty && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-highlight" />
              )}
            </HuemulButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <ActionItems
              isDirty={isDirty}
              isSaving={isSaving}
              onSaveChanges={onSaveChanges}
              onSaveAsNew={onSaveAsNew}
              onEditMetadata={onEditMetadata}
              onLoadDiagram={onLoadDiagram}
              onClearCanvas={onClearCanvas}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel>
    )
  }

  // Con el canvas vacío, "Cargar diagrama" es la única acción útil de la pantalla:
  // se promueve a botón visible y el overflow queda solo con "Limpiar" (que no
  // tiene sentido sobre un canvas ya vacío, así que ni se muestra).
  if (isEmpty && onLoadDiagram) {
    return (
      <Panel position="top-right" style={{ margin: 12 }}>
        <HuemulButton
          variant="outline"
          size="sm"
          icon={Workflow}
          label={compact ? undefined : t("canvas.loadDiagram")}
          tooltip={compact ? t("canvas.loadDiagram") : undefined}
          className="shadow-sm text-xs"
          onClick={onLoadDiagram}
        />
      </Panel>
    )
  }

  return (
    <Panel position="top-right" style={{ margin: 12 }}>
      <div className="flex items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow-md backdrop-blur">
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            {isDirty && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-highlight" title={statusText} />
            )}
            <span
              className={compact ? "max-w-52 truncate text-sm font-semibold" : "max-w-88 truncate text-sm font-semibold"}
              title={diagramName}
            >
              {diagramName ?? t("canvas.actions.untitledDiagram")}
            </span>
          </div>
          {!compact && <span className="text-[11px] text-muted-foreground">{statusText}</span>}
        </div>

        <div className="h-8 w-px shrink-0 bg-border" />

        {onSaveAsNew && (
          <HuemulButton
            variant="outline"
            size={compact ? "icon-sm" : "sm"}
            icon={Plus}
            label={compact ? undefined : t("canvas.actions.saveAsNewShort")}
            tooltip={compact ? t("canvas.saveAsNewDiagram") : undefined}
            className="shadow-none text-xs"
            disabled={isSaving}
            onClick={onSaveAsNew}
          />
        )}
        {onSaveChanges && (
          <HuemulButton
            size={compact ? "icon-sm" : "sm"}
            icon={Save}
            label={compact ? undefined : t("canvas.saveChanges")}
            tooltip={compact ? t("canvas.saveChanges") : undefined}
            className="text-xs"
            loading={isSaving}
            disabled={!isDirty || isSaving}
            onClick={onSaveChanges}
          />
        )}
        {onEditMetadata && (
          <HuemulButton
            variant="ghost"
            size="icon-sm"
            icon={Pencil}
            tooltip={t("canvas.editDiagramData")}
            disabled={isSaving}
            onClick={onEditMetadata}
          />
        )}
        {(onLoadDiagram || onClearCanvas) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <HuemulButton
                variant="ghost"
                size="icon-sm"
                icon={MoreHorizontal}
                tooltip={t("canvas.actions.more")}
                disabled={isSaving}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <ActionItems
                isDirty={isDirty}
                isSaving={isSaving}
                onLoadDiagram={onLoadDiagram}
                onClearCanvas={onClearCanvas}
                overflowOnly
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Panel>
  )
}

/**
 * Items del `DropdownMenu`. `overflowOnly` se usa desde la barra ya expandida
 * (donde guardar/editar ya son botones visibles): solo agrega cargar/limpiar.
 * Sin `overflowOnly` (modo `collapsed`) se listan todas las acciones.
 */
function ActionItems({
  isDirty,
  isSaving,
  onSaveChanges,
  onSaveAsNew,
  onEditMetadata,
  onLoadDiagram,
  onClearCanvas,
  overflowOnly,
}: Pick<CanvasActionsBarProps, "isDirty" | "isSaving" | "onSaveChanges" | "onSaveAsNew" | "onEditMetadata" | "onLoadDiagram" | "onClearCanvas"> & {
  overflowOnly?: boolean
}) {
  const { t } = useTranslation("document-type-relationships")

  return (
    <>
      {!overflowOnly && onSaveChanges && (
        <DropdownMenuItem onSelect={onSaveChanges} disabled={!isDirty || isSaving} className="hover:cursor-pointer">
          <Save className="mr-2 h-4 w-4" />
          {t("canvas.saveChanges")}
        </DropdownMenuItem>
      )}
      {!overflowOnly && onSaveAsNew && (
        <DropdownMenuItem onSelect={onSaveAsNew} disabled={isSaving} className="hover:cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          {t("canvas.actions.saveAsNewShort")}
        </DropdownMenuItem>
      )}
      {!overflowOnly && onEditMetadata && (
        <DropdownMenuItem onSelect={onEditMetadata} disabled={isSaving} className="hover:cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          {t("canvas.editDiagramData")}
        </DropdownMenuItem>
      )}
      {!overflowOnly && (onSaveChanges || onSaveAsNew || onEditMetadata) && (onLoadDiagram || onClearCanvas) && (
        <DropdownMenuSeparator />
      )}
      {onLoadDiagram && (
        <DropdownMenuItem onSelect={onLoadDiagram} className="hover:cursor-pointer">
          <Workflow className="mr-2 h-4 w-4" />
          {t("canvas.loadDiagram")}
        </DropdownMenuItem>
      )}
      {onLoadDiagram && onClearCanvas && <DropdownMenuSeparator />}
      {onClearCanvas && (
        <DropdownMenuItem onSelect={onClearCanvas} className="hover:cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("canvas.clearAll")}
        </DropdownMenuItem>
      )}
    </>
  )
}

/** Chip "Solo lectura" — sustituye a `CanvasActionsBar` cuando `readOnly` es true. */
export function CanvasReadOnlyBadge() {
  const { t } = useTranslation("document-type-relationships")
  return (
    <Panel position="top-right" style={{ margin: 12 }}>
      <Badge variant="secondary" className="gap-1.5 shadow-sm">
        <Eye className="h-3 w-3" />
        {t("canvas.readOnly")}
      </Badge>
    </Panel>
  )
}
