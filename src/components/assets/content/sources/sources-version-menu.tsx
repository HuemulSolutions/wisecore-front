import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Dependency, DependencyVersionMode } from "@/types/dependency/sheets";

interface SourcesVersionMenuProps {
  dependency: Dependency;
  /** Sin permiso / modo Lector / elaboración externa: el selector se ve pero no abre. */
  canEdit: boolean;
  onSelectMode: (dependency: Dependency, mode: DependencyVersionMode) => void;
}

const MODE_DOT: Record<DependencyVersionMode, string> = {
  published: "bg-[#22c55e]",
  latest_approved: "bg-[#2563eb]",
  specific: "bg-[#94a3b8]",
};

const MODE_KEY: Record<DependencyVersionMode, "published" | "latestApproved" | "specific"> = {
  published: "published",
  latest_approved: "latestApproved",
  specific: "specific",
};

const MODES: DependencyVersionMode[] = ["published", "latest_approved", "specific"];

/** Selector de la versión que lee la IA para un activo vinculado (`version_mode` de la dependencia). */
export function SourcesVersionMenu({ dependency, canEdit, onSelectMode }: SourcesVersionMenuProps) {
  const { t } = useTranslation("sources");
  const current = dependency.version_mode;
  const pinnedName = dependency.depends_on_execution_name;

  const shortLabel =
    current === "specific" && pinnedName
      ? t("version.specific.shortNamed", { name: pinnedName })
      : t(`version.${MODE_KEY[current]}.short`);

  const triggerContent = (
    <>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", MODE_DOT[current])} aria-hidden="true" />
      <span className="truncate">{shortLabel}</span>
      {canEdit && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
    </>
  );
  const triggerClass =
    "inline-flex h-[26px] max-w-full items-center gap-1.5 rounded-[7px] bg-slate-100 px-2 text-[12.5px] font-semibold text-slate-700";

  if (!canEdit) {
    return <span className={triggerClass}>{triggerContent}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("version.label")}: ${shortLabel}`}
          className={cn(
            triggerClass,
            "outline-none transition-colors hover:cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/40 data-[state=open]:bg-slate-200"
          )}
        >
          {triggerContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {t("version.label")}
        </DropdownMenuLabel>
        {MODES.map((mode) => {
          const key = MODE_KEY[mode];
          const hint =
            mode === "specific" && pinnedName
              ? t("version.specific.hintNamed", { name: pinnedName })
              : t(`version.${key}.hint`);
          return (
            <DropdownMenuItem
              key={mode}
              className="items-start gap-2.5 rounded-[7px] px-2 py-1.5 hover:cursor-pointer"
              onSelect={() => setTimeout(() => onSelectMode(dependency, mode), 0)}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", MODE_DOT[mode])} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-slate-900">{t(`version.${key}.title`)}</span>
                <span className="block text-xs text-slate-500">{hint}</span>
              </span>
              {current === mode && <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
