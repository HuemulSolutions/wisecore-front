import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RefreshCw, Plus, Search } from "lucide-react"
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
            <Button 
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="hover:cursor-pointer h-8 text-xs px-2"
            >
              {isLoading ? (
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Refresh
            </Button>
          )}

          {/* Additional Actions */}
          {additionalActions.map((action, index) => {
            const ActionIcon = action.icon || Plus
            const button = (
              <Button 
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || hasError}
                className="hover:cursor-pointer h-8 text-xs px-2"
              >
                <ActionIcon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
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
                <Button 
                  size="sm"
                  variant={primaryAction.variant || "default"}
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || hasError}
                  className="hover:cursor-pointer h-8 text-xs px-2"
                >
                  {primaryAction.icon && <primaryAction.icon className="w-3 h-3 mr-1" />}
                  {!primaryAction.icon && <Plus className="w-3 h-3 mr-1" />}
                  {primaryAction.label}
                </Button>
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
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder={searchConfig.placeholder}
              value={searchConfig.value}
              onChange={(e) => searchConfig.onChange(e.target.value)}
              onKeyDown={searchConfig.onKeyDown}
              className="pl-7 h-8 text-xs bg-white"
            />
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
