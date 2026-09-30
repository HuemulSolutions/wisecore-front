import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { passageAssetPath, type SearchPassageAssetGroup } from "@/lib/search-passages"
import { SearchPassageFeedback } from "./search-passage-feedback"
import type { ExecutionLifecycleState } from "@/types/execution"

/** Quita la sintaxis Markdown más común (títulos, énfasis, tablas) para la vista compacta. */
function plainText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`]+/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Un activo con sus pasajes de la página, en versión compacta ("Agrupado por activo"). */
export function SearchPassageGroup({
  group,
  organizationId,
  searchLogId,
  canSendFeedback,
}: {
  group: SearchPassageAssetGroup
  organizationId: string
  searchLogId: string | null
  canSendFeedback: boolean
}) {
  const { t } = useTranslation("search")
  const buildPath = useOrgPath()
  const { citation, passages } = group

  return (
    <Card className="gap-0 border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-[11px] font-semibold text-blue-700">
            {group.bestRank}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate text-sm font-semibold text-foreground" title={citation.document_name}>
              {citation.document_name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {citation.internal_code && <span className="font-mono">{citation.internal_code}</span>}
              {citation.document_type_name && (
                <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
                  {citation.document_type_name}
                </Badge>
              )}
              {citation.lifecycle_state && (
                <HuemulLifecycleBadge state={citation.lifecycle_state as ExecutionLifecycleState} />
              )}
              <span>· {t("passages.groupCount", { count: passages.length })}</span>
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
        {passages.map((passage) => {
          const { citation: c } = passage
          const breadcrumb = c.heading_path.length ? c.heading_path.join(" › ") : c.section_name
          const version = c.version_string ? `v${c.version_string}` : c.execution_name
          return (
            <li key={passage.passage_id} className="flex flex-col gap-1 py-2.5" data-testid="search-passage-group-item">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-foreground" title={breadcrumb}>
                  <span className="mr-1.5 tabular-nums text-muted-foreground">#{passage.rank}</span>
                  {breadcrumb}
                  {version && <span className="ml-1.5 font-normal text-muted-foreground">· {version}</span>}
                  {passage.source_kind === "media_extract" && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 py-0 text-[10px]">
                      {t("passages.fromFile")}
                    </Badge>
                  )}
                </p>
                <HuemulButton
                  variant="ghost"
                  size="sm"
                  icon={ExternalLink}
                  iconClassName="mr-1 h-3 w-3"
                  label={t("passages.openSection")}
                  onClick={() => window.open(buildPath(passageAssetPath(passage)), "_blank")}
                  className="h-6 shrink-0 px-2 text-[11px]"
                />
              </div>
              {/* Texto plano: con Markdown los bloques escapan del line-clamp. */}
              <p className="line-clamp-3 text-xs text-muted-foreground" title={passage.text}>
                {plainText(passage.text)}
              </p>
              {canSendFeedback && searchLogId && (
                <div className="flex justify-end">
                  <SearchPassageFeedback
                    organizationId={organizationId}
                    searchLogId={searchLogId}
                    passageId={passage.passage_id}
                    label={t("feedback.passageQuestion")}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
