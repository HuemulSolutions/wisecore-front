import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { HuemulField } from "@/huemul/components/huemul-field";
import { createDocumentType, updateDocumentType, getDocumentTypeById } from "@/services/document-types";
import { getErrorMessage, isErrorCode } from "@/lib/error-utils";
import type { DocumentType, CreateDocumentTypeData, FinalLifecycleStage } from "@/types/document-types";

const DEFAULT_COLOR = "#3B82F6";

/** Opciones del selector "Etapa final del ciclo de vida" — orden del pipeline. */
export const FINAL_STAGE_OPTIONS: FinalLifecycleStage[] = ["edit", "review", "approve", "publish"];

interface AssetTypeGeneralFormValues {
  name: string;
  color: string;
  requiresIsoStrictVersioning: boolean;
  finalLifecycleStage: FinalLifecycleStage;
}

const DEFAULT_VALUES: AssetTypeGeneralFormValues = {
  name: "",
  color: DEFAULT_COLOR,
  requiresIsoStrictVersioning: true,
  finalLifecycleStage: "publish",
};

interface UseAssetTypeGeneralFormOptions {
  /** Id del tipo a editar; ausente/undefined ⇒ modo crear. */
  documentTypeId?: string;
  type?: 'document' | 'asset';
  /** Solo dispara el fetch de precarga cuando la superficie está visible. */
  enabled?: boolean;
  onSaved?: (result: DocumentType) => void;
}

export interface AssetTypeGeneralForm {
  values: AssetTypeGeneralFormValues;
  setName: (value: string) => void;
  setColor: (value: string) => void;
  setRequiresIsoStrictVersioning: (value: boolean) => void;
  setFinalLifecycleStage: (value: FinalLifecycleStage) => void;
  isEditing: boolean;
  isLoadingData: boolean;
  isSaving: boolean;
  isDirty: boolean;
  canSubmit: boolean;
  error: string | null;
  /** Error de validación del campo nombre (se muestra inline). */
  nameError: string | null;
  submit: () => Promise<void>;
  /** Vuelve a los valores cargados del backend, descartando la edición. */
  discard: () => void;
  reset: () => void;
}

/**
 * Lógica compartida del formulario "General" de un tipo de activo (nombre, color
 * y versionado ISO). La consumen tanto el sheet de creación como el tab General
 * del sheet de configuración.
 */
export function useAssetTypeGeneralForm({
  documentTypeId,
  type = 'document',
  enabled = true,
  onSaved,
}: UseAssetTypeGeneralFormOptions): AssetTypeGeneralForm {
  const { t } = useTranslation(['asset-types', 'common']);
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  const isEditing = !!documentTypeId;

  const [values, setValues] = useState<AssetTypeGeneralFormValues>(DEFAULT_VALUES);
  const [baseline, setBaseline] = useState<AssetTypeGeneralFormValues>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  const { data: documentTypeData, isLoading: isLoadingData } = useQuery({
    queryKey: ['document-type', documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId!),
    enabled: isEditing && !!documentTypeId && enabled,
  });

  // Precarga los valores del backend y fija la línea base contra la que se
  // calcula `isDirty`.
  useEffect(() => {
    if (!documentTypeData?.data) return;
    const loaded: AssetTypeGeneralFormValues = {
      name: documentTypeData.data.name,
      color: documentTypeData.data.color,
      requiresIsoStrictVersioning: documentTypeData.data.requires_iso_strict_versioning ?? true,
      finalLifecycleStage: documentTypeData.data.final_lifecycle_stage ?? "publish",
    };
    setValues(loaded);
    setBaseline(loaded);
  }, [documentTypeData]);

  const reset = useCallback(() => {
    setValues(DEFAULT_VALUES);
    setBaseline(DEFAULT_VALUES);
    setError(null);
  }, []);

  const discard = useCallback(() => {
    setValues(baseline);
    setError(null);
  }, [baseline]);

  const mutation = useMutation({
    mutationFn: (data: CreateDocumentTypeData) => {
      if (isEditing && documentTypeId) {
        return updateDocumentType(documentTypeId, data);
      }
      return createDocumentType(data);
    },
    onSuccess: (result) => {
      const queryKey = type === 'asset' ? 'asset-types' : 'document-types';
      queryClient.invalidateQueries({ queryKey: [queryKey, 'list-with-roles'] });
      queryClient.invalidateQueries({ queryKey: [queryKey, selectedOrganizationId] });
      // Always invalidate the document-types list so canvas/relationship pages refresh
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      if (isEditing && documentTypeId) {
        queryClient.invalidateQueries({ queryKey: ['document-type', documentTypeId] });
      }
      onSaved?.(result);
    },
    onError: (err) => {
      if (isErrorCode(err, 'FINAL_STAGE_REQUIRES_NON_STRICT_ISO')) {
        setError(finalStageRequiresNonStrictIsoMessage);
        return;
      }
      setError(getErrorMessage(err, t(isEditing ? 'asset-types:form.errorUpdating' : 'asset-types:form.errorCreating', { type })));
    },
  });

  const submit = useCallback(async () => {
    if (!values.name.trim()) {
      setError(t('asset-types:form.nameRequired'));
      return;
    }

    setError(null);

    await mutation.mutateAsync({
      name: values.name.trim(),
      color: values.color,
      requires_iso_strict_versioning: values.requiresIsoStrictVersioning,
      final_lifecycle_stage: values.finalLifecycleStage,
    });

    // Tras guardar, los valores enviados pasan a ser la nueva línea base.
    setBaseline({
      name: values.name.trim(),
      color: values.color,
      requiresIsoStrictVersioning: values.requiresIsoStrictVersioning,
      finalLifecycleStage: values.finalLifecycleStage,
    });
  }, [values, mutation, t]);

  const isDirty =
    values.name !== baseline.name ||
    values.color !== baseline.color ||
    values.requiresIsoStrictVersioning !== baseline.requiresIsoStrictVersioning ||
    values.finalLifecycleStage !== baseline.finalLifecycleStage;

  const nameRequiredMessage = t('asset-types:form.nameRequired');
  const finalStageRequiresNonStrictIsoMessage = t('asset-types:form.finalStageRequiresNonStrictIso');

  return {
    values,
    setName: (value) => setValues((prev) => ({ ...prev, name: value })),
    setColor: (value) => setValues((prev) => ({ ...prev, color: value })),
    setRequiresIsoStrictVersioning: (value) =>
      setValues((prev) => ({
        ...prev,
        requiresIsoStrictVersioning: value,
        // final_lifecycle_stage distinto de "publish" solo es válido sin ISO
        // estricto: al reactivarlo, el selector se oculta pero su valor previo
        // seguía vivo en el estado y hubiera viajado igual en el próximo submit.
        finalLifecycleStage: value ? "publish" : prev.finalLifecycleStage,
      })),
    setFinalLifecycleStage: (value) =>
      setValues((prev) => ({ ...prev, finalLifecycleStage: value })),
    isEditing,
    isLoadingData: isEditing && isLoadingData,
    isSaving: mutation.isPending,
    isDirty,
    canSubmit: !!values.name.trim() && (!isEditing || isDirty),
    error: error && error !== nameRequiredMessage ? error : null,
    nameError: error === nameRequiredMessage ? error : null,
    submit,
    discard,
    reset,
  };
}

interface AssetTypeGeneralFormFieldsProps {
  form: AssetTypeGeneralForm;
  type?: 'document' | 'asset';
  disabled?: boolean;
}

export function AssetTypeGeneralFormFields({
  form,
  type = 'document',
  disabled = false,
}: AssetTypeGeneralFormFieldsProps) {
  const { t } = useTranslation('asset-types');

  return (
    <div className="space-y-4">
      <HuemulField
        label={t(type === 'asset' ? 'form.assetNameLabel' : 'form.documentNameLabel')}
        name="name"
        value={form.values.name}
        onChange={(v) => form.setName(String(v))}
        placeholder={t(type === 'asset' ? 'form.assetNameLabel' : 'form.documentNameLabel')}
        error={form.nameError ?? undefined}
        disabled={disabled}
        required
      />

      <HuemulField
        type="color"
        label={t('form.color')}
        name="color"
        value={form.values.color}
        onChange={(v) => form.setColor(String(v))}
        disabled={disabled}
      />

      <HuemulField
        type="switch"
        label={t('form.requiresIsoStrictVersioning')}
        description={t('form.requiresIsoStrictVersioningDescription')}
        name="requires_iso_strict_versioning"
        value={form.values.requiresIsoStrictVersioning}
        onChange={(v) => form.setRequiresIsoStrictVersioning(v as boolean)}
        disabled={disabled}
      />

      {!form.values.requiresIsoStrictVersioning && (
        <HuemulField
          type="select"
          label={t('form.finalLifecycleStage')}
          description={t('form.finalLifecycleStageDescription')}
          name="final_lifecycle_stage"
          value={form.values.finalLifecycleStage}
          onChange={(v) => form.setFinalLifecycleStage(v as FinalLifecycleStage)}
          options={FINAL_STAGE_OPTIONS.map((value) => ({
            value,
            label: t(`form.finalLifecycleStageOptions.${value}`),
          }))}
          disabled={disabled}
        />
      )}

      {form.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {form.error}
        </div>
      )}
    </div>
  );
}
