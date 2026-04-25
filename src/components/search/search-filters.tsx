import { useState, useCallback } from "react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { X } from "lucide-react";
import { getAssetTypes } from "@/services/asset-types";
import { getUsers } from "@/services/users";
import { getAllTemplates } from "@/services/templates";
import type { SearchType } from "@/services/search";
import { useTranslation } from "react-i18next";
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field";
import { useOrganization } from "@/contexts/organization-context";

export interface SearchFilterValues {
  document_type_id?: string | null;
  template_id?: string | null;
  created_by?: string | null;
  lifecycle_state?: string | null;
  filter_with_llm: boolean;
}

interface SearchFiltersProps {
  organizationId: string;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onApply: (filters: SearchFilterValues) => void;
  initialFilters?: SearchFilterValues;
}

function countActiveFilters(f: SearchFilterValues): number {
  let count = 0;
  if (f.document_type_id) count++;
  if (f.template_id) count++;
  if (f.created_by) count++;
  if (f.lifecycle_state) count++;
  if (!f.filter_with_llm) count++;
  return count;
}

export function SearchFilters({ organizationId, searchType, onSearchTypeChange, onApply, initialFilters }: SearchFiltersProps) {
  const { t } = useTranslation("search");
  const { t: tAssets } = useTranslation("assets");

  const defaultFilters: SearchFilterValues = {
    document_type_id: null,
    template_id: null,
    created_by: null,
    lifecycle_state: null,
    filter_with_llm: true,
  };

  const base = initialFilters ?? defaultFilters;
  const [pending, setPending] = useState<SearchFilterValues>(base);
  const [applied, setApplied] = useState<SearchFilterValues>(base);

  // Pre-selected labels for async-select (restored from URL on mount)
  const [templateLabel, setTemplateLabel] = useState<string | undefined>(undefined);
  const [createdByLabel, setCreatedByLabel] = useState<string | undefined>(undefined);

  const { selectedOrganizationId } = useOrganization();

  const fetchAssetTypes = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAssetTypes(page, pageSize, search);
      return {
        options: (res.data ?? []).map((at) => ({ value: at.id, label: at.name })),
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
    <div className="mb-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-end gap-3">
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

        {/* Created By */}
        <HuemulField
          type="async-select"
          label={t("filters.createdBy")}
          placeholder={t("filters.all")}
          value={pending.created_by ?? ""}
          onChange={(v) => {
            setPending((p) => ({ ...p, created_by: v ? String(v) : null }));
            if (!v) setCreatedByLabel(undefined);
          }}
          fetchOptions={fetchUsers}
          pageSize={20}
          selectedLabel={createdByLabel}
          className="w-auto"
          inputClassName="w-36 h-8 text-xs"
        />

        {/* Lifecycle State */}
        <HuemulField
          type="select"
          label={t("filters.lifecycleState")}
          placeholder={t("filters.all")}
          value={pending.lifecycle_state ?? ""}
          onChange={(v) => setPending((p) => ({ ...p, lifecycle_state: v ? String(v) : null }))}
          options={LIFECYCLE_STATES}
          selectSize="xs"
          className="w-auto"
          inputClassName="w-44 h-8 text-xs"
        />

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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-end gap-1.5 pb-0.5">
          {activeCount > 0 && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={X}
              label={t("filters.clearAll")}
              onClick={handleClear}
              className="h-8 text-xs text-muted-foreground"
            />
          )}
          <HuemulButton
            size="sm"
            label={t("filters.apply")}
            onClick={handleApply}
            className="h-8 text-xs px-4"
          />
        </div>
      </div>
    </div>
  );
}

