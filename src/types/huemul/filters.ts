import type { ReactNode } from 'react'

export interface HuemulFiltersProps {
  children: ReactNode;
  title?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onApply?: () => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}
