import { RefreshCw, Plus } from "lucide-react"
import { HuemulButton } from "./huemul-button"
import { HuemulField } from "./huemul-field"
import { useTranslation } from "react-i18next"
import { useState, useEffect, useRef } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import type { PageHeaderProps } from "@/types/huemul"

export type { PageHeaderBadge, PageHeaderAction, PageHeaderSearchConfig, PageHeaderProps } from "@/types/huemul"

// Paleta de acento para los iconos de las acciones secundarias: permite
// distinguir cada acción de un vistazo sin romper el estilo outline del botón.
const ACTION_ICON_COLORS = [
  "text-blue-600",
  "text-violet-600",
  "text-green-600",
  "text-amber-600",
]

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  badges = [],
  showRefresh = true,
  onRefresh,
  isLoading = false,
  primaryAction,
  additionalActions = [],
  searchConfig,
  hasError = false,
  children,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation('common')

  // Internal input state for immediate display (decoupled from debounced parent state)
  const [inputValue, setInputValue] = useState(searchConfig?.value ?? "")
  const debouncedSearch = useDebounce(inputValue, searchConfig?.debounceMs ?? 0)
  const isSearchMounted = useRef(false)

  // Sync parent reset: when parent explicitly clears to "", clear local input too
  useEffect(() => {
    if (searchConfig?.value === "" && inputValue !== "") {
      setInputValue("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchConfig?.value])

  // Emit onChange when debounced value changes, respecting minLength (only when NOT triggerOnEnter)
  useEffect(() => {
    if (!isSearchMounted.current) {
      isSearchMounted.current = true
      return
    }
    if (!searchConfig?.onChange || searchConfig.triggerOnEnter) return
    const minLen = searchConfig.minLength ?? 0
    if (debouncedSearch.length === 0 || debouncedSearch.length >= minLen) {
      searchConfig.onChange(debouncedSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchConfig?.triggerOnEnter && e.key === "Enter") {
      const minLen = searchConfig.minLength ?? 0
      if (inputValue.length === 0 || inputValue.length >= minLen) {
        searchConfig.onChange(inputValue)
      }
    }
    searchConfig?.onKeyDown?.(e)
  }

  // Las badges dejan de renderizarse como pills: se integran como texto en la
  // línea de subtítulo (junto a `subtitle`, si viene) para liberar espacio
  // horizontal en el bloque de acciones, que ahora comparte una sola fila con
  // el buscador.
  const badgeText = badges
    .map((badge) => {
      const value = hasError && badge.value !== "..." ? 0 : badge.value
      return badge.label ? `${badge.label}: ${value}` : String(value)
    })
    .join(" · ")
  const subtitleLine = [subtitle, badgeText].filter(Boolean).join(" · ")

  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Single row: title block left, controls right (wraps to column on mobile) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Title Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
            {subtitleLine && (
              <p className="text-xs text-muted-foreground">{subtitleLine}</p>
            )}
          </div>
        </div>

        {/* Controls Section: filters/children, search, refresh, actions, primary */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {children}

          {searchConfig && (
            <div className="w-full sm:w-64" onKeyDown={handleSearchKeyDown}>
              <HuemulField
                label=""
                placeholder={searchConfig.placeholder}
                value={inputValue}
                onChange={(value) => {
                  const next = String(value)
                  setInputValue(next)
                  // When cleared, fire immediately so results reset
                  if (next === "") {
                    searchConfig.onChange("")
                  }
                }}
                inputClassName="h-8 text-xs bg-white"
              />
            </div>
          )}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              iconClassName="w-3 h-3 mr-1 text-muted-foreground"
              label={t('refresh')}
              loading={isLoading}
              onClick={onRefresh}
              className="h-8 text-xs px-2"
            />
          )}

          {/* Additional Actions */}
          {additionalActions.map((action, index) => {
            const ActionIcon = action.icon || Plus
            const iconColor = ACTION_ICON_COLORS[index % ACTION_ICON_COLORS.length]
            const button = (
              <HuemulButton
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                icon={ActionIcon}
                iconClassName={cn("w-3 h-3 mr-1", iconColor)}
                label={action.label}
                onClick={action.onClick}
                disabled={action.disabled || hasError}
                className="h-8 text-xs px-2"
              />
            )

            return action.protectedContent ? (
              <div key={index}>
                {action.protectedContent}
              </div>
            ) : button
          })}

          {/* Primary Action */}
          {primaryAction && (
            <>
              {primaryAction.protectedContent ? (
                primaryAction.protectedContent
              ) : (
                <HuemulButton
                  size="sm"
                  variant={primaryAction.variant || "default"}
                  icon={primaryAction.icon || Plus}
                  iconClassName="w-3 h-3 mr-1"
                  label={primaryAction.label}
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || hasError}
                  className="h-8 text-xs px-2"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
