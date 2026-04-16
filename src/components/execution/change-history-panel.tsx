import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { FileText, ChevronDown, Loader2, SquareArrowOutUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulField } from "@/huemul/components/huemul-field"
import { useOrganization } from "@/contexts/organization-context"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { useUsers } from "@/hooks/useUsers"
import {
  getDocumentsWithPendingChanges,
  type DocumentWithPendingChanges,
} from "@/services/assets"

const PAGE_SIZE = 20

export function ChangeHistoryPanel() {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()
  const buildPath = useOrgPath()

  const [search, setSearch] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

  const handleSearchSubmit = () => {
    setCommittedSearch(search)
    setPage(1)
  }

  const { data: usersData } = useUsers(
    !!selectedOrganizationId,
    selectedOrganizationId ?? undefined,
    1,
    1000
  )

  const userMap = new Map<string, string>()
  if (usersData?.data) {
    for (const user of usersData.data) {
      const fullName = [user.name, user.last_name].filter(Boolean).join(" ")
      if (fullName) userMap.set(user.id, fullName)
    }
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "documents",
      "pending-changes",
      selectedOrganizationId,
      page,
      PAGE_SIZE,
      committedSearch,
    ],
    queryFn: () =>
      getDocumentsWithPendingChanges(selectedOrganizationId!, {
        page,
        pageSize: PAGE_SIZE,
        search: committedSearch || undefined,
        hasPendingAiSuggestion: true,
      }),
    enabled: !!selectedOrganizationId,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  })

  const documents = data?.data ?? []
  const hasNext = data?.has_next ?? false
  const hasPrevious = page > 1

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = navigator.language || "en-US"
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getPendingCount = (doc: DocumentWithPendingChanges) => {
    return doc.pending_ai_suggestion_executions?.length ?? 0
  }

  const getDocumentDisplayName = (doc: DocumentWithPendingChanges) => {
    if (doc.internal_code) {
      return `${doc.internal_code} ${doc.name}`
    }
    return doc.name
  }

  const toggleExpanded = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  const handleVersionClick = (docId: string, executionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(buildPath(`/asset/${docId}?execution=${encodeURIComponent(executionId)}`), "_blank")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search — fixed top */}
      <div className="shrink-0 pb-4" onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}>
        <HuemulField
          type="text"
          label=""
          value={search}
          onChange={(val) => setSearch(String(val))}
          placeholder={t("changeHistory.searchPlaceholder")}
        />
      </div>

      {/* Section header */}
      {documents.length > 0 && (
        <h2 className="shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-4">
          {t("changeHistory.sectionTitle")}
        </h2>
      )}

      {/* Scrollable list area */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Fetching indicator */}
        {!isLoading && isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("changeHistory.loading")}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {committedSearch
                ? t("changeHistory.noResults")
                : t("changeHistory.empty")}
            </p>
          </div>
        )}

        {!isLoading && documents.length > 0 && (
          <div className="flex flex-col gap-3">
            {documents.map((doc) => {
              const pendingCount = getPendingCount(doc)
              const authorName = doc.updated_by
                ? userMap.get(doc.updated_by)
                : null
              const isExpanded = expandedDocs.has(doc.id)
              const executions = doc.pending_ai_suggestion_executions ?? []

              return (
                <div key={doc.id} className="rounded-lg border overflow-hidden">
                  {/* Document row — click to expand/collapse */}
                  <button
                    onClick={(e) => toggleExpanded(doc.id, e)}
                    className="flex items-center gap-4 p-4 w-full text-left transition-colors hover:bg-muted hover:cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {getDocumentDisplayName(doc)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {t("changeHistory.lastModified", {
                          date: formatDate(doc.updated_at),
                        })}
                        {authorName && ` · ${authorName}`}
                      </p>
                    </div>

                    {pendingCount > 0 && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {t("changeHistory.pendingCount", { count: pendingCount })}
                      </span>
                    )}

                    <span
                      role="button"
                      tabIndex={0}
                      title={t("changeHistory.openAsset")}
                      onClick={(e) => {
                        e.stopPropagation()
                        const firstExec = executions[0]
                        const url = firstExec
                          ? buildPath(`/asset/${doc.id}?execution=${encodeURIComponent(firstExec.execution_id)}`)
                          : buildPath(`/asset/${doc.id}`)
                        window.open(url, "_blank")
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation()
                          const firstExec = executions[0]
                          const url = firstExec
                            ? buildPath(`/asset/${doc.id}?execution=${encodeURIComponent(firstExec.execution_id)}`)
                            : buildPath(`/asset/${doc.id}`)
                          window.open(url, "_blank")
                        }
                      }}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 hover:cursor-pointer transition-colors"
                    >
                      <SquareArrowOutUpRight className="h-4 w-4" />
                    </span>

                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expanded: version list */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      {executions.map((exec) => (
                        <button
                          key={exec.execution_id}
                          onClick={(e) => handleVersionClick(doc.id, exec.execution_id, e)}
                          title={t("changeHistory.openVersion")}
                          className="flex items-center gap-3 px-4 py-2.5 pl-18 w-full text-left text-sm hover:bg-muted hover:cursor-pointer transition-colors border-b last:border-b-0 group/version"
                        >
                          <span className="flex-1 truncate group-hover/version:text-primary transition-colors">
                            {exec.execution_name}
                          </span>
                          <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            {t("changeHistory.suggestionCount", { count: exec.pending_ai_suggestion_count })}
                          </span>
                          <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/version:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination — fixed footer */}
      {!isLoading && documents.length > 0 && (
        <div className="shrink-0 flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {t("changeHistory.page", { page })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevious}
              className="hover:cursor-pointer"
            >
              {t("changeHistory.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="hover:cursor-pointer"
            >
              {t("changeHistory.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
