import { toast } from "sonner"

const TOAST_DURATION_MS = 2800

/**
 * Toast inferior centrado de la página de Modelos de IA: caja `#0f172a`, texto
 * blanco y punto verde `#4ade80`. Se oculta a los 2,8 s. El margen extra evita
 * que quede pegado al paginador (misma técnica que `workflow.tsx`).
 */
export function showModelsToast(message: string) {
  toast.custom(
    () => (
      <div className="flex items-center gap-2.5 rounded-[10px] bg-[#0f172a] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
        <span className="size-2 shrink-0 rounded-full bg-[#4ade80]" />
        {message}
      </div>
    ),
    { position: "bottom-center", duration: TOAST_DURATION_MS, style: { marginBottom: 48 } },
  )
}
