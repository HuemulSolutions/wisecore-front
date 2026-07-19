import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface HuemulSheetAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  closeOnSuccess?: boolean;
  position?: "header" | "footer";
}

export interface HuemulSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  bodyLoading?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  saveAction?: HuemulSheetAction;
  extraActions?: HuemulSheetAction[];
  closeDelay?: number;
  side?: "top" | "right" | "bottom" | "left";
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}
