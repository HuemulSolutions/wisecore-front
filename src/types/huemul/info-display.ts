import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type InfoLayout = "vertical" | "horizontal";

export type HuemulInfoItemVariant = "text" | "mono" | "badge";

export interface HuemulInfoItemProps {
  label: string;
  value?: string | number | ReactNode;
  icon?: LucideIcon;
  variant?: HuemulInfoItemVariant;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  copyable?: boolean;
  emptyText?: string;
  hideWhenEmpty?: boolean;
  layout?: InfoLayout;
  className?: string;
}

export interface HuemulInfoGroupProps {
  label?: string;
  items?: HuemulInfoItemProps[];
  children?: ReactNode;
  className?: string;
}

export interface HuemulInfoSectionProps {
  title: string;
  items?: HuemulInfoItemProps[];
  children?: ReactNode;
  className?: string;
}

export interface HuemulInfoDisplayProps {
  groups?: HuemulInfoGroupProps[];
  children?: ReactNode;
  className?: string;
}
