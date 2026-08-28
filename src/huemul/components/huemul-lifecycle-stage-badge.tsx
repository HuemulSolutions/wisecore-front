import { useTranslation } from "react-i18next"
import type { HuemulLifecycleStageBadgeProps } from "@/types/lifecycle"

/** Colors for `lifecycle_status.stage` (create/edit/review/approve/publish/archive/view) — distinct from `state`. */
const STAGE_COLORS: Record<string, string> = {
  create: "bg-purple-100 text-purple-700",
  edit: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  approve: "bg-orange-100 text-orange-700",
  approved: "bg-orange-100 text-orange-700",
  publish: "bg-green-100 text-green-700",
  published: "bg-green-100 text-green-700",
  archive: "bg-gray-100 text-gray-600",
  archived: "bg-gray-100 text-gray-600",
  view: "bg-slate-100 text-slate-600",
}

/** Stage pill + current-group chip for a document's lifecycle status. */
export function HuemulLifecycleStageBadge({ status, className, variant = "pill" }: HuemulLifecycleStageBadgeProps) {
  const { t } = useTranslation("assets")

  if (!status) return null

  const stageLabel = t(`lifecycle.stageLabels.${status.stage}`, { defaultValue: status.stage })

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ""}`}>
      {variant === "plain" ? (
        <span className="text-xs font-medium text-gray-700">{stageLabel}</span>
      ) : (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[status.stage] ?? "bg-gray-100 text-gray-600"}`}>
          {stageLabel}
        </span>
      )}
      {status.current_group && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {status.current_group}
        </span>
      )}
    </div>
  )
}
