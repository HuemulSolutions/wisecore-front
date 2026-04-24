import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings2,
  Calendar,
  Info,
  Save,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField } from '@/huemul/components/huemul-field';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { getExecutionById, updateExecutionName, updateExecutionBusinessDates } from '@/services/executions';
import { formatApiDateTime, parseApiDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

interface ExecutionSummary {
  id: string;
  name: string;
  status: string;
  created_at: string;
  version?: string | null;
  lifecycle_state?: string;
}

interface VersionManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executions: ExecutionSummary[];
  organizationId: string;
  canEdit: boolean;
  documentId: string;
  /** The execution currently viewed in the document — used to pre-select the version */
  initialExecutionId?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  running: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Running' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  approved: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Approved' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

function toInputDate(isoDate?: string | null): string {
  if (!isoDate) return '';
  try {
    return format(parseISO(isoDate), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

// ── Edit Form ──────────────────────────────────────────────────────────────

interface EditFormState {
  name: string;
  expiration_date: string;
  estimated_publication_date: string;
  review_date: string;
  audit_date: string;
}

interface ExecutionDetailProps {
  executionId: string;
  organizationId: string;
  canEdit: boolean;
  onSaved: () => void;
}

function ExecutionDetail({
  executionId,
  organizationId,
  canEdit,
  onSaved,
}: ExecutionDetailProps) {
  const { t } = useTranslation('assets');
  const queryClient = useQueryClient();

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution-detail', executionId],
    queryFn: () => getExecutionById(executionId, organizationId),
    enabled: !!executionId && !!organizationId,
    staleTime: 30000,
  });

  const [form, setForm] = useState<EditFormState>({
    name: '',
    expiration_date: '',
    estimated_publication_date: '',
    review_date: '',
    audit_date: '',
  });

  const [nameError, setNameError] = useState('');
  const [isDirtyName, setIsDirtyName] = useState(false);
  const [isDirtyDates, setIsDirtyDates] = useState(false);

  // Sync form state when execution loads or changes
  useEffect(() => {
    if (execution) {
      setForm({
        name: execution.name ?? '',
        expiration_date: toInputDate(execution.expiration_date),
        estimated_publication_date: toInputDate(execution.estimated_publication_date),
        review_date: toInputDate(execution.review_date),
        audit_date: toInputDate(execution.audit_date),
      });
      setIsDirtyName(false);
      setIsDirtyDates(false);
      setNameError('');
    }
  }, [execution]);

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateExecutionName(executionId, name, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-detail', executionId] });
      queryClient.invalidateQueries({ queryKey: ['document-content'] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      setIsDirtyName(false);
      onSaved();
    },
    meta: { successMessage: t('mutations.versionRenamed') },
  });

  const datesMutation = useMutation({
    mutationFn: (dates: Omit<EditFormState, 'name'>) =>
      updateExecutionBusinessDates(
        executionId,
        {
          expiration_date: dates.expiration_date ? dates.expiration_date.slice(0, 10) : null,
          estimated_publication_date: dates.estimated_publication_date ? dates.estimated_publication_date.slice(0, 10) : null,
          review_date: dates.review_date ? dates.review_date.slice(0, 10) : null,
          audit_date: dates.audit_date ? dates.audit_date.slice(0, 10) : null,
        },
        organizationId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-detail', executionId] });
      setIsDirtyDates(false);
      onSaved();
    },
    meta: { successMessage: t('versionManagement.datesSaved') },
  });

  const handleNameChange = (value: string | number | boolean) => {
    const str = String(value);
    setForm((prev) => ({ ...prev, name: str }));
    setIsDirtyName(str !== (execution?.name ?? ''));
    setNameError(str.trim() === '' ? t('versionManagement.nameRequired') : '');
  };

  const handleDateChange = (field: keyof Omit<EditFormState, 'name'>) => (value: string | number | boolean) => {
    const str = String(value);
    setForm((prev) => {
      const updated = { ...prev, [field]: str };
      const original = {
        expiration_date: toInputDate(execution?.expiration_date),
        estimated_publication_date: toInputDate(execution?.estimated_publication_date),
        review_date: toInputDate(execution?.review_date),
        audit_date: toInputDate(execution?.audit_date),
      };
      const dirty =
        updated.expiration_date !== original.expiration_date ||
        updated.estimated_publication_date !== original.estimated_publication_date ||
        updated.review_date !== original.review_date ||
        updated.audit_date !== original.audit_date;
      setIsDirtyDates(dirty);
      return updated;
    });
  };

  const handleSaveName = () => {
    if (!form.name.trim()) {
      setNameError(t('versionManagement.nameRequired'));
      return;
    }
    renameMutation.mutate(form.name.trim());
  };

  const handleSaveDates = () => {
    datesMutation.mutate({
      expiration_date: form.expiration_date,
      estimated_publication_date: form.estimated_publication_date,
      review_date: form.review_date,
      audit_date: form.audit_date,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!execution) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Version metadata */}
      <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground">{t('versionManagement.versionInfo')}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">{t('versionManagement.status')}</span>
          <StatusBadge status={execution.status} />
          <span className="text-xs font-medium uppercase tracking-wide">{t('versionManagement.lifecycle')}</span>
          <span className="text-xs">{execution.lifecycle_state ?? '—'}</span>
          <span className="text-xs font-medium uppercase tracking-wide">{t('versionManagement.createdAt')}</span>
          <span className="text-xs">{formatApiDateTime(execution.created_at)}</span>
          {execution.version && (
            <>
              <span className="text-xs font-medium uppercase tracking-wide">{t('versionManagement.semanticVersion')}</span>
              <span className="text-xs font-mono">{execution.version}</span>
            </>
          )}
          {execution.created_by_user && (
            <>
              <span className="text-xs font-medium uppercase tracking-wide">{t('versionManagement.createdBy')}</span>
              <span className="text-xs">{`${execution.created_by_user.name} ${execution.created_by_user.last_name}`}</span>
            </>
          )}
        </div>
      </div>

      {/* Name field */}
      {canEdit && !execution.version && (
        <div className="flex flex-col gap-3">
          <HuemulField
            type="text"
            label={t('versionManagement.versionName')}
            value={form.name}
            onChange={handleNameChange}
            placeholder={t('versionManagement.versionNamePlaceholder')}
            error={nameError}
            disabled={renameMutation.isPending}
          />
          {isDirtyName && (
            <HuemulButton
              size="sm"
              icon={Save}
              label={t('versionManagement.saveName')}
              disabled={!form.name.trim()}
              loading={renameMutation.isPending}
              className="self-end"
              onClick={handleSaveName}
            />
          )}
        </div>
      )}

      {(!canEdit || execution.version) && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{t('versionManagement.versionName')}</span>
          <span className="text-sm text-muted-foreground">{execution.name ?? '—'}</span>
        </div>
      )}

      {/* Business dates */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('versionManagement.businessDates')}</span>
        </div>

        <HuemulField
          type="date"
          label={t('versionManagement.expirationDate')}
          value={form.expiration_date}
          onChange={handleDateChange('expiration_date')}
          disabled={!canEdit || datesMutation.isPending}
        />

        <HuemulField
          type="date"
          label={t('versionManagement.estimatedPublicationDate')}
          value={form.estimated_publication_date}
          onChange={handleDateChange('estimated_publication_date')}
          disabled={!canEdit || datesMutation.isPending}
        />

        <HuemulField
          type="date"
          label={t('versionManagement.reviewDate')}
          value={form.review_date}
          onChange={handleDateChange('review_date')}
          disabled={!canEdit || datesMutation.isPending}
        />

        <HuemulField
          type="date"
          label={t('versionManagement.auditDate')}
          value={form.audit_date}
          onChange={handleDateChange('audit_date')}
          disabled={!canEdit || datesMutation.isPending}
        />

        {canEdit && isDirtyDates && (
          <HuemulButton
            size="sm"
            icon={Save}
            label={t('versionManagement.saveDates')}
            loading={datesMutation.isPending}
            className="self-end"
            onClick={handleSaveDates}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Sheet ─────────────────────────────────────────────────────────────

export function VersionManagementSheet({
  open,
  onOpenChange,
  executions,
  organizationId,
  canEdit,
  documentId,
  initialExecutionId,
}: VersionManagementSheetProps) {
  const { t } = useTranslation('assets');
  const queryClient = useQueryClient();

  const sortedExecutions = [...executions].sort(
    (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
  );

  // Initialize to the currently viewed execution (or the latest as fallback)
  const defaultId = initialExecutionId ?? sortedExecutions[0]?.id ?? null;
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(defaultId);

  // When the sheet opens, sync to the latest initialExecutionId
  useEffect(() => {
    if (open) {
      setSelectedExecutionId(initialExecutionId ?? sortedExecutions[0]?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
  };

  // Build display label for each execution in the select
  const getLabel = (exec: ExecutionSummary, index: number): string => {
    if (exec.version) return exec.version;
    if (exec.name) return exec.name;
    return t('versionManagement.versionFallback', { number: sortedExecutions.length - index });
  };


  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('versionManagement.title')}
      icon={Settings2}
      showFooter={false}
      maxWidth="sm:max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Version selector */}
        <HuemulField
          type="select"
          label={t('versionManagement.selectVersion')}
          value={selectedExecutionId ?? ''}
          onChange={(val) => setSelectedExecutionId(String(val))}
          placeholder={t('versionManagement.selectVersionPlaceholder')}
          options={sortedExecutions.map((exec, index) => ({
            value: exec.id,
            label: getLabel(exec, index),
          }))}
        />

        {/* Detail form */}
        {selectedExecutionId ? (
          <ExecutionDetail
            key={selectedExecutionId}
            executionId={selectedExecutionId}
            organizationId={organizationId}
            canEdit={canEdit}
            onSaved={handleSaved}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t('versionManagement.noVersionSelected')}</p>
        )}
      </div>
    </HuemulSheet>
  );
}

