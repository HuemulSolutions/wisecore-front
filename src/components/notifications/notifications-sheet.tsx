"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bell,
  Calendar,
  Check,
  MessageSquare,
  BellOff,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatApiDateTime } from "@/lib/utils"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
} from "@/services/notifications"
import type { Notification } from "@/types/notifications"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventIcon(eventType: string | null) {
  if (!eventType) return Bell
  if (eventType.startsWith("document_stage_")) return Check
  if (eventType.includes("date")) return Calendar
  if (eventType === "document_new_comments") return MessageSquare
  return Bell
}

// ─── Notification item ──────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onNavigate,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (notification: Notification) => void
}) {
  const { t } = useTranslation(["notifications", "assets"])
  const Icon = getEventIcon(notification.event_type)
  const canNavigate = !!notification.document_id

  const label = notification.event_type
    ? t(`assets:notifications.events.${notification.event_type}`, {
        defaultValue: notification.message || notification.event_type,
      })
    : notification.message || ""

  return (
    <div
      onClick={canNavigate ? () => onNavigate(notification) : undefined}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        notification.is_read
          ? "bg-white border-gray-100"
          : "bg-blue-50 border-blue-100",
        canNavigate && "hover:cursor-pointer hover:border-blue-200",
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          notification.is_read ? "bg-gray-100" : "bg-blue-100",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            notification.is_read ? "text-gray-500" : "text-blue-600",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            notification.is_read ? "text-gray-700" : "text-gray-900 font-medium",
          )}
        >
          {notification.message || label}
        </p>
        {notification.reason && (
          <p className="text-xs text-gray-500 mt-0.5">{notification.reason}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatApiDateTime(notification.created_at)}
        </p>
      </div>
      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {notification.is_read ? (
          <button
            onClick={() => onMarkUnread(notification.id)}
            className="p-1 text-gray-400 hover:text-blue-600 hover:cursor-pointer transition-colors rounded"
            title={t("markUnread")}
          >
            <BellOff className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 text-gray-400 hover:text-green-600 hover:cursor-pointer transition-colors rounded"
            title={t("markRead")}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 text-gray-400 hover:text-red-600 hover:cursor-pointer transition-colors rounded"
          title={t("delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function NotificationsSheet({
  open,
  onOpenChange,
  organizationId,
}: NotificationsSheetProps) {
  const { t } = useTranslation(["notifications"])
  const queryClient = useQueryClient()
  const navigate = useOrgNavigate()

  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all")

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["notifications", "global", notifFilter],
    queryFn: () =>
      getNotifications(organizationId, {
        is_read: notifFilter === "unread" ? false : undefined,
        page_size: 50,
      }),
    enabled: open && !!organizationId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })

  const notifications = notificationsData?.data ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(organizationId, id),
    onSuccess: invalidate,
  })

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => markNotificationUnread(organizationId, id),
    onSuccess: invalidate,
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(organizationId, id),
    onSuccess: invalidate,
  })

  const handleNavigate = (notification: Notification) => {
    if (!notification.document_id) return
    if (!notification.is_read) markReadMutation.mutate(notification.id)
    onOpenChange(false)
    navigate(`/asset/${notification.document_id}`)
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("header.title")}
      description={t("header.description")}
      icon={Bell}
      showFooter={false}
      side="right"
      maxWidth="sm:max-w-xl"
    >
      <div className="flex flex-col h-full -mx-6">
        {/* Filter row */}
        <div className="flex items-center justify-between px-6 pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setNotifFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors hover:cursor-pointer",
                  notifFilter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {f === "all" ? t("filterAll") : t("filterUnread")}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:cursor-pointer transition-colors rounded"
            title={t("refresh")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onMarkUnread={(id) => markUnreadMutation.mutate(id)}
                  onDelete={(id) => deleteNotificationMutation.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </HuemulSheet>
  )
}
