import * as React from "react"
import { cn } from "@/lib/utils"

/** Clases del control: 38px, radio 9px, foco azul con halo. `hasError` pinta el borde `#f3a19a`. */
function controlClass(hasError: boolean, mono: boolean, extra?: string) {
  return cn(
    "w-full rounded-[9px] border bg-white px-3 text-[13.5px] text-[#0f172a] outline-none transition-colors placeholder:text-[#9aa6b5] disabled:cursor-not-allowed disabled:bg-[#f7f9fb] disabled:text-[#7c8798]",
    "focus:border-[#2563eb] focus:shadow-[0_0_0_3px_#dbe7fe]",
    hasError ? "border-[#f3a19a]" : "border-[#dfe4ec]",
    mono && "font-mono text-[13px]",
    extra,
  )
}

export interface HuemulSheetFieldProps {
  label: string
  /** Texto de ayuda; se reemplaza por `error` cuando este viene definido. */
  help?: React.ReactNode
  error?: string
  /** Nodo a la derecha de la etiqueta (ej. link "¿Dónde la encuentro?"). */
  labelAction?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

/**
 * Campo de formulario de sheet: etiqueta + control + ayuda. Cuando hay `error`
 * el texto de ayuda se reemplaza por el error en rojo (`#d92d20`).
 */
export function HuemulSheetField({ label, help, error, labelAction, htmlFor, children, className }: HuemulSheetFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-[#0f172a]">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-[#d92d20]">{error}</p>
      ) : help ? (
        <p className="text-xs text-[#7c8798]">{help}</p>
      ) : null}
    </div>
  )
}

export interface HuemulSheetInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  hasError?: boolean
  /** Fuente monoespaciada para identificadores, endpoints, claves y precios. */
  mono?: boolean
  /** Texto fijo a la izquierda del valor (ej. `US$`). */
  prefix?: string
}

export const HuemulSheetInput = React.forwardRef<HTMLInputElement, HuemulSheetInputProps>(
  function HuemulSheetInput({ hasError = false, mono = false, prefix, className, ...props }, ref) {
    if (prefix) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12.5px] text-[#7c8798]">
            {prefix}
          </span>
          <input ref={ref} className={controlClass(hasError, mono, cn("h-[38px] pl-11", className))} {...props} />
        </div>
      )
    }
    return <input ref={ref} className={controlClass(hasError, mono, cn("h-[38px]", className))} {...props} />
  },
)

export interface HuemulSheetTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
  mono?: boolean
}

export const HuemulSheetTextarea = React.forwardRef<HTMLTextAreaElement, HuemulSheetTextareaProps>(
  function HuemulSheetTextarea({ hasError = false, mono = false, className, ...props }, ref) {
    return <textarea ref={ref} className={controlClass(hasError, mono, cn("min-h-[96px] py-2", className))} {...props} />
  },
)
