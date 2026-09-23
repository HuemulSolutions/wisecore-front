import * as React from "react"
import { cn } from "@/lib/utils"

export type HuemulNoticeTone = "amber" | "blue" | "red" | "green"

const TONE_CLASSES: Record<HuemulNoticeTone, string> = {
  amber: "border-[#fbe3a6] bg-[#fffcf3] text-[#8a5a00]",
  blue: "border-[#bfd3fb] bg-[#eef4ff] text-[#1d4ed8]",
  red: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
  green: "border-[#cdefd7] bg-[#eefbf1] text-[#15803d]",
}

export interface HuemulNoticeProps {
  tone: HuemulNoticeTone
  children: React.ReactNode
  /** Botón/link a la derecha (o debajo en pantallas angostas). */
  action?: React.ReactNode
  className?: string
}

/** Aviso en línea con tinte de color (ámbar/azul/rojo/verde). Texto ya traducido en `children`. */
export function HuemulNotice({ tone, children, action, className }: HuemulNoticeProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-[10px] border px-3.5 py-2.5 text-[12.5px] leading-snug",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  )
}
