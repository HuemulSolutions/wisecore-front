import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus } from "lucide-react"
import { HuemulButton } from "./huemul-button"
import { HuemulField } from "./huemul-field"
import { useTranslation } from "react-i18next"
import type { PageHeaderProps } from "@/types/page-header"

export type { PageHeaderBadge, PageHeaderAction, PageHeaderSearchConfig, PageHeaderProps } from "@/types/page-header"

export function PageHeader({
  icon: Icon,
  title,
  badges = [],
  showRefresh = true,
  onRefresh,
  isLoading = false,
  primaryAction,
  additionalActions = [],
  searchConfig,
  hasError = false,
  children
}: PageHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-4 mb-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title Section */}
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2">
          {/* Badges */}
          {badges.map((badge, index) => (
            <Badge 
              key={index}
              variant={badge.variant || "outline"} 
              className="text-xs px-2 py-1"
            >
              {badge.label && `${badge.label}: `}{hasError && badge.value !== "..." ? 0 : badge.value}
            </Badge>
          ))}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              iconClassName="w-3 h-3 mr-1"
              label={t('refresh')}
              loading={isLoading}
              onClick={onRefresh}
              className="h-8 text-xs px-2"
            />
          )}

          {/* Additional Actions */}
          {additionalActions.map((action, index) => {
            const ActionIcon = action.icon || Plus
            const button = (
              <HuemulButton
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                icon={ActionIcon}
                iconClassName="w-3 h-3 mr-1"
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

          {/* Custom Children */}
          {!searchConfig && children}
        </div>
      </div>

      {/* Search Row */}
      {searchConfig && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 w-full" onKeyDown={searchConfig.onKeyDown}>
            <HuemulField
              label=""
              placeholder={searchConfig.placeholder}
              value={searchConfig.value}
              onChange={(value) => searchConfig.onChange(String(value))}
              inputClassName="h-8 text-xs bg-white"
            />
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
