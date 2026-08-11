import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Star,
  MessageSquare,
  Calendar,
  Trash2,
  RefreshCw,
  Check,
  BellOff,
  ChevronDown,
  GitBranch,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils";
import { parseApiDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import { usePageAccess } from "@/hooks/usePageAccess";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatApiDateTime } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
} from "@/services/notifications";
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} from "@/services/subscriptions";
import type { Notification } from "@/types/notifications";
import type { CreateSubscriptionRequest } from "@/types/subscriptions";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_EVENTS = [
  "document_stage_draft",
  "document_stage_in_review",
  "document_stage_in_approval",
  "document_stage_approved",
  "document_stage_published",
  "document_stage_archived",
] as const;

const DATE_EVENTS = [
  "execution_expiration_date",
  "execution_estimated_publication_date",
  "execution_review_date",
  "execution_audit_date",
] as const;

type DateEventType = (typeof DATE_EVENTS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventIcon(eventType: string | null) {
  if (!eventType) return Bell;
  if (eventType.startsWith("document_stage_")) return Check;
  if (eventType.includes("date")) return Calendar;
  if (eventType === "document_new_comments") return MessageSquare;
  return Bell;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = getEventIcon(notification.event_type);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        notification.is_read
          ? "bg-white border-gray-100"
          : "bg-blue-50 border-blue-100",
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
          {notification.message || notification.event_type}
        </p>
        {notification.reason && (
          <p className="text-xs text-gray-500 mt-0.5">{notification.reason}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatApiDateTime(notification.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {notification.is_read ? (
          <button
            onClick={() => onMarkUnread(notification.id)}
            className="p-1 text-gray-400 hover:text-blue-600 hover:cursor-pointer transition-colors rounded"
            title="Mark as unread"
          >
            <BellOff className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 text-gray-400 hover:text-green-600 hover:cursor-pointer transition-colors rounded"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 text-gray-400 hover:text-red-600 hover:cursor-pointer transition-colors rounded"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExecutionSummary {
  id: string;
  name?: string | null;
  version?: string | null;
  status?: string;
  created_at: string;
}

function toDisplayExec(e: ExecutionSummary): { version?: string | null; name?: string } {
  return { version: e.version, name: e.name ?? undefined };
}

interface AssetsNotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  executionId?: string | null;
  organizationId: string;
  allExecutions?: ExecutionSummary[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetsNotificationsSheet({
  open,
  onOpenChange,
  documentId,
  executionId,
  organizationId,
  allExecutions,
}: AssetsNotificationsSheetProps) {
  const { t } = useTranslation(["assets"]);
  const queryClient = useQueryClient();
  // Las notificaciones/suscripciones son un recurso propio (notification), no del
  // asset: el sheet lleva su propio gate y no depende solo del trigger.
  const { can } = usePageAccess('asset');
  const canListNotifications = can('listNotifications');

  const [activeTab, setActiveTab] = useState<"notifications" | "subscriptions">(
    "notifications",
  );
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [notifPage, setNotifPage] = useState(1);
  const [notifPageSize, setNotifPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Reset to the first page when the asset, filter, or active tab changes
  useEffect(() => {
    setNotifPage(1);
  }, [documentId, notifFilter, activeTab]);

  // Version selected for date-alert subscriptions (defaults to the currently viewed version)
  const [selectedSubExecutionId, setSelectedSubExecutionId] = useState<string | null>(
    executionId ?? null,
  );

  // Reset selected version whenever the asset changes so we never show stale data
  useEffect(() => {
    setSelectedSubExecutionId(executionId ?? null);
  }, [documentId, executionId]);

  // Sync when the prop changes (e.g. user switches version while sheet is open)
  const effectiveExecutionId = selectedSubExecutionId ?? executionId ?? null;

  // Sorted executions for the version picker
  const sortedExecutions = useMemo(() => {
    if (!allExecutions) return [];
    return [...allExecutions].sort(
      (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
    );
  }, [allExecutions]);

  const selectedExecution = useMemo(
    () => sortedExecutions.find((e) => e.id === effectiveExecutionId) ?? sortedExecutions[0] ?? null,
    [sortedExecutions, effectiveExecutionId],
  );

  // days_before local state for date events (initialized with sensible defaults)
  const [dateEventDays, setDateEventDays] = useState<Record<DateEventType, number>>({
    execution_expiration_date: 7,
    execution_estimated_publication_date: 7,
    execution_review_date: 7,
    execution_audit_date: 7,
  });

  // ─── Notifications query ──────────────────────────────────────────────────

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
    isFetching: isFetchingNotifications,
  } = useQuery({
    queryKey: ["notifications", documentId, notifFilter, notifPage, notifPageSize],
    queryFn: () =>
      getNotifications(organizationId, {
        document_id: documentId,
        is_read: notifFilter === "unread" ? false : undefined,
        page: notifPage,
        page_size: notifPageSize,
      }),
    enabled: open && activeTab === "notifications" && canListNotifications,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const notifications = notificationsData?.data ?? [];

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  // ─── Subscriptions query ──────────────────────────────────────────────────

  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["subscriptions", documentId],
    queryFn: () =>
      getSubscriptions(organizationId, { document_id: documentId, page_size: 100 }),
    enabled: open && activeTab === "subscriptions" && canListNotifications,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const subscriptions = subscriptionsData?.data ?? [];

  const favoriteSubscription = subscriptions.find(
    (s) => s.reaction_type === "favorite",
  );

  // ─── Notification mutations ───────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(organizationId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", documentId] }),
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => markNotificationUnread(organizationId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", documentId] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(organizationId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", documentId] }),
  });

  // ─── Subscription mutations ───────────────────────────────────────────────

  const createSubMutation = useMutation({
    mutationFn: (body: CreateSubscriptionRequest) =>
      createSubscription(organizationId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["subscriptions", documentId] }),
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => deleteSubscription(organizationId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["subscriptions", documentId] }),
  });

  const isSubscriptionBusy = createSubMutation.isPending || deleteSubMutation.isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleFavorite = () => {
    if (favoriteSubscription) {
      deleteSubMutation.mutate(favoriteSubscription.id);
    } else {
      createSubMutation.mutate({
        document_id: documentId,
        reaction_type: "favorite",
        notify_email: false,
        notify_in_app: false,
      });
    }
  };

  const handleToggleEventSubscription = (
    eventType: string,
    execId: string | null,
    days?: number,
  ) => {
    const existing = subscriptions.find(
      (s) => s.event_type === eventType && s.execution_id === execId,
    );

    if (existing) {
      deleteSubMutation.mutate(existing.id);
    } else {
      createSubMutation.mutate({
        document_id: documentId,
        ...(execId ? { execution_id: execId } : {}),
        event_type: eventType,
        reaction_type: "watch",
        notify_in_app: true,
        notify_email: false,
        ...(days !== undefined ? { days_before: days } : {}),
      });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("content.notifications")}
      description={t("content.notificationsDescription")}
      icon={Bell}
      showFooter={false}
      maxWidth="sm:max-w-xl"
    >
      {!canListNotifications ? (
        <HuemulAccessDenied variant="inline" />
      ) : (
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex flex-col -mx-6 h-full"
      >
        {/* Tab bar */}
        <div className="px-6 pb-3 border-b border-gray-100">
          <TabsList className="w-full">
            <TabsTrigger
              value="notifications"
              className="flex-1 gap-1.5 hover:cursor-pointer"
            >
              {t("notifications.tab")}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-blue-600 text-white text-[10px] font-medium">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="flex-1 hover:cursor-pointer"
            >
              {t("notifications.subscriptionsTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Notifications Tab ──────────────────────────────────────────── */}
        <TabsContent
          value="notifications"
          className="flex-1 overflow-y-auto px-6 pt-3 pb-4 mt-0"
        >
          {/* Filter row */}
          <div className="flex items-center justify-between mb-3">
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
                  {f === "all"
                    ? t("notifications.filterAll")
                    : t("notifications.filterUnread")}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetchNotifications()}
              disabled={isFetchingNotifications}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:cursor-pointer transition-colors rounded"
              title={t("content.refreshContent")}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isFetchingNotifications && "animate-spin",
                )}
              />
            </button>
          </div>

          {/* List */}
          {isLoadingNotifications ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: Notification) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onMarkUnread={(id) => markUnreadMutation.mutate(id)}
                  onDelete={(id) => deleteNotificationMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Pagination footer */}
          {notifications.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <HuemulPagination
                page={notificationsData?.page ?? notifPage}
                pageSize={notificationsData?.page_size ?? notifPageSize}
                totalItems={notificationsData?.total}
                hasNext={notificationsData?.has_next}
                hasPrevious={(notificationsData?.page ?? notifPage) > 1}
                onPageChange={setNotifPage}
                onPageSizeChange={(s) => {
                  setNotifPageSize(s);
                  setNotifPage(1);
                }}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
              />
            </div>
          )}
        </TabsContent>

        {/* ── Subscriptions Tab ──────────────────────────────────────────── */}
        <TabsContent
          value="subscriptions"
          className="flex-1 overflow-y-auto px-6 pt-3 pb-4 mt-0"
        >
          {isLoadingSubscriptions ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Favorite ───────────────────────────────────────────── */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("notifications.sectionFavorite")}
                </h3>
                <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Star
                      className={cn(
                        "h-4 w-4",
                        favoriteSubscription
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-400",
                      )}
                    />
                    <span className="text-sm text-gray-700">
                      {t("notifications.favoriteLabel")}
                    </span>
                  </div>
                  <Switch
                    checked={!!favoriteSubscription}
                    onCheckedChange={handleToggleFavorite}
                    disabled={isSubscriptionBusy}
                    className="hover:cursor-pointer"
                  />
                </div>
              </section>

              {/* ── Stage events ────────────────────────────────────────── */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("notifications.sectionStageEvents")}
                </h3>
                <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                  {STAGE_EVENTS.map((eventType) => {
                    const sub = subscriptions.find(
                      (s) => s.event_type === eventType && s.execution_id === null,
                    );
                    return (
                      <div
                        key={eventType}
                        className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-700">
                          {t(`notifications.events.${eventType}`, {
                            defaultValue: eventType,
                          })}
                        </span>
                        <Switch
                          checked={!!sub}
                          onCheckedChange={() =>
                            handleToggleEventSubscription(eventType, null)
                          }
                          disabled={isSubscriptionBusy}
                          className="hover:cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Comment events ─────────────────────────────────────── */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("notifications.sectionComments")}
                </h3>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between py-2.5 px-3 bg-white">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {t("notifications.events.document_new_comments")}
                      </span>
                    </div>
                    <Switch
                      checked={
                        !!subscriptions.find(
                          (s) =>
                            s.event_type === "document_new_comments" &&
                            s.execution_id === null,
                        )
                      }
                      onCheckedChange={() =>
                        handleToggleEventSubscription("document_new_comments", null)
                      }
                      disabled={isSubscriptionBusy}
                      className="hover:cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              {/* ── Date alerts (version-level only) ───────────────────── */}
              {sortedExecutions.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t("notifications.sectionDateAlerts")}
                    </h3>
                  </div>

                  {/* Version picker */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1.5">
                      {t("notifications.dateAlertsVersion")}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm hover:cursor-pointer transition-colors",
                            selectedExecution
                              ? "bg-blue-50 border-blue-200 text-blue-800"
                              : "bg-gray-50 border-gray-200 text-gray-600",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GitBranch className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium truncate">
                              {selectedExecution
                                ? getExecutionDisplayLabel(toDisplayExec(selectedExecution)) ||
                                  t("notifications.versionFallback", {
                                    n: sortedExecutions.indexOf(selectedExecution) + 1,
                                  })
                                : t("notifications.noVersion")}
                            </span>
                            {selectedExecution?.id === executionId && (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                {t("notifications.currentVersion")}
                              </span>
                            )}
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        {sortedExecutions.map((exec, index) => {
                          const label =
                            getExecutionDisplayLabel(toDisplayExec(exec)) ||
                            `v${sortedExecutions.length - index}`;
                          const isCurrent = exec.id === executionId;
                          const isSelected = exec.id === effectiveExecutionId;
                          return (
                            <DropdownMenuItem
                              key={exec.id}
                              className={cn(
                                "flex items-center justify-between gap-2 hover:cursor-pointer",
                                isSelected && "bg-blue-50",
                              )}
                              onSelect={() => setSelectedSubExecutionId(exec.id)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <GitBranch className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span
                                  className={cn(
                                    "text-sm truncate",
                                    isSelected
                                      ? "font-medium text-blue-700"
                                      : "text-gray-700",
                                  )}
                                >
                                  {label}
                                </span>
                              </div>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                  {t("notifications.currentVersion")}
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    {t("notifications.dateAlertsHint")}
                  </p>
                  <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                    {DATE_EVENTS.map((eventType) => {
                      const sub = subscriptions.find(
                        (s) =>
                          s.event_type === eventType &&
                          s.execution_id === effectiveExecutionId,
                      );
                      const days = dateEventDays[eventType];
                      return (
                        <div
                          key={eventType}
                          className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-gray-50 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {t(`notifications.events.${eventType}`, {
                                defaultValue: eventType,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={365}
                                value={days}
                                onChange={(e) =>
                                  setDateEventDays((prev) => ({
                                    ...prev,
                                    [eventType]: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                  }))
                                }
                                className="w-12 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                disabled={isSubscriptionBusy}
                              />
                              <span className="text-xs text-gray-400">
                                {t("notifications.daysBefore")}
                              </span>
                            </div>
                            <Switch
                              checked={!!sub}
                              onCheckedChange={() =>
                                handleToggleEventSubscription(
                                  eventType,
                                  effectiveExecutionId,
                                  days,
                                )
                              }
                              disabled={isSubscriptionBusy || !effectiveExecutionId}
                              className="hover:cursor-pointer"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}
    </HuemulSheet>
  );
}
