// Piezas visuales del soporte de carpetas de `HuemulTable` (prop `folders`). Separadas
// del componente principal porque son puramente presentacionales — ver
// `ia context/tabla-agrupada-drag-and-drop-guide.md` para el patrón completo.
import type { ReactNode } from "react"
import { ChevronRight, Folder, FolderOpen, FolderPlus, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { HuemulButton } from "./huemul-button"

// ─── Celda de nombre de una fila de carpeta ────────────────────────────────

export function FolderNameCell({
  name,
  open,
  onToggle,
  isEditing,
  editValue,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  isSavingEdit,
  editError,
  countLabel,
}: {
  name: string
  open: boolean
  onToggle: () => void
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onEditSubmit: () => void
  onEditCancel: () => void
  isSavingEdit: boolean
  editError: string | null
  countLabel: ReactNode
}) {
  if (isEditing) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            defaultValue={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onEditSubmit() }
              if (e.key === "Escape") { e.preventDefault(); onEditCancel() }
            }}
            onBlur={onEditSubmit}
            disabled={isSavingEdit}
            className="h-7 min-w-0 flex-1 rounded border border-input bg-background px-2 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          {isSavingEdit && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        {editError && <span className="pl-6 text-[11px] text-destructive">{editError}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      aria-expanded={open}
      className="flex min-w-0 flex-1 items-center gap-2 text-left hover:cursor-pointer"
    >
      <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      {open ? (
        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate font-semibold text-foreground">{name}</span>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{countLabel}</span>
    </button>
  )
}

// ─── Formulario de creación de carpeta (una sola instancia, ancla fija) ────

export function FolderCreateForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSaving,
  error,
  placeholder,
  createLabel,
  cancelLabel,
  hint,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
  placeholder: string
  createLabel: string
  cancelLabel: string
  hint: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <FolderPlus className="h-4 w-4 shrink-0 text-primary" />
        <input
          autoFocus
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onSubmit() }
            if (e.key === "Escape") { e.preventDefault(); onCancel() }
          }}
          disabled={isSaving}
          placeholder={placeholder}
          className="h-8 min-w-0 flex-1 rounded-md border-2 border-primary bg-background px-2.5 text-sm text-foreground outline-none"
        />
        <HuemulButton size="sm" onClick={onSubmit} disabled={isSaving} className="h-8">
          {createLabel}
        </HuemulButton>
        <HuemulButton variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="h-8">
          {cancelLabel}
        </HuemulButton>
        {isSaving && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">{hint}</span>
      </div>
      {error && <span className="pl-6 text-[11px] text-destructive">{error}</span>}
    </div>
  )
}

// ─── Franja "+ Nueva carpeta" superpuesta al borde superior de una fila ────
// pointer-events-none por defecto: sin esto el botón absoluto capturaba el mousedown
// del handle de arrastre de la fila vecina y el drag no arrancaba ahí (bug ya
// documentado en la implementación anterior de assets-types-table.tsx). Requiere que
// el contenedor (la celda `primary`) tenga las clases `group/row relative`.
export function InsertFolderStrip({
  isDragActive,
  onOpen,
  label,
}: {
  isDragActive: boolean
  onOpen: () => void
  label: string
}) {
  if (isDragActive) return null

  return (
    <div
      className={cn(
        "pointer-events-none absolute -top-2 left-0 right-2 z-10 flex h-4 items-center gap-2",
        "opacity-0 transition-opacity group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
      )}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen() }}
        className="flex h-[18px] shrink-0 items-center gap-1 rounded-full bg-primary px-2 text-[10.5px] font-medium text-primary-foreground hover:cursor-pointer"
      >
        <Plus className="h-2.5 w-2.5" />
        {label}
      </button>
      <div className="h-px flex-1 bg-primary/40" />
    </div>
  )
}

// ─── Fila fantasma "+ Nueva carpeta" al final del cuerpo de la tabla ───────

export function AddFolderRow({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-muted-foreground hover:cursor-pointer hover:bg-muted/30 hover:text-primary"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

// ─── Hint de carpeta vacía ──────────────────────────────────────────────────

export function EmptyFolderHint({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
      {label}
    </span>
  )
}
