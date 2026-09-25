"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { KeyRound, Plus, RefreshCw } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { formatApiDateTime } from "@/lib/utils"
import { useTokens } from "@/hooks/useTokens"
import { TokenCreateSheet } from "@/components/tokens/token-create-sheet"

interface TokensSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function TokensSheet({ open, onOpenChange, organizationId }: TokensSheetProps) {
  const { t } = useTranslation(["tokens", "common"])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  useEffect(() => {
    if (open) setPage(1)
  }, [open])

  const { data, isLoading, isFetching, refetch } = useTokens(organizationId, {
    enabled: open,
    page,
    pageSize,
  })

  const tokens = data?.data ?? []

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("header.title")}
        description={t("header.description")}
        icon={KeyRound}
        showFooter={false}
        maxWidth="sm:max-w-2xl"
      >
        <div className="flex flex-col h-full -mx-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 pb-3 mb-3 border-b border-gray-100">
            <HuemulButton
              size="sm"
              icon={Plus}
              onClick={() => setCreateSheetOpen(true)}
              className="hover:cursor-pointer"
            >
              {t("header.newToken")}
            </HuemulButton>
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              icon={RefreshCw}
              tooltip={t("common:refresh")}
              loading={isFetching}
              onClick={() => refetch()}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("list.loading")}
              </p>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <KeyRound className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium text-gray-600">{t("list.empty")}</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  {t("list.emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{token.name}</p>
                      <code className="text-xs font-mono text-gray-500">
                        {token.first_five}…{token.last_five}
                      </code>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t("list.durationDays", { count: token.duration_days })} ·{" "}
                        {formatApiDateTime(token.expires_at)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {formatApiDateTime(token.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination footer */}
          <div className="px-6 pt-2 border-t border-gray-100">
            <HuemulPagination
              page={data?.page ?? page}
              pageSize={data?.page_size ?? pageSize}
              hasNext={data?.has_next}
              hasPrevious={(data?.page ?? page) > 1}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s)
                setPage(1)
              }}
              pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>
      </HuemulSheet>

      <TokenCreateSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        organizationId={organizationId}
      />
    </>
  )
}
