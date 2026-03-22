import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface PageHeaderBadge {
  label: string
  value: string | number
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export interface PageHeaderAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
  disabled?: boolean
  protectedContent?: ReactNode
}

export interface PageHeaderSearchConfig {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Minimum character length before onChange is emitted (0 = no minimum) */
  minLength?: number
  /** Debounce delay in ms before onChange fires (0 = no debounce) */
  debounceMs?: number
  /** Only emit onChange when the user presses Enter (clears still trigger immediately) */
  triggerOnEnter?: boolean
}

export interface PageHeaderProps {
  /** Icon component to display */
  icon: LucideIcon
  /** Page title */
  title: string
  /** Badges to display next to actions */
  badges?: PageHeaderBadge[]
  /** Show refresh button */
  showRefresh?: boolean
  /** Refresh button click handler */
  onRefresh?: () => void
  /** Is refreshing/loading state */
  isLoading?: boolean
  /** Primary action (Create/Add button) */
  primaryAction?: PageHeaderAction
  /** Additional custom actions */
  additionalActions?: PageHeaderAction[]
  /** Search configuration */
  searchConfig?: PageHeaderSearchConfig
  /** Has error state (affects badge display) */
  hasError?: boolean
  /** Custom content to render after badges/buttons */
  children?: ReactNode
}
