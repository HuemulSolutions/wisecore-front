import { useState, useCallback } from "react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulFilters } from "@/huemul/components/huemul-filters";
import { getAssetTypes } from "@/services/asset-types";
import { getUsers } from "@/services/users";
import { getAllTemplates } from "@/services/templates";
import type { SearchType } from "@/services/search";
import { useTranslation } from "react-i18next";
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field";
import { useOrganization } from "@/contexts/organization-context";
import type { SearchFilterValues, SearchFiltersProps } from '@/types/search';
export type { SearchFilterValues, SearchFiltersProps } from '@/types/search';

function countActiveFilters(f: SearchFilterValues): number {
  let count = 0;
  if (f.document_type_id) count++;
  if (f.template_id) count++;
  if (f.ownerValue) count++;
  if (f.lifecycle_state) count++;
  if (!f.filter_with_llm) count++;
  if (f.has_unresolved_comments) count++;
  if (f.has_pending_ai_suggestion) count++;
  if (f.expiration_date || f.expiration_date_from || f.expiration_date_to) count++;
  if (f.estimated_publication_date || f.estimated_publication_date_from || f.estimated_publication_date_to) count++;
  if (f.review_date || f.review_date_from || f.review_date_to) count++;
  if (f.audit_date || f.audit_date_from || f.audit_date_to) count++;
  return count;
}

export function SearchFilters({ organizationId, searchType, onSearchTypeChange, onApply, initialFilters, defaultOpen = true }: SearchFiltersProps) {
  const { t } = useTranslation("search");
  const { t: tAssets } = useTranslation("assets");

  const defaultFilters: SearchFilterValues = {
    document_type_id: null,
    template_id: null,
    ownerValue: null,
    lifecycle_state: null,
    filter_with_llm: true,
    has_unresolved_comments: false,
    has_pending_ai_suggestion: false,
    expiration_date: '',
    expiration_date_from: '',
    expiration_date_to: '',
    estimated_publication_date: '',
    estimated_publication_date_from: '',
    estimated_publication_date_to: '',
    review_date: '',
    review_date_from: '',
    review_date_to: '',
    audit_date: '',
    audit_date_from: '',
    audit_date_to: '',
  };

  const base = initialFilters ?? defaultFilters;
  const [pending, setPending] = useState<SearchFilterValues>(base);
  const [applied, setApplied] = useState<SearchFilterValues>(base);

  // Pre-selected labels for async-select (restored from URL on mount)
  const [templateLabel, setTemplateLabel] = useState<string | undefined>(undefined);

  const { selectedOrganizationId } = useOrganization();

  const fetchAssetTypes = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAssetTypes(page, pageSize, search);
      return {
        options: (res.data ?? []).map((at) => ({ value: at.id, label: at.name, color: at.color ?? undefined })),
        hasMore: res.has_next ?? false,
      };
    },
    [],
  );

  // async-select fetch functions
  const fetchTemplates = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllTemplates(organizationId, search, page, pageSize);
      return {
        options: (res.data ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next ?? false,
      };
    },
    [organizationId],
  );

  const fetchUsers = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? organizationId, page, pageSize, search);
      return {
        options: (res.data ?? []).map((u) => ({
          value: u.id,
          label: [u.name, u.last_name].filter(Boolean).join(" "),
        })),
        hasMore: res.has_next ?? false,
      };
    },
    [organizationId, selectedOrganizationId],
  );

  const LIFECYCLE_STATES = [
    { value: "__all__",     label: t("filters.all") },
    { value: "draft",       label: tAssets("lifecycle.stateLabels.draft") },
    { value: "in_review",   label: tAssets("lifecycle.stateLabels.in_review") },
    { value: "in_approval", label: tAssets("lifecycle.stateLabels.in_approval") },
    { value: "approved",    label: tAssets("lifecycle.stateLabels.approved") },
    { value: "published",   label: tAssets("lifecycle.stateLabels.published") },
    { value: "archived",    label: tAssets("lifecycle.stateLabels.archived") },
  ];

  const activeCount = countActiveFilters(applied);

  function handleApply() {
    setApplied(pending);
    onApply(pending);
  }

  function handleClear() {
    setPending(defaultFilters);
    setApplied(defaultFilters);
    onApply(defaultFilters);
  }

  return (
    <HuemulFilters
      title={t("filters.title")}
      defaultOpen={defaultOpen}
      onApply={handleApply}
      onClear={handleClear}
      hasActiveFilters={activeCount > 0}
    >
      <>
        {/* Search Type */}
        <HuemulField
          type="select"
          label={t("filters.searchType")}
          value={searchType}
          onChange={(v) => onSearchTypeChange(v as SearchType)}
          options={[
            { value: "semantic", label: t("page.typesSemantic") },
            { value: "title",   label: t("page.typesTitle") },
            { value: "code",    label: t("page.typesCode") },
            { value: "content", label: t("page.typesContent") },
          ]}
          selectSize="xs"
          className="w-auto"
          inputClassName="w-32 h-8 text-xs"
        />

        <div className="w-px h-8 bg-border self-end" />

        {/* Asset Type */}
        <HuemulField
          type="async-select"
          label={t("filters.assetType")}
          placeholder={t("filters.all")}
          value={pending.document_type_id ?? ""}
          onChange={(v) => setPending((p) => ({ ...p, document_type_id: v ? String(v) : null }))}
          fetchOptions={fetchAssetTypes}
          pageSize={20}
          className="w-auto"
          inputClassName="w-36 h-8 text-xs"
        />

        {/* Template */}
        <HuemulField
          type="async-select"
          label={t("filters.template")}
          placeholder={t("filters.all")}
          value={pending.template_id ?? ""}
          onChange={(v) => {
            setPending((p) => ({ ...p, template_id: v ? String(v) : null }));
            if (!v) setTemplateLabel(undefined);
          }}
          fetchOptions={fetchTemplates}
          pageSize={20}
          selectedLabel={templateLabel}
          className="w-auto"
          inputClassName="w-36 h-8 text-xs"
        />

        {/* Owner */}
        <HuemulField
          type="async-select"
          label={t("filters.ownerScope")}
          placeholder={t("filters.allOwners")}
          value={pending.ownerValue ?? ""}
          onChange={(v) => setPending((p) => ({ ...p, ownerValue: v ? String(v) : null }))}
          asyncStaticOptions={[{ value: "__me__", label: t("filters.ownerMe"), description: t("filters.ownerMeDescription") }]}
          asyncStaticOptionsLabel={t("filters.ownerScopeLabel")}
          asyncResultsLabel={t("filters.ownerUsersLabel")}
          fetchOptions={fetchUsers}
          pageSize={20}
          className="w-auto"
          inputClassName="w-44 h-8 text-xs"
        />

        {/* Lifecycle State */}
        <HuemulField
          type="select"
          label={t("filters.lifecycleState")}
          placeholder={t("filters.all")}
          value={pending.lifecycle_state ?? "__all__"}
          onChange={(v) => setPending((p) => ({ ...p, lifecycle_state: v === "__all__" ? null : String(v) }))}
          options={LIFECYCLE_STATES}
          selectSize="xs"
          className="w-auto"
          inputClassName="w-44 h-8 text-xs"
        />

        <div className="w-px h-8 bg-border self-end" />

        {/* Expiration Date */}
        <HuemulField
          type="date-range"
          label={t("filters.expirationDate")}
          dateValue={pending.expiration_date ?? ''}
          dateRangeFrom={pending.expiration_date_from ?? ''}
          dateRangeTo={pending.expiration_date_to ?? ''}
          onDateChange={(v) => setPending((p) => ({ ...p, expiration_date: v, expiration_date_from: '', expiration_date_to: '' }))}
          onDateRangeChange={(from, to) => setPending((p) => ({ ...p, expiration_date: '', expiration_date_from: from, expiration_date_to: to }))}
          className="w-auto"
          inputClassName="w-52 h-8 text-xs"
        />

        {/* Estimated Publication Date */}
        <HuemulField
          type="date-range"
          label={t("filters.estimatedPublicationDate")}
          dateValue={pending.estimated_publication_date ?? ''}
          dateRangeFrom={pending.estimated_publication_date_from ?? ''}
          dateRangeTo={pending.estimated_publication_date_to ?? ''}
          onDateChange={(v) => setPending((p) => ({ ...p, estimated_publication_date: v, estimated_publication_date_from: '', estimated_publication_date_to: '' }))}
          onDateRangeChange={(from, to) => setPending((p) => ({ ...p, estimated_publication_date: '', estimated_publication_date_from: from, estimated_publication_date_to: to }))}
          className="w-auto"
          inputClassName="w-52 h-8 text-xs"
        />

        {/* Review Date */}
        <HuemulField
          type="date-range"
          label={t("filters.reviewDate")}
          dateValue={pending.review_date ?? ''}
          dateRangeFrom={pending.review_date_from ?? ''}
          dateRangeTo={pending.review_date_to ?? ''}
          onDateChange={(v) => setPending((p) => ({ ...p, review_date: v, review_date_from: '', review_date_to: '' }))}
          onDateRangeChange={(from, to) => setPending((p) => ({ ...p, review_date: '', review_date_from: from, review_date_to: to }))}
          className="w-auto"
          inputClassName="w-52 h-8 text-xs"
        />

        {/* Audit Date */}
        <HuemulField
          type="date-range"
          label={t("filters.auditDate")}
          dateValue={pending.audit_date ?? ''}
          dateRangeFrom={pending.audit_date_from ?? ''}
          dateRangeTo={pending.audit_date_to ?? ''}
          onDateChange={(v) => setPending((p) => ({ ...p, audit_date: v, audit_date_from: '', audit_date_to: '' }))}
          onDateRangeChange={(from, to) => setPending((p) => ({ ...p, audit_date: '', audit_date_from: from, audit_date_to: to }))}
          className="w-auto"
          inputClassName="w-52 h-8 text-xs"
        />

        <div className="w-px h-8 bg-border self-end" />

        {/* LLM toggle — only for semantic */}
        {searchType === "semantic" && (
          <HuemulField
            type="switch"
            label={t("filters.filterWithLlmShort")}
            inline={false}
            value={pending.filter_with_llm}
            onChange={(v) => setPending((p) => ({ ...p, filter_with_llm: Boolean(v) }))}
            className="w-auto"
            controlClassName="h-8 flex items-center"
          />
        )}

        <HuemulField
          type="switch"
          label={t("filters.unresolvedComments")}
          inline={false}
          value={pending.has_unresolved_comments ?? false}
          onChange={(v) => setPending((p) => ({ ...p, has_unresolved_comments: Boolean(v) }))}
          className="w-auto"
          controlClassName="h-8 flex items-center"
        />

        {/* Pending AI suggestion */}
        <HuemulField
          type="switch"
          label={t("filters.pendingAiSuggestion")}
          inline={false}
          value={pending.has_pending_ai_suggestion ?? false}
          onChange={(v) => setPending((p) => ({ ...p, has_pending_ai_suggestion: Boolean(v) }))}
          className="w-auto"
          controlClassName="h-8 flex items-center"
        />

      </>
    </HuemulFilters>
  );
}

