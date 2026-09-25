"use client"

import * as React from "react"
import { Plus, Loader2, ExternalLink } from "lucide-react"

import { cn, normalizeForSearch } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip"
import type { HuemulTagPickerProps, HuemulTagPickerTag } from "@/types/huemul"

export type { HuemulTagPickerProps, HuemulTagPickerTag } from "@/types/huemul"

type TagState = "all" | "partial" | "none"

const MAX_VISIBLE_CHIPS = 2

function sortByName(tags: HuemulTagPickerTag[]): HuemulTagPickerTag[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * `HuemulTagPicker` — popover genérico para asignar/quitar etiquetas de uno o
 * varios objetos, con multi-selección sin cierre, búsqueda server-side,
 * navegación por teclado y creación en línea. Sin dependencias de dominio: no
 * sabe qué es un "documento" ni qué es un `object_type` — eso lo resuelve el
 * caller (ver `TagsObjectPicker` en `src/components/tags`).
 *
 * Tres variantes de presentación sobre el mismo núcleo:
 * - `field`: chips + botón punteado "Añadir etiqueta", para una vista de detalle.
 * - `cell`: chips compactos (máx. 2 + "+N") + disparador circular, para una celda de tabla.
 * - `bulk`: un solo botón que abre el popover en modo tri-estado sobre `targets.length` objetos.
 *
 * El estado por etiqueta (asignada a todos / a algunos / a ninguno) se deriva
 * de `targets` en los tres modos: en `field`/`cell` (un solo target) sólo son
 * posibles "todas" o "ninguna", que es exactamente el toggle simple.
 *
 * @example
 * ```tsx
 * <HuemulTagPicker
 *   variant="field"
 *   targets={[{ id: documentId, tagIds: assignedTags.map(t => t.id) }]}
 *   canAssign={canAssign}
 *   canCreate={canCreate}
 *   fetchTags={fetchTags}
 *   assignedTags={assignedTags}
 *   onAssign={onAssign}
 *   onUnassign={onUnassign}
 *   onCreate={onCreate}
 *   labels={labels}
 * />
 * ```
 */
export function HuemulTagPicker({
  targets,
  variant,
  canCreate,
  canAssign,
  fetchTags,
  assignedTags,
  onAssign,
  onUnassign,
  onCreate,
  manageHref,
  disabled = false,
  className,
  labels,
}: HuemulTagPickerProps) {
  const listboxId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<HuemulTagPickerTag[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const requestIdRef = React.useRef(0)
  const isFirstOpenRef = React.useRef(true)

  const targetIds = React.useMemo(() => targets.map((target) => target.id), [targets])

  // Fetch: inmediato al abrir, debounce 250ms en cada cambio de búsqueda posterior.
  React.useEffect(() => {
    if (!open) {
      isFirstOpenRef.current = true
      return
    }
    const id = ++requestIdRef.current
    setIsLoading(true)
    const delay = isFirstOpenRef.current ? 0 : 250
    isFirstOpenRef.current = false
    const timer = setTimeout(() => {
      fetchTags({ search, page: 1, pageSize: 50 })
        .then((res) => {
          if (requestIdRef.current !== id) return
          setItems(res.tags)
        })
        .finally(() => {
          if (requestIdRef.current === id) setIsLoading(false)
        })
    }, delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search])

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setActiveIndex(-1)
      setCreateError(null)
    }
  }, [open])

  // Las asignadas siempre visibles aunque no vengan en la página del catálogo.
  const combinedList = React.useMemo(() => {
    const map = new Map<string, HuemulTagPickerTag>()
    for (const tag of assignedTags) map.set(tag.id, tag)
    for (const tag of items) map.set(tag.id, tag)
    return sortByName([...map.values()])
  }, [items, assignedTags])

  const normalizedSearch = normalizeForSearch(search.trim())
  const exactMatch = normalizedSearch.length > 0
    && combinedList.some((tag) => normalizeForSearch(tag.name) === normalizedSearch)
  const showCreateOption = canCreate && search.trim().length > 0 && !exactMatch

  const getTagState = React.useCallback(
    (tagId: string): TagState => {
      if (targetIds.length === 0) return "none"
      const assignedCount = targets.filter((target) => target.tagIds.includes(tagId)).length
      if (assignedCount === 0) return "none"
      if (assignedCount === targetIds.length) return "all"
      return "partial"
    },
    [targets, targetIds],
  )

  const handleToggle = React.useCallback(
    async (tag: HuemulTagPickerTag) => {
      if (!canAssign || disabled) return
      const state = getTagState(tag.id)
      setPendingIds((prev) => new Set(prev).add(tag.id))
      try {
        if (state === "all") {
          await onUnassign(tag.id, targetIds)
        } else {
          await onAssign(tag, targetIds)
        }
      } catch {
        // el error ya se muestra vía el toast global de mutations
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(tag.id)
          return next
        })
      }
    },
    [canAssign, disabled, getTagState, onAssign, onUnassign, targetIds],
  )

  const handleRemove = React.useCallback(
    (tag: HuemulTagPickerTag) => {
      void handleToggle(tag)
    },
    [handleToggle],
  )

  const handleCreate = React.useCallback(async () => {
    const name = search.trim()
    if (!name || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const tag = await onCreate(name)
      await onAssign(tag, targetIds)
      setSearch("")
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : labels.duplicateName)
    } finally {
      setCreating(false)
    }
  }, [creating, labels.duplicateName, onAssign, onCreate, search, targetIds])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, combinedList.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < combinedList.length) {
        void handleToggle(combinedList[activeIndex])
      } else if (showCreateOption) {
        void handleCreate()
      }
    }
  }

  const isBulk = variant === "bulk"
  const readOnly = !canAssign

  const popoverContent = (
    <PopoverContent className="w-80 p-0" align="start">
      {isBulk && (
        <div className="border-b px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{labels.applyingTo(targetIds.length)}</p>
          <p>{labels.partialHint}</p>
        </div>
      )}
      <div className="flex items-center border-b px-3">
        <Input
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          autoFocus
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-9"
        />
        {isLoading && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
      </div>
      <div
        id={listboxId}
        role="listbox"
        aria-multiselectable
        className="max-h-60 overflow-y-auto p-1"
        onWheel={(e) => e.stopPropagation()}
      >
        {combinedList.length === 0 && !isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {canCreate ? labels.noResults : labels.noResultsCannotCreate}
          </p>
        ) : (
          combinedList.map((tag, index) => {
            const state = getTagState(tag.id)
            const isPending = pendingIds.has(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                role="option"
                aria-selected={state !== "none"}
                aria-checked={state === "partial" ? "mixed" : state === "all"}
                disabled={isPending}
                className={cn(
                  "relative flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm outline-none select-none hover:cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  index === activeIndex && "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleToggle(tag)}
              >
                <Checkbox
                  checked={state === "partial" ? "indeterminate" : state === "all"}
                  disabled={isPending}
                  tabIndex={-1}
                />
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color || undefined }}
                />
                <span className="flex-1 truncate text-left">{tag.name}</span>
                {state === "partial" && (
                  <span className="text-[10px] text-muted-foreground">{labels.partialLabel}</span>
                )}
                {typeof tag.usageCount === "number" && (
                  <span className="text-xs text-muted-foreground tabular-nums">{tag.usageCount}</span>
                )}
                {isPending && <Loader2 className="size-3 shrink-0 animate-spin" />}
              </button>
            )
          })
        )}
      </div>
      <div className="space-y-1.5 border-t px-3 py-2">
        {showCreateOption && (
          <button
            type="button"
            disabled={creating}
            className="flex w-full items-center gap-1.5 rounded-sm px-1 py-1 text-left text-sm text-primary hover:cursor-pointer hover:underline disabled:opacity-50"
            onClick={() => void handleCreate()}
          >
            {creating ? <Loader2 className="size-3.5 shrink-0 animate-spin" /> : <Plus className="size-3.5 shrink-0" />}
            <span className="truncate">{labels.createAndAssign(search.trim())}</span>
          </button>
        )}
        {!canCreate && search.trim().length > 0 && !exactMatch && (
          <p className="text-xs text-muted-foreground">{labels.noResultsCannotCreate}</p>
        )}
        {createError && (
          <p className="text-xs text-destructive">{createError}</p>
        )}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{labels.keyboardHint}</span>
          {manageHref && (
            <a
              href={manageHref}
              className="inline-flex items-center gap-1 hover:cursor-pointer hover:text-foreground hover:underline"
            >
              {labels.manageTags}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </PopoverContent>
  )

  if (readOnly) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {assignedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">{labels.empty}</span>
        ) : (
          assignedTags.map((tag) => (
            <HuemulTagChip key={tag.id} label={tag.name} color={tag.color} size={variant === "cell" ? "sm" : "md"} />
          ))
        )}
      </div>
    )
  }

  if (variant === "cell") {
    const visible = assignedTags.slice(0, MAX_VISIBLE_CHIPS)
    const extra = assignedTags.length - visible.length
    return (
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
        {visible.map((tag) => (
          <HuemulTagChip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            size="sm"
            onRemove={() => handleRemove(tag)}
            removeLabel={labels.removeTag(tag.name)}
          />
        ))}
        {extra > 0 && (
          <span className="text-xs text-muted-foreground">{labels.moreCount(extra)}</span>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label={labels.addTag}
              className="size-5 shrink-0 rounded-full hover:cursor-pointer"
            >
              <Plus className="size-3" />
            </Button>
          </PopoverTrigger>
          {popoverContent}
        </Popover>
      </div>
    )
  }

  if (isBulk) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled} className="hover:cursor-pointer">
            {labels.addTag}
          </Button>
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    )
  }

  // variant === "field"
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {assignedTags.map((tag) => (
        <HuemulTagChip
          key={tag.id}
          label={tag.name}
          color={tag.color}
          onRemove={() => handleRemove(tag)}
          removeLabel={labels.removeTag(tag.name)}
        />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:cursor-pointer hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-3" />
            {labels.addTag}
          </button>
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    </div>
  )
}
