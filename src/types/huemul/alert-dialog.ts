import type { LucideIcon } from 'lucide-react'

export type ActionState = "idle" | "loading" | "success";

export interface HuemulAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  actionLabel?: string;
  onAction: () => Promise<void>;
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  actionIcon?: LucideIcon;
  cancelLabel?: string;
  successDelay?: number;
  className?: string;
}
