"use client"

import { useState } from "react"
import { Bell, Star, Eye, Edit2, Trash2, Plus, Mail, Smartphone } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import type { Subscription } from "@/types/subscriptions"
import { SubscriptionCreateDialog } from "./subscriptions-create-dialog"
import { SubscriptionEditDialog } from "./subscriptions-edit-dialog"
import { SubscriptionDeleteDialog } from "./subscriptions-delete-dialog"

interface SubscriptionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

function getEventTypeLabel(eventType: string | null, t: (key: string) => string): string {
  if (!eventType) return ""
  const key = `eventType.${eventType}`
  const result = t(key)
  return result === key ? eventType : result
}

export function SubscriptionsSheet({ open, onOpenChange, organizationId }: SubscriptionsSheetProps) {
  const { t } = useTranslation("subscriptions")

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Subscription | null>(null)
  const [deletingItem, setDeletingItem] = useState<Subscription | null>(null)

  const { data, isLoading, isFetching, error } = useSubscriptions(organizationId, {
    enabled: open && !!organizationId,
  })

  const items = data?.data ?? []

  const columns: HuemulTableColumn<Subscription>[] = [
    {
      key: "document_name",
      label: t("columns.document"),
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {item.reaction_type === "favorite" ? (
              <Star className="size-3 text-yellow-500 shrink-0" />
            ) : (
              <Eye className="size-3 text-blue-500 shrink-0" />
            )}
            <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
              {item.document_name ?? item.document_id}
            </span>
          </div>
          {item.execution_name && (
            <span className="text-xs text-muted-foreground pl-4.5 truncate">
              {item.execution_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "reaction_type",
      label: t("columns.reactionType"),
      render: (item) => (
        <Badge variant={item.reaction_type === "favorite" ? "secondary" : "outline"} className="text-xs whitespace-nowrap">
          {t(`reactionType.${item.reaction_type}` as Parameters<typeof t>[0])}
        </Badge>
      ),
    },
    {
      key: "event_type",
      label: t("columns.eventType"),
      render: (item) =>
        item.event_type ? (
          <Badge variant="outline" className="text-xs text-muted-foreground whitespace-nowrap">
            {getEventTypeLabel(item.event_type, t)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{t("labels.noEvent")}</span>
        ),
    },
    {
      key: "notifications",
      label: t("columns.notifications"),
      render: (item) => (
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Mail
                  className={`size-3.5 ${item.notify_email ? "text-foreground" : "text-muted-foreground/30"}`}
                />
              </TooltipTrigger>
              <TooltipContent>{t("form.notifyEmail")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Smartphone
                  className={`size-3.5 ${item.notify_in_app ? "text-foreground" : "text-muted-foreground/30"}`}
                />
              </TooltipTrigger>
              <TooltipContent>{t("form.notifyInApp")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ]

  const actions: HuemulTableAction<Subscription>[] = [
    {
      key: "edit",
      label: t("actions.edit"),
      icon: Edit2,
      onClick: (item) => setTimeout(() => setEditingItem(item), 0),
      separator: true,
    },
    {
      key: "delete",
      label: t("actions.delete"),
      icon: Trash2,
      onClick: (item) => setTimeout(() => setDeletingItem(item), 0),
      destructive: true,
    },
  ]

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("header.title")}
        description={t("header.description")}
        icon={Bell}
        showFooter={false}
        side="right"
        maxWidth="sm:max-w-4xl"
        headerExtra={
          <HuemulButton
            icon={Plus}
            label={t("header.addItem")}
            size="sm"
            onClick={() => setTimeout(() => setShowCreateDialog(true), 0)}
          />
        }
      >
        <div className="flex flex-col h-full overflow-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 gap-2">
              <p className="text-sm text-red-600 font-medium">{t("errorState.failedToLoad")}</p>
              <p className="text-xs text-muted-foreground">{t("errorState.errorDescription")}</p>
            </div>
          ) : (
            <HuemulTable
              data={items}
              columns={columns}
              actions={actions}
              getRowKey={(item) => item.id}
              isLoading={isLoading}
              isFetching={isFetching}
              emptyState={{
                title: t("emptyState.title"),
                description: t("emptyState.description"),
              }}
            />
          )}
        </div>
      </HuemulSheet>

      <SubscriptionCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        organizationId={organizationId}
      />

      <SubscriptionEditDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        organizationId={organizationId}
        item={editingItem}
      />

      <SubscriptionDeleteDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        organizationId={organizationId}
        item={deletingItem}
      />
    </>
  )
}
