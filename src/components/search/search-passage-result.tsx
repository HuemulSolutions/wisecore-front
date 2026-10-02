import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ExternalLink, FileText, Link2, Paperclip } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Markdown from "@/components/ui/markdown"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { handleApiError } from "@/lib/error-utils"
import { cn } from "@/lib/utils"
import { getMediaDownloadUrl } from "@/services/media"
import { passageAssetPath } from "@/lib/search-passages"
import { SearchPassageFeedback } from "./search-passage-feedback"
import type { ExecutionLifecycleState } from "@/types/execution"
import type { SearchPassage } from "@/types/search"

export function SearchPassageResult({
  passage,
  organizationId,
  searchLogId,
  canSendFeedback,
  canDownloadMedia,
}: {
  passage: SearchPassage
  organizationId: string
  searchLogId: string | null
  canSendFeedback: boolean
  canDownloadMedia: boolean
}) {
  const { t } = useTranslation("search")
  const buildPath = useOrgPath()
  const [expanded, setExpanded] = useState(false)
  const { citation } = passage
  const breadcrumb = citation.heading_path.length ? citation.heading_path.join(" › ") : citation.section_name
  const version = citation.version_string ? `v${citation.version_string}` : citation.execution_name

  const openAsset = () => window.open(buildPath(passageAssetPath(passage)), "_blank")

  const downloadMedia = async (mediaId: string) => {
    try {
      const url = await getMediaDownloadUrl(organizationId, mediaId)
      window.open(url, "_blank")
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("passages.downloadError") })
    }
  }

  return (
    <Card className="gap-0 border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-[11px] font-semibold text-blue-700">
            {passage.rank}
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
              {version && <span>{version}</span>}
              {citation.lifecycle_state && (
                <HuemulLifecycleBadge state={citation.lifecycle_state as ExecutionLifecycleState} />
              )}
              {passage.source_kind === "media_extract" && (
                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px]">
                  {t("passages.fromFile")}
                </Badge>
              )}
            </div>
            {breadcrumb && (
              <p className="truncate text-[11px] text-muted-foreground" title={breadcrumb}>
                {breadcrumb}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground" title={t("passages.scoreHint")}>
            {t("passages.score", { value: Math.round(passage.score * 100) })}
          </span>
          <HuemulButton
            variant="outline"
            size="sm"
            icon={ExternalLink}
            iconClassName="mr-1 h-3 w-3"
            label={t("passages.open")}
            onClick={openAsset}
            className="h-7 px-2 text-xs"
          />
        </div>
      </div>

      <div className={cn("relative mt-3 text-sm", !expanded && "max-h-40 overflow-hidden")}>
        <Markdown>{passage.snippet}</Markdown>
        {!expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 self-start text-xs font-medium text-blue-700 hover:cursor-pointer hover:underline"
      >
        {expanded ? t("passages.showLess") : t("passages.showMore")}
      </button>

      {(passage.media.length > 0 || passage.related_assets.length > 0) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          {passage.media.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Paperclip className="size-3.5 text-muted-foreground" />
              {passage.media.map((media) =>
                canDownloadMedia ? (
                  <button
                    key={media.media_id}
                    type="button"
                    title={media.summary ?? undefined}
                    onClick={() => downloadMedia(media.media_id)}
                    className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] hover:cursor-pointer hover:border-blue-300"
                  >
                    {media.name ?? media.media_id}
                  </button>
                ) : (
                  <span key={media.media_id} title={media.summary ?? undefined} className="rounded-full border border-border px-2 py-0.5 text-[11px]">
                    {media.name ?? media.media_id}
                  </span>
                ),
              )}
            </div>
          )}
          {passage.related_assets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Link2 className="size-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{t("passages.related")}</span>
              {passage.related_assets.map((asset) => {
                const path = asset.execution_id
                  ? `/asset/${asset.document_id}?execution=${encodeURIComponent(asset.execution_id)}`
                  : `/asset/${asset.document_id}`
                return (
                  <button
                    key={`${asset.document_id}-${asset.execution_id ?? ""}`}
                    type="button"
                    title={asset.relation.name ?? undefined}
                    onClick={() => window.open(buildPath(path), "_blank")}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] hover:cursor-pointer hover:border-blue-300"
                  >
                    <FileText className="size-3" />
                    {asset.internal_code ? `${asset.internal_code} · ` : ""}
                    {asset.document_name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {canSendFeedback && searchLogId && (
        <div className="mt-3 flex justify-end border-t border-border pt-2">
          <SearchPassageFeedback
            organizationId={organizationId}
            searchLogId={searchLogId}
            passageId={passage.passage_id}
            label={t("feedback.passageQuestion")}
          />
        </div>
      )}
    </Card>
  )
}
