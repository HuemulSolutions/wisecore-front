import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Esqueleto con la estructura de la tabla: título de grupo + filas con ícono y dos líneas. Dos columnas en ancho. */
export function SourcesSkeleton({ narrow }: { narrow: boolean }) {
  const groups = [3, 2];

  return (
    <div data-testid="sources-skeleton" className={cn("grid gap-x-6 gap-y-[18px] pt-[18px]", narrow ? "grid-cols-1" : "grid-cols-2")}>
      {groups.map((rows, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** No se pudieron cargar las fuentes: el sheet queda abierto con opción de reintentar. */
export function SourcesError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  const { t } = useTranslation("sources");

  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-[15px] font-semibold text-slate-900">{t("error.title")}</h3>
      <p className="max-w-sm text-[13px] text-slate-500">{t("error.text")}</p>
      <Button
        type="button"
        size="sm"
        disabled={isRetrying}
        className="bg-blue-600 text-white hover:cursor-pointer hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/40"
        onClick={onRetry}
      >
        {t("error.retry")}
      </Button>
    </div>
  );
}

/** Sin fuentes: explica para qué sirven y los tres pasos. Las tarjetas de agregar van encima (las pone el caller). */
export function SourcesEmpty() {
  const { t } = useTranslation("sources");
  const steps = ["step1", "step2", "step3"] as const;

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div>
        <h3 className="text-[17px] font-semibold text-slate-900">{t("empty.title")}</h3>
        <p className="mt-1 text-[13px] text-slate-500">{t("empty.description")}</p>
      </div>
      <ol className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-4">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-[13px] text-slate-700">
            <span
              className={cn(
                "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                index === 0 ? "bg-blue-600 text-white" : "bg-[#e8edf5] text-slate-600"
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {t(`empty.${step}`)}
          </li>
        ))}
      </ol>
    </div>
  );
}
