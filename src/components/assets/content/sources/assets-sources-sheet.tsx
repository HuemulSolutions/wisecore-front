import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, RefreshCw } from "lucide-react";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker";
import { RemoveDependencyDialog } from "@/components/dependency/dependency-delete-dialog";
import { DeleteContextDialog } from "@/components/context/context-delete-dialog";
import { DependencyVersionDialog } from "@/components/dependency/dependency-version-dialog";
import { useOrganization } from "@/contexts/organization-context";
import { useElementWidth } from "@/hooks/useElementWidth";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@/types/context";
import type { Dependency, DependencyVersionMode, UpdateDependencyVersionRequest } from "@/types/dependency/sheets";
import type { AssetsSourcesSheetProps, ContextSourceRow, SourceRow } from "@/types/assets/sources";
import { useAssetSources } from "./hooks/useAssetSources";
import { useAssetSourceActions } from "./hooks/useAssetSourceActions";
import { SourcesNotice, type SourcesNoticeKind } from "./sources-notice";
import { SourcesAddCards } from "./sources-add-cards";
import { SourcesTextForm, type SourcesTextFormValues } from "./sources-text-form";
import { SourcesPendingAlert } from "./sources-pending-alert";
import { SourcesTable } from "./sources-table";
import { SourcesEmpty, SourcesError, SourcesSkeleton } from "./sources-states";

/** Por debajo de este ancho de cuerpo la tabla pasa a filas de dos líneas y las tarjetas a una columna. */
const NARROW_BODY_WIDTH = 560;

const FILE_ACCEPT = ".txt,.md,.pdf,.doc,.docx,.xlsx,.xlsm";

type TextFormState = { mode: "create" } | { mode: "edit"; context: ContextItem } | null;

const PILL_BASE = "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset";

/**
 * Panel "Fuentes" del asset: activos vinculados (dependencias) + archivos y textos (contextos) en
 * una sola superficie. Reemplaza a los sheets de Dependencias y Contexto en el header del asset.
 *
 * Solo lectura (sin botones de agregar/acciones y con el selector de versión cerrado) cuando no
 * hay permiso de edición, el activo está en modo Lector, no está en la etapa de elaboración o hay
 * una elaboración externa en curso.
 */
export function AssetsSourcesSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  lifecyclePermissions,
  stage,
  isExternalElaborationLocked = false,
  isViewMode,
  onSwitchToEditor,
}: AssetsSourcesSheetProps) {
  const { t } = useTranslation(["sources", "common"]);
  const { selectedOrganizationId } = useOrganization();
  const documentId = selectedFile.id;

  const sources = useAssetSources(documentId, isOpen);
  const actions = useAssetSourceActions(documentId);
  const { ref: bodyRef, width: bodyWidth } = useElementWidth<HTMLDivElement>();
  const narrow = bodyWidth > 0 && bodyWidth < NARROW_BODY_WIDTH;

  const [textForm, setTextForm] = useState<TextFormState>(null);
  const [removeTarget, setRemoveTarget] = useState<SourceRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<{ id: string; name: string } | null>(null);
  const [editingDependency, setEditingDependency] = useState<Dependency | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<ContextSourceRow | null>(null);

  // ── Permisos: mismo cruce lifecycle × RBAC que los sheets que reemplaza ──
  const canAccess = !!(
    lifecyclePermissions?.review ||
    lifecyclePermissions?.approve ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.create ||
    lifecyclePermissions?.edit
  );
  const hasEditPermission = !!(lifecyclePermissions?.create || lifecyclePermissions?.edit) && stage === "edit";
  const canEdit = hasEditPermission && !isExternalElaborationLocked && !isViewMode;

  let noticeKind: SourcesNoticeKind | null = null;
  if (isExternalElaborationLocked) noticeKind = "external";
  else if (!hasEditPermission) noticeKind = "readOnly";
  else if (isViewMode) noticeKind = "reader";

  // Al cerrar (o perder el permiso de edición) se descartan formularios y diálogos abiertos.
  useEffect(() => {
    if (!isOpen || !canEdit) {
      setTextForm(null);
      setRemoveTarget(null);
      setPickerOpen(false);
      setVersionDialogOpen(false);
      setPendingDocument(null);
      setEditingDependency(null);
    }
  }, [isOpen, canEdit]);

  // ── Handlers: textos ──
  const handleSubmitText = useCallback(
    async (values: SourcesTextFormValues) => {
      const content = values.content || undefined;
      if (textForm?.mode === "edit") {
        await actions.editText.mutateAsync({
          contextId: textForm.context.id,
          body: { name: values.name, content: values.content, required: values.required },
        });
      } else {
        await actions.addText.mutateAsync({ name: values.name, content, required: values.required });
      }
      setTextForm(null);
    },
    [actions.addText, actions.editText, textForm],
  );

  const handleEditText = useCallback((row: ContextSourceRow) => {
    setTextForm({ mode: "edit", context: row.context });
  }, []);

  // ── Handlers: archivos ──
  const handleReplaceFile = useCallback((row: ContextSourceRow) => {
    replaceTargetRef.current = row;
    replaceInputRef.current?.click();
  }, []);

  const handleUploadInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    files.forEach((file) => void actions.startUpload(file));
  };

  const handleReplaceInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = replaceTargetRef.current;
    event.target.value = "";
    replaceTargetRef.current = null;
    if (file && target) actions.replaceFile.mutate({ contextId: target.context.id, file });
  };

  // ── Handlers: pendientes ──
  const handleCompleteFirstPending = () => {
    const first = sources.pendingRows[0];
    if (!first) return;
    if (first.kind === "text") handleEditText(first);
    else handleReplaceFile(first);
  };

  // ── Handlers: activos vinculados ──
  const handlePickAsset = (docId: string, label: string) => {
    setPendingDocument({ id: docId, name: label });
    setEditingDependency(null);
    setVersionDialogOpen(true);
  };

  const handleChangeVersionMode = (dependency: Dependency, mode: DependencyVersionMode) => {
    if (mode === "specific") {
      // Elegir la versión fija requiere el diálogo (lista de versiones del activo dependido).
      setEditingDependency({ ...dependency, version_mode: "specific" });
      setPendingDocument({ id: dependency.document_id, name: dependency.document_name });
      setVersionDialogOpen(true);
      return;
    }
    if (mode === dependency.version_mode) return;
    actions.updateDependency.mutate({
      dependencyId: dependency.id,
      body: { version_mode: mode, depends_on_execution_id: null },
    });
  };

  const handleConfirmVersionDialog = async (body: UpdateDependencyVersionRequest) => {
    if (editingDependency) {
      await actions.updateDependency.mutateAsync({ dependencyId: editingDependency.id, body });
    } else if (pendingDocument) {
      await actions.addDependency.mutateAsync({ depends_on_document_id: pendingDocument.id, ...body });
    }
    setVersionDialogOpen(false);
    setPendingDocument(null);
    setEditingDependency(null);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    if (removeTarget.kind === "asset") {
      await actions.removeDependency.mutateAsync(removeTarget.dependency.id);
    } else {
      await actions.removeContext.mutateAsync(removeTarget.context.id);
    }
    setRemoveTarget(null);
  };

  const disabledPickerIds = [documentId, ...sources.groups.assets.map((row) => row.dependency.document_id)];
  const hasAnySource = sources.totalCount > 0 || actions.uploads.length > 0;
  const showEmpty = !hasAnySource && !textForm;

  if (!canAccess) return null;

  // ── Encabezado a medida: título, descripción, pills de resumen y refresh ──
  const header = (
    <div className="border-b border-gray-200 pt-[18px] pr-12 pb-3.5 pl-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1" aria-hidden="true">
          <p className="text-[18px] font-semibold leading-tight text-slate-900">{t("sheet.title")}</p>
          <p className="mt-0.5 text-[13px] text-slate-500">{t("sheet.description")}</p>
        </div>
        <HuemulButton
          variant="ghost"
          size="icon"
          icon={RefreshCw}
          iconClassName={cn("h-4 w-4", sources.isFetching && "animate-spin")}
          aria-label={t("common:refresh")}
          tooltip={t("common:refresh")}
          disabled={sources.isLoading}
          className="h-[30px] w-[30px] shrink-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500/40"
          onClick={() => void sources.refetch()}
        />
      </div>
      {!sources.isLoading && !sources.isError && sources.totalCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="sources-summary">
          <span className={cn(PILL_BASE, "bg-slate-50 text-slate-700 ring-slate-200")}>
            {t("summary.assets", { count: sources.assetCount })}
          </span>
          <span className={cn(PILL_BASE, "bg-slate-50 text-slate-700 ring-slate-200")}>
            {t("summary.filesAndTexts", { count: sources.fileTextCount })}
          </span>
          {sources.pendingCount > 0 ? (
            <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700 ring-amber-200")}>
              {t("summary.pending", { count: sources.pendingCount })}
            </span>
          ) : (
            <span className={cn(PILL_BASE, "bg-green-100 text-green-700 ring-green-200")}>
              {t("summary.completed")}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title={t("sheet.title")}
        icon={BookOpen}
        size="xl"
        showFooter={false}
        headerContent={header}
        overlayClassName="bg-slate-900/30"
        className="shadow-[-16px_0_40px_-18px_rgba(15,23,42,0.35)] ring-1 ring-gray-200"
        bodyClassName="pt-[18px] pb-7"
        bodyLoading={sources.isLoading}
        bodySkeleton={<SourcesSkeleton narrow={narrow} />}
      >
        <div ref={bodyRef} className="flex flex-col gap-[18px]">
          {sources.isError ? (
            <SourcesError onRetry={() => void sources.refetch()} isRetrying={sources.isFetching} />
          ) : (
            <>
              {noticeKind && <SourcesNotice kind={noticeKind} onSwitchToEditor={onSwitchToEditor} />}

              {canEdit && (
                <SourcesAddCards
                  narrow={narrow}
                  onLinkAsset={() => setPickerOpen(true)}
                  onUploadFile={() => uploadInputRef.current?.click()}
                  onPasteText={() => setTextForm({ mode: "create" })}
                />
              )}

              {canEdit && textForm && (
                <SourcesTextForm
                  key={textForm.mode === "edit" ? textForm.context.id : "create"}
                  context={textForm.mode === "edit" ? textForm.context : undefined}
                  isSaving={actions.addText.isPending || actions.editText.isPending}
                  onCancel={() => setTextForm(null)}
                  onSubmit={handleSubmitText}
                />
              )}

              {sources.pendingCount > 0 && (
                <SourcesPendingAlert
                  count={sources.pendingCount}
                  onComplete={canEdit ? handleCompleteFirstPending : undefined}
                />
              )}

              {showEmpty ? (
                <SourcesEmpty />
              ) : (
                hasAnySource && (
                  <SourcesTable
                    groups={sources.groups}
                    uploads={actions.uploads}
                    narrow={narrow}
                    canEdit={canEdit}
                    onEditText={handleEditText}
                    onReplaceFile={handleReplaceFile}
                    onRemove={setRemoveTarget}
                    onChangeVersionMode={handleChangeVersionMode}
                    onCancelUpload={actions.cancelUpload}
                  />
                )
              )}
            </>
          )}
        </div>

        {/* Inputs ocultos para subir y reemplazar archivos (mismos formatos que el sheet de Contexto). */}
        <input
          ref={uploadInputRef}
          type="file"
          multiple
          accept={FILE_ACCEPT}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="sources-upload-input"
          onChange={handleUploadInput}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="sources-replace-input"
          onChange={handleReplaceInput}
        />
      </HuemulSheet>

      {/* Diálogos como hermanos del sheet (inline-create-entity-in-sheet-guide / danger-zone-sheet-guide). */}
      {canEdit && selectedOrganizationId && (
        <HuemulAssetTreePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          organizationId={selectedOrganizationId}
          mode="document"
          container="sheet"
          keepOpenOnSelect
          disabledIds={disabledPickerIds}
          disabledHint={t("picker.alreadyLinked")}
          title={t("picker.title")}
          description={t("picker.description")}
          onSelect={handlePickAsset}
        />
      )}

      {pendingDocument && (
        <DependencyVersionDialog
          open={versionDialogOpen}
          onOpenChange={(open) => {
            setVersionDialogOpen(open);
            if (!open) {
              setPendingDocument(null);
              setEditingDependency(null);
            }
          }}
          dependsOnDocumentId={pendingDocument.id}
          dependsOnDocumentName={pendingDocument.name}
          dependency={editingDependency}
          onConfirm={handleConfirmVersionDialog}
          isSubmitting={actions.addDependency.isPending || actions.updateDependency.isPending}
        />
      )}

      <RemoveDependencyDialog
        open={removeTarget?.kind === "asset"}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onAction={confirmRemove}
      />
      <DeleteContextDialog
        open={!!removeTarget && removeTarget.kind !== "asset"}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={confirmRemove}
      />
    </>
  );
}
