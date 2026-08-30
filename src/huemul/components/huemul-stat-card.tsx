import { cn } from "@/lib/utils";
import type { ColorHue } from "@/lib/lifecycle-colors";

/** Paleta del ciclo de vida (`ColorHue`) + hues propios de KPIs ajenos al lifecycle. */
export type HuemulStatCardColor = ColorHue | "violet";

const COLOR_CLASSES: Record<
  HuemulStatCardColor,
  { dot: string; text: string; activeBg: string; activeBorder: string }
> = {
  blue: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", activeBg: "bg-blue-50 dark:bg-blue-950/30", activeBorder: "border-blue-500/50" },
  slate: { dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-400", activeBg: "bg-slate-50 dark:bg-slate-800/40", activeBorder: "border-slate-500/50" },
  amber: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-50 dark:bg-amber-950/30", activeBorder: "border-amber-500/50" },
  sky: { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-50 dark:bg-sky-950/30", activeBorder: "border-sky-500/50" },
  emerald: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-50 dark:bg-emerald-950/30", activeBorder: "border-emerald-500/50" },
  teal: { dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", activeBg: "bg-teal-50 dark:bg-teal-950/30", activeBorder: "border-teal-500/50" },
  gray: { dot: "bg-gray-500", text: "text-gray-600 dark:text-gray-400", activeBg: "bg-gray-50 dark:bg-gray-800/40", activeBorder: "border-gray-500/50" },
  indigo: { dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-50 dark:bg-indigo-950/30", activeBorder: "border-indigo-500/50" },
  red: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400", activeBg: "bg-red-50 dark:bg-red-950/30", activeBorder: "border-red-500/50" },
  violet: { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-50 dark:bg-violet-950/30", activeBorder: "border-violet-500/50" },
};

export interface HuemulStatCardProps {
  value: number;
  label: string;
  color: HuemulStatCardColor;
  active?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function HuemulStatCard({
  value,
  label,
  color,
  active = false,
  loading = false,
  onClick,
  className,
}: HuemulStatCardProps) {
  const { dot, text, activeBg, activeBorder } = COLOR_CLASSES[color];

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={loading}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-70",
        className,
        active ? cn(activeBg, activeBorder) : "hover:bg-accent/40",
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
        {loading ? (
          <span className="h-5 w-6 animate-pulse rounded bg-muted" />
        ) : (
          <span className={cn("text-lg font-bold leading-none", text)}>{value}</span>
        )}
      </span>
      <span className={cn("line-clamp-2 w-full text-xs leading-snug", text)}>{label}</span>
    </button>
  );
}
