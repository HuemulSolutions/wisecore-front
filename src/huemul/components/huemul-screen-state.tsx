import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { HuemulScreenStateProps, ScreenStateAction, ScreenStateItem } from "@/types/huemul"
export type { HuemulScreenStateProps } from "@/types/huemul"

const TONE_CLASS: Record<ScreenStateItem["tone"], string> = {
  ok: "text-[#15803d]",
  error: "text-[#b91c1c]",
  warn: "text-[#b45309]",
}

function ScreenStateButton({
  action,
  variant,
  className,
}: {
  action: ScreenStateAction
  variant?: "outline"
  className?: string
}) {
  return (
    <HuemulButton
      variant={variant}
      size={variant ? undefined : "sm"}
      className={className}
      label={action.label}
      loading={action.loading}
      disabled={action.disabled}
      title={action.title}
      onClick={action.onClick}
      requiredAccess={action.access?.requiredAccess}
      resource={action.access?.resource}
      lifecyclePermissions={action.access?.lifecyclePermissions}
      checkGlobalPermissions={!!action.access}
    />
  )
}

/**
 * Estado de pantalla (vacío, error, bloqueo) guiado por una configuración: título, descripción
 * y una tarjeta con pasos o ítems, un bloque "mini" opcional y acciones al pie.
 * Los textos llegan ya traducidos; el componente no tiene i18n propio.
 */
export function HuemulScreenState({ config, className }: HuemulScreenStateProps) {
  const { title, text, cardTitle, cardSub, steps, items, itemsAction, mini, foot, actions } = config

  return (
    <div
      data-testid="screen-state"
      className={cn("mx-auto flex w-full max-w-[900px] flex-col gap-6 bg-[#f7f8fa] pt-3", className)}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[25px] font-semibold tracking-[-0.01em] text-[#0f172a]">{title}</h2>
        <p className="max-w-[680px] text-sm leading-[1.6] text-[#64748b] [text-wrap:pretty]">{text}</p>
      </div>

      <Card className="gap-5 rounded-[14px] border-[#e2e8f0] bg-white p-6 shadow-none">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-[#0f172a]">{cardTitle}</h3>
          <p className="text-[13px] text-[#64748b]">{cardSub}</p>
        </div>

        {steps && steps.length > 0 && (
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {steps.map((step) => (
              <li key={step.n} className="flex flex-col gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-semibold",
                    step.active ? "bg-[#2563eb] text-white" : "bg-[#e8edf5] text-[#475569]",
                  )}
                >
                  {step.n}
                </span>
                <p className="text-[13px] font-semibold text-[#0f172a]">{step.title}</p>
                <p className="text-[13px] leading-snug text-[#64748b]">{step.text}</p>
                {step.active && step.action && (
                  <ScreenStateButton
                    action={step.action}
                    className="mt-1 w-fit bg-[#2563eb] text-white hover:bg-blue-700"
                  />
                )}
              </li>
            ))}
          </ol>
        )}

        {((items && items.length > 0) || itemsAction) && (
          <div className="flex flex-col">
            {items && items.length > 0 && (
              <ul className="flex flex-col">
                {items.map((item) => (
                  <li
                    key={item.n}
                    className="flex h-10 items-center gap-3 border-b border-[#f1f5f9] text-[13px] last:border-b-0"
                  >
                    <span className="w-5 shrink-0 text-[#94a3b8]">{item.n}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-[#0f172a]" title={item.name}>
                      {item.name}
                    </span>
                    {item.type && <Badge variant="secondary">{item.type}</Badge>}
                    <span className={cn("shrink-0 text-xs font-medium", TONE_CLASS[item.tone])}>{item.status}</span>
                  </li>
                ))}
              </ul>
            )}
            {itemsAction && (
              <ScreenStateButton
                action={itemsAction}
                className={cn("w-fit bg-[#2563eb] text-white hover:bg-blue-700", items && items.length > 0 && "mt-4")}
              />
            )}
          </div>
        )}

        {mini && (
          <div className="flex flex-col gap-3 border-t border-dashed border-[#e2e8f0] pt-4">
            <p className="text-[13px] font-semibold text-[#0f172a]">{mini.title}</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
              {mini.items.map((item) => (
                <div key={item.t} className="rounded-[10px] border border-[#eef1f5] bg-[#fafbfc] p-3">
                  <p className="text-xs font-semibold text-[#0f172a]">{item.t}</p>
                  <p className="mt-1 text-xs leading-snug text-[#64748b]">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {(foot || (actions && actions.length > 0)) && (
        <div className="flex flex-wrap items-center gap-3">
          {foot && <p className="text-[13px] text-[#64748b]">{foot}</p>}
          {actions?.map((action) => (
            <ScreenStateButton key={action.label} action={action} variant="outline" className="h-[34px]" />
          ))}
        </div>
      )}
    </div>
  )
}
