import { cn } from "@/lib/utils"

export interface HuemulInitialsAvatarProps {
  name: string
  /** Default 18. */
  size?: 18 | 20 | 24
  className?: string
}

const SIZE_CLASS: Record<NonNullable<HuemulInitialsAvatarProps["size"]>, string> = {
  18: "size-[18px] text-[8px]",
  20: "size-5 text-[9px]",
  24: "size-6 text-[10px]",
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return (first + last).toUpperCase()
}

/** Círculo de iniciales del autor de una fila de lista/historial — segundo consumidor tras `HuemulMasterDetailPane`. */
export function HuemulInitialsAvatar({ name, size = 18, className }: HuemulInitialsAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] font-semibold text-[#475569]",
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
