import { Skeleton } from "@/components/ui/skeleton";
import { SUMMARY_CARD_SHELL } from "@/components/workflow/workflow-summary-styles";
import { cn } from "@/lib/utils";

/** Skeleton de carga del resumen: 4 tarjetas con la silueta real (círculo + línea de título +
 *  línea de subtítulo + línea de pie), sin animación llamativa (solo el pulse estándar de
 *  Skeleton). Padding propio: reemplaza el espacio de WorkflowSectionsSummary mientras carga
 *  (el contenedor scrollable del panel va en p-0 para esta rama, ver workflow-detail-panel.tsx). */
export function WorkflowSummarySkeleton() {
  return (
    <div className="flex flex-col gap-[10px] p-[14px_16px_18px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn(SUMMARY_CARD_SHELL, "flex flex-col gap-[12px] p-[14px_16px]")}>
          <div className="flex items-center gap-[11px]">
            <Skeleton className="h-[24px] w-[24px] shrink-0 rounded-full bg-[#eef1f6]" />
            <div className="flex-1 space-y-[6px]">
              <Skeleton className="h-[11px] w-[60%] bg-[#eef1f6]" />
              <Skeleton className="h-[9px] w-[40%] bg-[#f3f5f8]" />
            </div>
          </div>
          <Skeleton className="ml-[35px] h-[9px] w-[45%] bg-[#f3f5f8]" />
        </div>
      ))}
    </div>
  );
}
