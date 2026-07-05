"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
import type { HuemulComboboxOption, HuemulComboboxProps } from "@/types/huemul"

export type { HuemulComboboxOption, HuemulComboboxProps } from "@/types/huemul"

// ── Option rendering ─────────────────────────────────────────────────────────

/** Color dot + icon + label/description shown inside an item. */
function OptionContent({ option }: { option: HuemulComboboxOption }) {
  const Icon = option.icon
  return (
    <>
      {option.color && (
        <span
          className="shrink-0 size-3 rounded-full"
          style={{ backgroundColor: option.color }}
        />
      )}
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <div className="flex min-w-0 flex-col items-start">
        <span className="truncate">{option.label}</span>
        {option.description && (
          <span className="truncate text-xs text-muted-foreground">
            {option.description}
          </span>
        )}
      </div>
    </>
  )
}

/** Compact label (dot + text) shown in the trigger / chips. */
function SelectedLabel({ option }: { option: HuemulComboboxOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.color && (
        <span
          className="shrink-0 size-3 rounded-full"
          style={{ backgroundColor: option.color }}
        />
      )}
      <span className="truncate">{option.label}</span>
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function HuemulCombobox({
  id,
  value,
  onValueChange,
  multiSelect = false,
  options,
  fetchOptions,
  pageSize = 10,
  debounceMs = 300,
  searchOnEnter = false,
  staticOptions = [],
  staticOptionsLabel,
  asyncResultsLabel,
  selectedOptions = [],
  onSelectedLabelChange,
  placeholder,
  emptyMessage,
  disabled,
  error,
  className,
}: HuemulComboboxProps) {
  const { t } = useTranslation("common")
  const isAsync = typeof fetchOptions === "function"
  const hasError = !!error
  const anchorRef = useComboboxAnchor()

  const [open, setOpen] = React.useState(false)

  // ── Async state (only used when isAsync) ──────────────────────────────────
  const [items, setItems] = React.useState<HuemulComboboxOption[]>([])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)
  // Dueño exclusivo del efecto de fetch consolidado más abajo — ningún otro efecto
  // debe leerlo ni escribirlo (evita la carrera entre dos efectos independientes
  // reaccionando a la misma apertura del popup).
  const isFirstOpenRef = React.useRef(true)
  // Marca síncrona de "hay un fetch en curso" — a diferencia de isLoading/isLoadingMore
  // (useState), está disponible de inmediato para otros efectos que corran en la misma
  // pasada de commit (ver loadOptions y el efecto de auto-carga más abajo).
  const isFetchingRef = React.useRef(false)

  // ── Option cache: resolves value ids → option objects for display ─────────
  // Persists across async list resets so selected labels survive a closed popup.
  const cacheRef = React.useRef<Map<string, HuemulComboboxOption>>(new Map())
  const optionMap = React.useMemo(() => {
    const map = cacheRef.current
    for (const opt of [
      ...(options ?? []),
      ...staticOptions,
      ...selectedOptions,
      ...items,
    ]) {
      map.set(opt.value, opt)
    }
    return map
  }, [options, staticOptions, selectedOptions, items])

  const resolve = React.useCallback(
    (val: string): HuemulComboboxOption =>
      optionMap.get(val) ?? { value: val, label: val },
    [optionMap],
  )

  // ── Bridge string-id value ⇆ Base UI option-object value ──────────────────
  const singleValue =
    !multiSelect && typeof value === "string" && value ? resolve(value) : null
  const multiValue = multiSelect
    ? (Array.isArray(value) ? value : []).map(resolve)
    : []

  const handleSingleChange = React.useCallback(
    (next: HuemulComboboxOption | null) => {
      onValueChange(next ? next.value : "")
      onSelectedLabelChange?.(next?.label)
    },
    [onValueChange, onSelectedLabelChange],
  )

  const handleMultiChange = React.useCallback(
    (next: HuemulComboboxOption[]) => {
      onValueChange(next.map((o) => o.value))
      setSearch("")
    },
    [onValueChange],
  )

  // ── Async loading ─────────────────────────────────────────────────────────
  const loadOptions = React.useCallback(
    async (searchTerm: string, pageNum: number, append = false) => {
      if (!fetchOptions) return
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      const isPaginating = pageNum > 1
      if (isPaginating) setIsLoadingMore(true)
      else setIsLoading(true)
      try {
        const result = await fetchOptions({
          search: searchTerm,
          page: pageNum,
          pageSize,
        })
        setItems((prev) =>
          append ? [...prev, ...result.options] : result.options,
        )
        setHasMore(result.hasMore)
        setPage(pageNum)
      } catch (err) {
        console.error("HuemulCombobox: error fetching options:", err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
        isFetchingRef.current = false
      }
    },
    [fetchOptions, pageSize],
  )

  // Reset state when the popup closes, so the next open starts fresh.
  React.useEffect(() => {
    if (!isAsync || open) return
    setSearch("")
    setPage(1)
    setItems([])
    setHasMore(true)
    isFirstOpenRef.current = true
  }, [open, isAsync])

  // Única fuente de verdad para "cuándo hacer fetch": se dispara una vez, de inmediato,
  // la primera vez que se abre el popup, y luego (con debounce) cada vez que cambia el
  // texto de búsqueda. Consolidado en un solo efecto — antes eran dos efectos separados
  // reaccionando cada uno por su cuenta a la apertura del popup, lo que dejaba una
  // ventana de carrera (uno podía marcar isFirstOpenRef como "ya no es la carga inicial"
  // antes de que el otro leyera esa misma bandera) que terminaba disparando una segunda
  // petición duplicada.
  React.useEffect(() => {
    if (!isAsync || !open) return
    if (isFirstOpenRef.current) {
      isFirstOpenRef.current = false
      setHasMore(true)
      loadOptions(search, 1, false)
      return
    }
    if (searchOnEnter) return
    const timer = setTimeout(() => {
      setHasMore(true)
      loadOptions(search, 1, false)
    }, debounceMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search])

  const handleInputValueChange = React.useCallback((next: string) => {
    setSearch(next)
  }, [])

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (searchOnEnter && e.key === "Enter") {
        e.preventDefault()
        setHasMore(true)
        loadOptions(search, 1, false)
      }
    },
    [searchOnEnter, loadOptions, search],
  )

  const handleScroll = React.useCallback(() => {
    const list = listRef.current
    if (!list || isLoadingMore || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = list
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadOptions(search, page + 1, true)
    }
  }, [hasMore, isLoadingMore, loadOptions, page, search])

  // Auto-load next page when all current items fit without triggering a scroll event.
  React.useEffect(() => {
    if (!isAsync || !open || isLoading || isLoadingMore || !hasMore || isFetchingRef.current) return
    const list = listRef.current
    if (!list) return
    if (list.scrollHeight <= list.clientHeight) {
      loadOptions(search, page + 1, true)
    }
    // Re-evaluates whenever items change (after each page load) or the popup opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAsync, open, items, isLoading, isLoadingMore, hasMore])

  // ── Derived render data ───────────────────────────────────────────────────
  // Static mode renders the provided options as-is. NO client-side filtering.
  const listOptions = isAsync ? items : options ?? []
  const resolvedPlaceholder = placeholder ?? t("selectPlaceholder")
  const resolvedEmpty = emptyMessage ?? t("noResults")

  // Shared Root props. `filter={null}` disables Base UI's client-side filtering
  // in every mode (project rule: search is always server-side).
  const rootProps = {
    filter: null,
    disabled,
    open,
    onOpenChange: setOpen,
    isItemEqualToValue: (a: HuemulComboboxOption, b: HuemulComboboxOption) =>
      a?.value === b?.value,
    itemToStringLabel: (o: HuemulComboboxOption) => o?.label ?? "",
    itemToStringValue: (o: HuemulComboboxOption) => o?.value ?? "",
    ...(isAsync
      ? {
          onInputValueChange: handleInputValueChange,
          // Single-select uses the main input as display + search at once, so we
          // leave `inputValue` uncontrolled — Base UI shows the selected option's
          // label via `itemToStringLabel`. Multi-select keeps the in-popup search
          // input controlled (selection is shown as chips, not in the input).
          ...(multiSelect ? { inputValue: search } : {}),
        }
      : {}),
  } as Record<string, unknown>

  // ── Popup body ─────────────────────────────────────────────────────────────
  // In-popup search box — used by multi-select (single-select searches through
  // its own main input instead).
  const listBody = (
    <>
      <ComboboxList ref={listRef} onScroll={isAsync ? handleScroll : undefined}>
        {/* Pinned static options (async mode only) */}
        {isAsync && staticOptions.length > 0 && (
          <>
            {staticOptionsLabel && (
              <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {staticOptionsLabel}
              </p>
            )}
            {staticOptions.map((option) => (
              <ComboboxItem key={option.value} value={option}>
                <OptionContent option={option} />
              </ComboboxItem>
            ))}
            <div className="-mx-1 my-1 border-t border-border" />
            {asyncResultsLabel && (
              <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {asyncResultsLabel}
              </p>
            )}
          </>
        )}

        {/* Async loading / results / empty */}
        {isAsync && isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t("loading")}
            </span>
          </div>
        ) : listOptions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {resolvedEmpty}
          </p>
        ) : (
          listOptions.map((option) => (
            <ComboboxItem key={option.value} value={option}>
              <OptionContent option={option} />
            </ComboboxItem>
          ))
        )}

        {isAsync && isLoadingMore && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">
              {t("loadingMore")}
            </span>
          </div>
        )}
        {isAsync && !hasMore && listOptions.length > 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {t("noMoreResults")}
          </p>
        )}
      </ComboboxList>
    </>
  )

  // ── Multi-select (chips) ──────────────────────────────────────────────────
  if (multiSelect) {
    return (
      <Combobox
        multiple
        value={multiValue}
        onValueChange={handleMultiChange as never}
        {...(rootProps as object)}
      >
        <ComboboxChips
          ref={anchorRef}
          aria-invalid={hasError || undefined}
          className={cn("w-full hover:cursor-pointer", className)}
        >
          <ComboboxValue>
            {(selected: HuemulComboboxOption[]) => (
              <React.Fragment>
                {selected.map((option) => (
                  <ComboboxChip key={option.value}>
                    <SelectedLabel option={option} />
                  </ComboboxChip>
                ))}
                {isAsync ? (
                  <ComboboxChipsInput
                    placeholder={selected.length === 0 ? resolvedPlaceholder : undefined}
                    onKeyDown={handleInputKeyDown}
                  />
                ) : selected.length === 0 ? (
                  <span className="px-1 text-sm text-muted-foreground">
                    {resolvedPlaceholder}
                  </span>
                ) : null}
              </React.Fragment>
            )}
          </ComboboxValue>
          <ComboboxTrigger
            id={id}
            className="ml-auto shrink-0 hover:cursor-pointer"
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef}>
          {listBody}
        </ComboboxContent>
      </Combobox>
    )
  }

  // ── Single-select (input + clear) ───────────────────────────────────────────
  // The main input doubles as the selected-value display and the search box. Base
  // UI fills it with the selected option's label (via `itemToStringLabel`); the ✕
  // (showClear) clears the value and the chevron reappears.
  return (
    <Combobox
      value={singleValue}
      onValueChange={handleSingleChange as never}
      {...(rootProps as object)}
    >
      <div ref={anchorRef} className="w-full">
        <ComboboxInput
          id={id}
          showClear
          readOnly={!isAsync}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          aria-invalid={hasError || undefined}
          onKeyDown={handleInputKeyDown}
          className={cn("w-full", className)}
        >
          {singleValue?.color && (
            <InputGroupAddon align="inline-start">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: singleValue.color }}
              />
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={anchorRef}>{listBody}</ComboboxContent>
    </Combobox>
  )
}
