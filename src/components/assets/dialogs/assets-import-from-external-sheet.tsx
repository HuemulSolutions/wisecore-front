"use client"

import * as React from "react"
import { useState } from "react"
import { Sparkles, Clock, Loader2, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Button } from "@/components/ui/button"
import { useExternalSystems } from "@/hooks/useExternalSystems"
import { useExternalFunctionalities } from "@/hooks/useExternalFunctionalities"
import { useExternalAssetImportMutation, useExternalAssetImportRun } from "@/hooks/useExternalAssetImport"
import { buildExternalInputFields } from "@/lib/external-input-placeholders"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { toast } from "sonner"
import { ApiError } from "@/types/api-error"
import { getErrorMessage, handleApiError } from "@/lib/error-utils"
import type { ImportAssetFromExternalSheetProps } from '@/types/assets'
import type { ExternalAssetImportErrorCode, ExternalAssetImportRun } from '@/types/external-asset-import'
export type { ImportAssetFromExternalSheetProps } from '@/types/assets'

// 120s backend timeout + margin for network/cold start.
const EXTERNAL_IMPORT_TIMEOUT_MS = 150_000

interface CustomPair {
  id: string
  key: string
  value: string
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

export function ImportAssetFromExternalSheet({
  open,
  onOpenChange,
  folderId,
  onAssetCreated,
}: ImportAssetFromExternalSheetProps) {
  const { selectedOrganizationId } = useOrganization()
  const { isOrgAdmin, hasAnyPermission } = useUserPermissions()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')

  const canListSystems = isOrgAdmin || hasAnyPermission(['external_system:l', 'external_system:r'])
  const canListFunctionalities = isOrgAdmin || hasAnyPermission(['external_functionality:l', 'external_functionality:r'])
  const canBrowseExternalCatalog = canListSystems && canListFunctionalities

  const [systemId, setSystemId] = useState("")
  const [functionalityId, setFunctionalityId] = useState("")
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [customPairs, setCustomPairs] = useState<CustomPair[]>([])

  // Importación asíncrona en curso: la extensión aceptó la tarea (202) y el
  // activo se crea cuando llama al callback. Se consulta el run hasta que termine.
  const [pendingRunId, setPendingRunId] = useState<string | null>(null)

  const importMutation = useExternalAssetImportMutation(selectedOrganizationId ?? '')
  const runQuery = useExternalAssetImportRun(selectedOrganizationId ?? '', pendingRunId, { enabled: open })
  const isWaitingForExtension = pendingRunId !== null
  const isPending = importMutation.isPending
  const isBusy = isPending || isWaitingForExtension

  // Reset on open — guarded so a mid-flight org change doesn't wipe the form
  // while a 2-minute request (or an async import) is still running.
  React.useEffect(() => {
    if (open && !isBusy) {
      setSystemId("")
      setFunctionalityId("")
      setInputValues({})
      setCustomPairs([])
    }
  }, [open, selectedOrganizationId, isBusy])

  const { data: systemsData, isLoading: isLoadingSystems } = useExternalSystems(selectedOrganizationId ?? '', {
    pageSize: 200,
    status: 'active',
    enabled: open && !!selectedOrganizationId && canListSystems,
  })
  const systems = systemsData?.data ?? []

  const { data: functionalitiesData, isLoading: isLoadingFunctionalities } = useExternalFunctionalities(
    selectedOrganizationId ?? '',
    systemId,
    {
      objective: 'import_asset',
      pageSize: 200,
      enabled: open && !!selectedOrganizationId && !!systemId && canListFunctionalities,
    },
  )
  const functionalities = functionalitiesData?.data ?? []

  const selectedFunctionality = functionalities.find((f) => f.id === functionalityId)
  const isAsyncFunctionality = selectedFunctionality?.execution_type === 'async'
  const inputFields = React.useMemo(
    () => buildExternalInputFields(selectedFunctionality?.body),
    [selectedFunctionality?.body],
  )
  const isGenericMode = !!functionalityId && inputFields.length === 0

  const handleSystemChange = (value: string) => {
    setSystemId(value)
    setFunctionalityId("")
    setInputValues({})
    setCustomPairs([])
  }

  const handleFunctionalityChange = (value: string) => {
    setFunctionalityId(value)
    setInputValues({})
    setCustomPairs([])
  }

  const handleAddPair = () => {
    setCustomPairs((prev) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }])
  }

  const handleRemovePair = (id: string) => {
    setCustomPairs((prev) => prev.filter((p) => p.id !== id))
  }

  const handlePairChange = (id: string, field: 'key' | 'value', value: string) => {
    setCustomPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const systemOptions = systems.map((s) => ({ value: s.id, label: s.name }))
  const functionalityOptions = functionalities.map((f) => ({ value: f.id, label: f.name }))

  const ERROR_MESSAGE_KEYS: Record<string, string> = {
    INVALID_EXTERNAL_IMPORT_FUNCTIONALITY_OBJECTIVE: 'importFromExternal.errorInvalidObjective',
    INACTIVE_EXTERNAL_SYSTEM: 'importFromExternal.errorInactiveSystem',
    EXTERNAL_INPUT_VALUE_NOT_FOUND: 'importFromExternal.errorInputNotFound',
    EXTERNAL_ASSET_IMPORT_CALL_FAILED: 'importFromExternal.errorCallFailed',
    EXTERNAL_ASSET_IMPORT_HTTP_ERROR: 'importFromExternal.errorHttpError',
    INVALID_EXTERNAL_ASSET_PAYLOAD: 'importFromExternal.errorInvalidPayload',
  }

  const finishWithAsset = React.useCallback(
    (asset: { id: string; name: string }) => {
      toast.success(t('importFromExternal.success', { name: asset.name }))
      onOpenChange(false)
      onAssetCreated?.({ id: asset.id, name: asset.name, type: "document" })
    },
    [t, onOpenChange, onAssetCreated],
  )

  const handleRunSettled = React.useCallback(
    (run: ExternalAssetImportRun) => {
      if (run.status === 'completed' && run.document_id) {
        setPendingRunId(null)
        finishWithAsset({ id: run.document_id, name: run.document_name ?? '' })
        return true
      }
      if (run.status === 'failed') {
        setPendingRunId(null)
        toast.error(t('importFromExternal.asyncFailed'), {
          description: run.error_detail ?? undefined,
          duration: 10_000,
        })
        return true
      }
      return false
    },
    [t, finishWithAsset],
  )

  const runData = runQuery.data
  React.useEffect(() => {
    if (runData && runData.import_run_id === pendingRunId) handleRunSettled(runData)
  }, [runData, pendingRunId, handleRunSettled])

  const handleImport = () => {
    if (!selectedOrganizationId) {
      toast.error(t('create.errorOrganizationRequired'))
      return
    }
    if (!systemId) {
      toast.error(t('importFromExternal.errorSystemRequired'))
      return
    }
    if (!functionalityId) {
      toast.error(t('importFromExternal.errorFunctionalityRequired'))
      return
    }
    if (inputFields.some((f) => !inputValues[f.key]?.trim())) {
      toast.error(t('importFromExternal.errorInputsRequired'))
      return
    }

    const input: Record<string, string> = {}
    if (isGenericMode) {
      for (const pair of customPairs) {
        const key = pair.key.trim()
        if (key) input[key] = pair.value
      }
    } else {
      for (const field of inputFields) {
        input[field.key] = inputValues[field.key]?.trim() ?? ''
      }
    }

    const controller = new AbortController()
    const timer = window.setTimeout(
      () => controller.abort(new DOMException('Import timed out', 'TimeoutError')),
      EXTERNAL_IMPORT_TIMEOUT_MS,
    )

    importMutation.mutate(
      {
        body: {
          external_functionality_id: functionalityId,
          folder_id: folderId,
          input,
        },
        signal: controller.signal,
      },
      {
        onSettled: () => window.clearTimeout(timer),
        onSuccess: (result) => {
          if (result.kind === 'created') {
            finishWithAsset(result.asset)
            return
          }
          // 202: el callback pudo llegar antes de que respondiéramos (ya completed).
          if (!handleRunSettled(result.run)) setPendingRunId(result.run.import_run_id)
        },
        onError: (error) => {
          if (isAbortError(error)) {
            toast.error(t('importFromExternal.errorTimeout'))
            return
          }
          handleApiError(error, {
            onErrorCode: (code: string) => {
              const key = ERROR_MESSAGE_KEYS[code as ExternalAssetImportErrorCode]
              if (!key) return false
              toast.error(t(key), {
                description: ApiError.isApiError(error)
                  ? `${error.detail || ''} (${error.transactionId})`.trim()
                  : undefined,
                duration: 10_000,
              })
              return true
            },
          })
        },
      },
    )
  }

  const hasValidInputs = isGenericMode
    ? true
    : inputFields.every((f) => inputValues[f.key]?.trim())
  const isValid = !!selectedOrganizationId && !!systemId && !!functionalityId && hasValidInputs

  const handleOpenChange = (next: boolean) => {
    // Closing mid-flight would unmount the component and drop the mutation's
    // onSuccess/onError — the asset could be created with nobody navigating to it.
    if (!next && isPending) return
    // Una importación asíncrona puede tardar mucho: se deja cerrar, pero se avisa que
    // sigue en segundo plano (al desmontarse el sheet deja de consultar el run).
    if (!next && isWaitingForExtension) {
      setPendingRunId(null)
      toast.info(t('importFromExternal.asyncBackground'))
    }
    onOpenChange(next)
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t('importFromExternal.title')}
      description={t('importFromExternal.description')}
      icon={Sparkles}
      side="right"
      maxWidth="sm:max-w-xl"
      showCancelButton={!isPending}
      cancelLabel={tCommon('cancel')}
      saveAction={{
        label: t('importFromExternal.submitLabel'),
        onClick: handleImport,
        loading: isBusy,
        disabled: !isValid || isBusy,
        closeOnSuccess: false,
      }}
    >
      <div className="grid gap-6">
        {!canBrowseExternalCatalog ? (
          <p className="text-sm text-muted-foreground">{t('importFromExternal.errorNoExternalAccess')}</p>
        ) : (
          <>
            <HuemulField
              type="select"
              label={t('importFromExternal.systemLabel')}
              name="externalSystem"
              required
              value={systemId}
              options={systemOptions}
              onChange={(v) => handleSystemChange(String(v))}
              placeholder={t('importFromExternal.systemPlaceholder')}
              disabled={isBusy || isLoadingSystems}
            />

            {systemId && (
              <HuemulField
                type="select"
                label={t('importFromExternal.functionalityLabel')}
                name="externalFunctionality"
                required
                value={functionalityId}
                options={functionalityOptions}
                onChange={(v) => handleFunctionalityChange(String(v))}
                placeholder={t('importFromExternal.functionalityPlaceholder')}
                disabled={isBusy || isLoadingFunctionalities}
                description={
                  !isLoadingFunctionalities && functionalities.length === 0
                    ? t('importFromExternal.noFunctionalities')
                    : selectedFunctionality?.description
                }
              />
            )}

            {!isGenericMode && inputFields.map((field) => (
              <HuemulField
                key={field.key}
                type="text"
                label={field.label}
                name={`input-${field.key}`}
                required
                value={inputValues[field.key] ?? ""}
                onChange={(v) => setInputValues((prev) => ({ ...prev, [field.key]: String(v) }))}
                disabled={isBusy}
              />
            ))}

            {isGenericMode && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium leading-snug">{t('importFromExternal.inputsTitle')}</span>
                <p className="text-sm text-muted-foreground">{t('importFromExternal.genericInputsDescription')}</p>
                {customPairs.map((pair) => (
                  <div key={pair.id} className="flex items-end gap-2">
                    <HuemulField
                      type="text"
                      label={t('importFromExternal.inputKey')}
                      name={`pair-key-${pair.id}`}
                      value={pair.key}
                      onChange={(v) => handlePairChange(pair.id, 'key', String(v))}
                      disabled={isBusy}
                      className="flex-1"
                    />
                    <HuemulField
                      type="text"
                      label={t('importFromExternal.inputValue')}
                      name={`pair-value-${pair.id}`}
                      value={pair.value}
                      onChange={(v) => handlePairChange(pair.id, 'value', String(v))}
                      disabled={isBusy}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hover:cursor-pointer"
                      disabled={isBusy}
                      onClick={() => handleRemovePair(pair.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit hover:cursor-pointer"
                  disabled={isBusy}
                  onClick={handleAddPair}
                >
                  <Plus className="mr-2 size-4" />
                  {t('importFromExternal.addInput')}
                </Button>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0" />
              <span>{t(isAsyncFunctionality ? 'importFromExternal.asyncWarning' : 'importFromExternal.slowWarning')}</span>
            </div>

            {isPending && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{t('importFromExternal.runningNotice')}</span>
              </div>
            )}

            {isWaitingForExtension && !runQuery.isError && (
              <div
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary"
                data-testid="external-import-waiting"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{t('importFromExternal.asyncWaiting')}</span>
              </div>
            )}

            {isWaitingForExtension && runQuery.isError && (
              <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <span>{t('importFromExternal.asyncPollError')}</span>
                <span className="text-xs">{getErrorMessage(runQuery.error)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit hover:cursor-pointer"
                  onClick={() => void runQuery.refetch()}
                >
                  {tCommon('retry')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </HuemulSheet>
  )
}
