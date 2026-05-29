import * as React from "react"
import type { LucideIcon } from "lucide-react"
import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/button"
import type { LifecyclePermissions } from "@/types/assets"

export interface HuemulButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  label?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  iconClassName?: string;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  asChild?: boolean;
  requiredAccess?: string | string[];
  requireAll?: boolean;
  checkGlobalPermissions?: boolean;
  resource?: string;
  lifecyclePermissions?: LifecyclePermissions;
}
