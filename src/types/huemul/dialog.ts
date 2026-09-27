import * as React from "react"
import type { LucideIcon } from "lucide-react"

export interface HuemulDialogFooterAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
  closeOnSuccess?: boolean;
}

export interface HuemulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  showCloseButton?: boolean;
  bodyLoading?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  saveAction?: HuemulDialogFooterAction;
  extraActions?: HuemulDialogFooterAction[];
  closeDelay?: number;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  footerLeft?: React.ReactNode;
  children: React.ReactNode;
}
