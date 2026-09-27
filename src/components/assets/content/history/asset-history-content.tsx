import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { HuemulTabCount } from "@/huemul/components/huemul-tab-count";
import { HuemulLoadMoreFooter } from "@/huemul/components/huemul-load-more-footer";
import { parseApiDate } from "@/lib/utils";
import { HistorySectionShell } from "./history-section-shell";
import { HistoryDetailHeader } from "./history-detail-parts";
import { HistorySectionDetail } from "./history-section-detail";
import { HistoryLifecycleFeed } from "./history-lifecycle-feed";
import { HistoryChangesFeed } from "./history-changes-feed";
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils";
import {
  useSectionHistorySource,
  useLifecycleHistorySource,
  useChangesHistorySource,
} from "@/components/assets/content/hooks/useAssetHistoryData";
import type { AssetHistorySheetProps, AssetHistoryTab } from "@/types/assets";
import type { HuemulDetailSurfaceTab } from "@/types/huemul";

/**
 * Compone las (hasta tres) fuentes de datos del sheet de Historial, arma los
 * tabs de `HuemulDetailSurface` ya con contenido, y expone un único
 * `onRefresh`/`isRefreshing`/`activeTab`/`footerContent` para toda la
 * superficie.
 *
 * Dos layouts según qué tabs se piden — son disjuntos, ningún call-site elige
 * entre ellos: `["section"]` (botón "Ver historial" de una sección) usa el
 * sheet ancho maestro-detalle; `["lifecycle","changes"]` (menú "…" del
 * activo) usa el sheet angosto de 520px, una columna.
 */
export function useAssetHistory({
  open,
  tabs: requestedTabs,
  organizationId,
  sectionExecutionId,
  documentId,
  executionId,
  allExecutions,
  entityName,
}: Omit<AssetHistorySheetProps, "onOpenChange">) {
  const { t } = useTranslation(["assets", "common"]);

  const wantsSection = requestedTabs.includes("section");
  const wantsLifecycle = requestedTabs.includes("lifecycle");
  const wantsChanges = requestedTabs.includes("changes");
  const layout = wantsSection ? "wide" : "narrow";

  const [activeTab, setActiveTab] = useState<AssetHistoryTab>(requestedTabs[0]);
  // Vuelve al primer tab de esta apertura cada vez que se abre — evita que
  // quede colgado en un tab de la apertura anterior (ej. "changes" desde el
  // menú "…" y después "section" desde una sección distinta).
  useEffect(() => {
    if (open) setActiveTab(requestedTabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: usersData, isFetching: isFetchingUsers, refetch: refetchUsers } = useUsers(
    open,
    organizationId,
    1,
    1000,
  );
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersData?.data?.forEach((user) => {
      map.set(user.id, [user.name, user.last_name].filter(Boolean).join(" "));
    });
    return map;
  }, [usersData]);

  const section = useSectionHistorySource({
    enabled: open && wantsSection,
    sectionExecutionId,
    organizationId,
    userMap,
  });

  const lifecycle = useLifecycleHistorySource({
    enabled: open && wantsLifecycle,
    organizationId,
    executionId,
    userMap,
  });

  const changes = useChangesHistorySource({
    enabled: open && wantsChanges,
    organizationId,
    documentId,
    userMap,
  });

  const sortedExecutions = useMemo(
    () =>
      [...(allExecutions ?? [])].sort(
        (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
      ),
    [allExecutions],
  );

  const executionLabel = (id: string) => {
    const index = sortedExecutions.findIndex((e) => e.id === id);
    const exec = sortedExecutions[index];
    const label = getExecutionDisplayLabel(exec);
    return label || (index >= 0 ? t("versionManagement.versionFallback", { number: sortedExecutions.length - index }) : "");
  };

  const tabs: HuemulDetailSurfaceTab[] = [];

  if (wantsSection) {
    const count = section.data.total ?? section.data.entries.length;
    tabs.push({
      value: "section",
      label: t("assetHistory.tabWithCount", { label: t("assetHistory.tabSection"), count }),
      className: "flex-1 min-h-0 mt-0 data-[state=active]:flex",
      content: (
        <HistorySectionShell
          data={section.data}
          listLabel={t("assetHistory.listLabelChanges")}
          listCountLabel={t("assetHistory.countTotal", { count })}
          loadMoreLabel={t("common:loadMore")}
          emptyTitle={t("assetHistory.emptySection.title")}
          emptyDescription={t("assetHistory.emptySection.description")}
          resetKey={sectionExecutionId}
          detailHeader={(entry) => (
            <HistoryDetailHeader
              label={entry.typeLabel}
              tone={entry.tone}
              createdAt={entry.createdAt}
              authorName={entry.authorName}
            />
          )}
          renderDetail={(entry) => <HistorySectionDetail entry={entry} />}
        />
      ),
    });
  }

  if (wantsLifecycle) {
    const total = lifecycle.data.total;
    const count = total ?? lifecycle.data.entries.length;
    tabs.push({
      value: "lifecycle",
      label: <HuemulTabCount label={t("assetHistory.tabLifecycle")} count={count} active={activeTab === "lifecycle"} />,
      className: "flex-1 min-h-0 mt-0 data-[state=active]:flex",
      content: (
        <HistoryLifecycleFeed
          data={lifecycle.data}
          executions={sortedExecutions}
          viewExecutionId={lifecycle.viewExecutionId}
          onExecutionChange={lifecycle.setViewExecutionId}
          executionLabel={executionLabel(lifecycle.viewExecutionId)}
        />
      ),
    });
  }

  if (wantsChanges) {
    tabs.push({
      value: "changes",
      label: <HuemulTabCount label={t("assetHistory.tabChanges")} count={changes.data.entries.length} active={activeTab === "changes"} />,
      className: "flex-1 min-h-0 mt-0 data-[state=active]:flex",
      content: (
        <HistoryChangesFeed data={changes.data} changeType={changes.changeType} onChangeTypeChange={changes.setChangeType} />
      ),
    });
  }

  // El wide (section) dibuja su propio footer dentro de `HuemulMasterDetailPane`
  // — la superficie no necesita `footerContent`. El narrow lo arma acá porque
  // su contenido depende del tab activo, y `footerContent` es global de
  // `HuemulDetailSurface`.
  // `total` puede ser el total de LA PÁGINA, no el global (no verificado
  // contra el backend) — solo se confía en él si es mayor o igual a lo ya
  // cargado, igual que antes de este refactor.
  const lifecycleTotal = lifecycle.data.total;
  const lifecycleLoaded = lifecycle.data.entries.length;
  const lifecycleCountLabel =
    lifecycleTotal !== undefined && lifecycleTotal >= lifecycleLoaded
      ? t("assetHistory.countOfTotal", { loaded: lifecycleLoaded, total: lifecycleTotal })
      : t("assetHistory.countLoaded", { count: lifecycleLoaded });

  const footerContent =
    layout === "wide" ? undefined : activeTab === "lifecycle" ? (
      <HuemulLoadMoreFooter
        countLabel={lifecycleCountLabel}
        loadMoreLabel={t("common:loadMore")}
        isLoading={lifecycle.data.isLoadingMore}
        onLoadMore={lifecycle.data.hasNext ? lifecycle.data.loadMore : undefined}
      />
    ) : (
      <HuemulLoadMoreFooter
        countLabel={t("assetHistory.countLoaded", { count: changes.data.entries.length })}
        loadMoreLabel={t("common:loadMore")}
        isLoading={changes.data.isLoadingMore}
        onLoadMore={changes.data.hasNext ? changes.data.loadMore : undefined}
      />
    );

  const isRefreshing =
    (wantsSection && (section.data.isFetching)) ||
    (wantsLifecycle && lifecycle.data.isFetching) ||
    (wantsChanges && changes.data.isFetching) ||
    isFetchingUsers;

  const onRefresh = () => {
    if (wantsSection) section.data.refetch();
    if (wantsLifecycle) lifecycle.data.refetch();
    if (wantsChanges) changes.data.refetch();
    refetchUsers();
  };

  const title = entityName ? t("assetHistory.sheetTitle", { name: entityName }) : t("assetHistory.sheetTitleFallback");

  return {
    icon: History,
    title,
    subtitle: t("assetHistory.subtitle"),
    size: layout === "wide" ? ("wide" as const) : ("narrow" as const),
    tabs,
    activeTab,
    setActiveTab,
    footerContent,
    onRefresh,
    isRefreshing,
  };
}
