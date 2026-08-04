import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GitBranch } from "lucide-react";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useOrganization } from "@/contexts/organization-context";
import { formatApiDateTime } from "@/lib/utils";
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils";
import type { DependencyVersionMode } from "@/types/dependency/sheets";
import type { Execution } from "@/types/execution";
import type { DependencyVersionDialogProps } from "@/types/dependency/sheets";

export type { DependencyVersionDialogProps } from "@/types/dependency/sheets";

export function DependencyVersionDialog({
  open,
  onOpenChange,
  dependsOnDocumentId,
  dependsOnDocumentName,
  dependency,
  onConfirm,
  isSubmitting = false,
}: DependencyVersionDialogProps) {
  const { t } = useTranslation('dependencies');
  const { canList } = useUserPermissions();
  const canListVersions = canList('version');
  const { selectedOrganizationId } = useOrganization();
  const isEditing = !!dependency;

  const [versionMode, setVersionMode] = useState<DependencyVersionMode>('published');
  const [executionId, setExecutionId] = useState<string | null>(null);

  // Seed form state whenever the dialog opens (creation defaults to 'published',
  // editing seeds from the existing dependency).
  useEffect(() => {
    if (!open) return;
    setVersionMode(dependency?.version_mode ?? 'published');
    setExecutionId(dependency?.depends_on_execution_id ?? null);
  }, [open, dependency]);

  // Not paginated on the backend — lists every execution of the document in one shot.
  // Fine for a client-side filtered combobox; if a document ever accumulates more
  // versions than a single page, only the first page will show here.
  const { data: executions = [], isFetching: isFetchingExecutions } = useExecutionsByDocumentId(
    dependsOnDocumentId,
    selectedOrganizationId ?? '',
    open && versionMode === 'specific' && canListVersions && !!selectedOrganizationId,
  );

  const executionOptions = useMemo(() => {
    return (executions as Execution[]).map((execution) => ({
      value: execution.id,
      label: getExecutionDisplayLabel(execution),
      description: [
        t(`assets:lifecycle.stateLabels.${execution.lifecycle_state}`),
        formatApiDateTime(execution.created_at),
      ].filter(Boolean).join(' · '),
    }));
  }, [executions, t]);

  const selectedExecution = useMemo(
    () => (executions as Execution[]).find((execution) => execution.id === executionId) ?? null,
    [executions, executionId],
  );

  const versionModeOptions = [
    { label: t('versionMode.published'), value: 'published' },
    { label: t('versionMode.latestApproved'), value: 'latest_approved' },
    { label: t('versionMode.specific'), value: 'specific' },
  ];

  const versionModeHint: Record<DependencyVersionMode, string> = {
    published: t('versionMode.publishedHint'),
    latest_approved: t('versionMode.latestApprovedHint'),
    specific: canListVersions ? t('versionMode.specificHint') : t('versionMode.specificNoPermission'),
  };

  const isValid = versionMode !== 'specific' || (canListVersions && !!executionId);

  async function handleConfirm() {
    if (!isValid) return;
    await onConfirm({
      version_mode: versionMode,
      depends_on_execution_id: versionMode === 'specific' ? executionId : null,
    });
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(nextOpen) => { if (!isSubmitting) onOpenChange(nextOpen); }}
      title={isEditing ? t('versionDialog.editTitle') : t('versionDialog.createTitle')}
      icon={GitBranch}
      maxWidth="sm:max-w-[520px]"
      saveAction={{
        label: isEditing ? t('versionDialog.confirmEdit') : t('versionDialog.confirmCreate'),
        onClick: handleConfirm,
        disabled: !isValid,
        loading: isSubmitting,
        closeOnSuccess: false,
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm font-medium text-gray-900">
          {t('versionDialog.documentLabel', { name: dependsOnDocumentName })}
        </p>

        <HuemulField
          type="radio"
          label={t('versionMode.label')}
          options={versionModeOptions}
          value={versionMode}
          onChange={(value) => setVersionMode(value as DependencyVersionMode)}
          helpText={versionModeHint[versionMode]}
          disabled={isSubmitting}
        />

        {versionMode === 'specific' && canListVersions && (
          <HuemulField
            type="combobox"
            label={t('versionDialog.executionLabel')}
            placeholder={isFetchingExecutions ? t('loading') : t('versionDialog.executionPlaceholder')}
            options={executionOptions}
            value={executionId ?? ''}
            onChange={(value) => setExecutionId(String(value) || null)}
            disabled={isSubmitting || isFetchingExecutions}
            helpText={!isFetchingExecutions && executionOptions.length === 0 ? t('versionDialog.executionEmpty') : undefined}
          />
        )}

        {versionMode === 'specific' && selectedExecution && (
          <HuemulLifecycleBadge state={selectedExecution.lifecycle_state} className="self-start" />
        )}
      </div>
    </HuemulDialog>
  );
}
