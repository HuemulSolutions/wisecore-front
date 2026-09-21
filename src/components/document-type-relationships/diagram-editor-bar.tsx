"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Panel } from "@xyflow/react"
import { Copy, Download, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, Eraser } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"

export interface DiagramEditorBarProps {
  diagramName?: string
  isDirty: boolean
  isSaving: boolean
  // Handler `undefined` = acción no permitida/no aplicable ⇒ el ítem NO se
  // renderiza (nunca deshabilitado), mismo criterio que `CanvasActionsBar`.
  onSave?: () => void
  onRename?: (name: string) => Promise<void> | void
  onSaveAsNew?: () => void
  onEditMetadata?: () => void
  onDuplicate?: () => void
  onExportImage?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  onClear?: () => void
  onDelete?: () => void
}

/**
 * Barra flotante centrada arriba del canvas de /diagrams (`chrome="editor"`).
 * Presentacional pura: no conoce permisos ni el modo del canvas — se resuelven
 * en `relationships-canvas.tsx`. `CanvasActionsBar` queda intacta para las demás
 * superficies del canvas.
 */
export function DiagramEditorBar({
  diagramName,
  isDirty,
  isSaving,
  onSave,
  onRename,
  onSaveAsNew,
  onEditMetadata,
  onDuplicate,
  onExportImage,
  onRefresh,
  isRefreshing,
  onClear,
  onDelete,
}: DiagramEditorBarProps) {
  const { t } = useTranslation("diagrams")
  const [isRenaming, setIsRenaming] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const displayName = diagramName ?? t("bar.untitled")

  useEffect(() => {
    if (isRenaming) inputRef.current?.select()
  }, [isRenaming])

  const startRename = () => {
    if (!onRename || !diagramName || isSaving) return
    setDraft(diagramName)
    setIsRenaming(true)
  }

  const commitRename = async () => {
    const next = draft.trim()
    setIsRenaming(false)
    if (!onRename || !next || next === diagramName) return
    await onRename(next)
  }

  const status = isSaving ? "saving" : isDirty ? "unsaved" : "saved"
  const hasMenu = !!(onSaveAsNew || onEditMetadata || onDuplicate || onExportImage || onRefresh || onClear || onDelete)
  const hasEditGroup = !!(onSaveAsNew || onEditMetadata || onDuplicate)
  const hasUtilGroup = !!(onExportImage || onRefresh)
  const hasDangerGroup = !!(onClear || onDelete)

  return (
    <Panel position="top-center" style={{ margin: 16 }}>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-[#e3e8ee] bg-white pl-3.5 pr-2 shadow-[0_6px_20px_rgba(15,23,42,0.10)]">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={120}
            aria-label={t("bar.renameLabel")}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setIsRenaming(false)
              // El canvas escucha atajos globales: escribir no debe crear nodos.
              e.stopPropagation()
            }}
            className="h-7 w-[200px] rounded-md border border-[#dbe1e9] bg-white px-2 text-[13.5px] font-semibold text-[#0f172a] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        ) : (
          <div
            className="max-w-[220px] min-w-0"
            onDoubleClick={startRename}
            title={onRename && diagramName ? t("bar.rename") : undefined}
          >
            <HuemulTruncatedText text={displayName} className="text-[13.5px] font-semibold text-[#0f172a]" />
          </div>
        )}

        <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-slate-400">
          {status === "unsaved" && <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />}
          {status === "saved" && <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />}
          {t(`bar.${status}`)}
        </span>

        {(onSave || hasMenu) && <div className="h-[22px] w-px shrink-0 bg-[#e9edf2]" />}

        {onSave && (
          <HuemulButton
            size="sm"
            className="h-[30px] rounded-lg bg-[#2563eb] px-3 text-[12.5px] font-semibold hover:bg-[#1d4ed8]"
            label={t("bar.save")}
            loading={isSaving}
            disabled={!isDirty || isSaving}
            onClick={onSave}
          />
        )}

        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-[30px] w-[30px]"
                icon={MoreHorizontal}
                tooltip={t("bar.more")}
                aria-label={t("bar.more")}
                disabled={isSaving}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {onSaveAsNew && (
                <DropdownMenuItem onSelect={onSaveAsNew} className="hover:cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("bar.saveAsNew")}
                </DropdownMenuItem>
              )}
              {onEditMetadata && (
                <DropdownMenuItem onSelect={onEditMetadata} className="hover:cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("bar.editData")}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onSelect={onDuplicate} className="hover:cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  {t("bar.duplicate")}
                </DropdownMenuItem>
              )}
              {hasEditGroup && hasUtilGroup && <DropdownMenuSeparator />}
              {onExportImage && (
                <DropdownMenuItem onSelect={onExportImage} className="hover:cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  {t("bar.exportImage")}
                </DropdownMenuItem>
              )}
              {onRefresh && (
                <DropdownMenuItem
                  onSelect={onRefresh}
                  disabled={isRefreshing}
                  className="hover:cursor-pointer"
                >
                  <RefreshCw className={isRefreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                  {t("bar.refresh")}
                </DropdownMenuItem>
              )}
              {(hasEditGroup || hasUtilGroup) && hasDangerGroup && <DropdownMenuSeparator />}
              {onClear && (
                <DropdownMenuItem
                  onSelect={onClear}
                  className="hover:cursor-pointer text-destructive focus:text-destructive"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  {t("bar.clear")}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="hover:cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("bar.delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Panel>
  )
}
