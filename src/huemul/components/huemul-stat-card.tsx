import { cn } from "@/lib/utils";

export type HuemulStatCardColor =
  | "blue"
  | "slate"
  | "amber"
  | "sky"
  | "emerald"
  | "teal"
  | "red"
  | "violet";

const COLOR_CLASSES: Record<HuemulStatCardColor, { dot: string; text: string }> = {
  blue: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  slate: { dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-400" },
  amber: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  sky: { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  emerald: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  teal: { dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  red: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  violet: { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
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
  const { dot, text } = COLOR_CLASSES[color];

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={loading}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-70",
        active ? "bg-primary/5" : "hover:bg-accent/40",
        className,
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
