import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  FilePlus,
  FileType,
} from "lucide-react";
import {
  useDocxTemplatesForTemplate,
  useDocxTemplateMutationsForTemplate,
} from "@/hooks/useDocxTemplates";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { HuemulField } from "@/huemul/components/huemul-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { parseApiDate, formatDate } from "@/lib/utils";
import type { DocxTemplate } from "@/types/docx-templates";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Word document icon ───────────────────────────────────────────────────────

function WordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 0H28L40 12V44C40 46.2 38.2 48 36 48H4C1.8 48 0 46.2 0 44V4C0 1.8 1.8 0 4 0Z"
        fill="#2B5BE0"
      />
      <path d="M28 0L40 12H30C28.9 12 28 11.1 28 10V0Z" fill="#7BA4F4" />
      <text
        x="20"
        y="34"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        W
      </text>
    </svg>
  );
}

// ─── Single card ──────────────────────────────────────────────────────────────

interface DocxTemplateCardProps {
  template: DocxTemplate;
  canUpdate: boolean;
  canDelete: boolean;
  onRename: (template: DocxTemplate) => void;
  onReplace: (template: DocxTemplate) => void;
  onDelete: (template: DocxTemplate) => void;
}

function DocxTemplateCard({
  template,
  canUpdate,
  canDelete,
  onRename,
  onReplace,
  onDelete,
}: DocxTemplateCardProps) {
  const { t } = useTranslation("templates");
  const formattedDate = formatDate(parseApiDate(template.updated_at), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-xs transition-shadow hover:shadow-md hover:border-primary/30">
      {/* Actions dropdown */}
      {(canUpdate || canDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:cursor-pointer hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canUpdate && (
                <>
                  <DropdownMenuItem
                    className="hover:cursor-pointer"
                    onSelect={() => onRename(template)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("docxTemplates.rename")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:cursor-pointer"
                    onSelect={() => onReplace(template)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("docxTemplates.replaceFile")}
                  </DropdownMenuItem>
                </>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive hover:cursor-pointer"
                  onSelect={() => onDelete(template)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("docxTemplates.delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Icon */}
      <WordIcon className="h-14 w-14 drop-shadow-sm" />

      {/* Info */}
      <div className="w-full text-center space-y-0.5 min-w-0">
        <p
          className="text-xs font-medium text-foreground truncate w-full"
          title={template.name}
        >
          {template.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(template.file_size)}
        </p>
        <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function DocxEmptyState({
  canCreate,
  onUpload,
}: {
  canCreate: boolean;
  onUpload: () => void;
}) {
  const { t } = useTranslation("templates");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="rounded-full bg-muted p-4">
        <FileType className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("docxTemplates.emptyTitle")}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {t("docxTemplates.emptyDescription")}
        </p>
      </div>
      {canCreate && (
        <HuemulButton
          icon={FilePlus}
          iconClassName="mr-1.5 h-4 w-4"
          label={t("docxTemplates.upload")}
          size="sm"
          onClick={onUpload}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TemplateDocxListProps {
  templateId: string;
  organizationId: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function TemplateDocxList({
  templateId,
  organizationId,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: TemplateDocxListProps) {
  const { t } = useTranslation("templates");

  // ── Queries & mutations ──────────────────────────────────────────────────

  const { data, isLoading, isFetching, refetch } = useDocxTemplatesForTemplate(
    organizationId,
    templateId
  );

  const { uploadDocxTemplate, replaceDocxTemplate, renameDocxTemplate, deleteDocxTemplate } =
    useDocxTemplateMutationsForTemplate(organizationId, templateId);

  const templates = data?.data ?? [];

  // ── Dialog state ─────────────────────────────────────────────────────────

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocxTemplate | null>(null);
  const [renameName, setRenameName] = useState("");

  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<DocxTemplate | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceName, setReplaceName] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocxTemplate | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openUpload = () => {
    setUploadFile(null);
    setUploadName("");
    setUploadOpen(true);
  };

  const openRename = (template: DocxTemplate) => {
    setRenameTarget(template);
    setRenameName(template.name);
    setRenameOpen(true);
  };

  const openReplace = (template: DocxTemplate) => {
    setReplaceTarget(template);
    setReplaceFile(null);
    setReplaceName(template.name);
    setReplaceOpen(true);
  };

  const openDelete = (template: DocxTemplate) => {
    setDeleteTarget(template);
    setDeleteOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    await uploadDocxTemplate.mutateAsync({
      file: uploadFile,
      name: uploadName.trim() || undefined,
    });
    setUploadOpen(false);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    await renameDocxTemplate.mutateAsync({
      docxTemplateId: renameTarget.id,
      body: { name: renameName.trim() },
    });
    setRenameOpen(false);
  };

  const handleReplace = async () => {
    if (!replaceTarget || !replaceFile) return;
    await replaceDocxTemplate.mutateAsync({
      docxTemplateId: replaceTarget.id,
      file: replaceFile,
      name: replaceName.trim() || undefined,
    });
    setReplaceOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDocxTemplate.mutateAsync(deleteTarget.id);
    setDeleteOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="px-4 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {t("docxTemplates.sectionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("docxTemplates.sectionDescription")}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <HuemulButton
              icon={RefreshCw}
              iconClassName="h-4 w-4 text-gray-600"
              variant="ghost"
              size="sm"
              loading={isFetching}
              tooltip={t("common:refresh")}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => refetch()}
            />
            {canCreate && templates.length > 0 && (
              <HuemulButton
                icon={FilePlus}
                iconClassName="mr-1.5 h-3.5 w-3.5"
                label={t("docxTemplates.upload")}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={openUpload}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-xs text-gray-500">
              {t("docxTemplates.loading")}
            </span>
          </div>
        ) : templates.length === 0 ? (
          <DocxEmptyState canCreate={canCreate} onUpload={openUpload} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {templates.map((tpl) => (
              <DocxTemplateCard
                key={tpl.id}
                template={tpl}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onRename={openRename}
                onReplace={openReplace}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Upload dialog ─────────────────────────────────────────────────── */}
      <HuemulDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={t("docxTemplates.uploadTitle")}
        description={t("docxTemplates.uploadDescription")}
        icon={FilePlus}
        saveAction={{
          label: t("docxTemplates.upload"),
          onClick: handleUpload,
          disabled: !uploadFile,
          loading: uploadDocxTemplate.isPending,
        }}
        cancelLabel={t("common:cancel")}
        showCancelButton
      >
        <div className="space-y-4">
          <HuemulField
            type="text"
            label={t("docxTemplates.nameLabel")}
            name="upload-name"
            value={uploadName}
            placeholder={t("docxTemplates.namePlaceholder")}
            onChange={(v) => setUploadName(String(v))}
          />
          <HuemulField
            type="file"
            label={t("docxTemplates.fileLabel")}
            name="upload-file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onFileChange={(files) => setUploadFile(files?.[0] ?? null)}
            required
          />
        </div>
      </HuemulDialog>

      {/* ── Rename dialog ─────────────────────────────────────────────────── */}
      <HuemulDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t("docxTemplates.renameTitle")}
        description={t("docxTemplates.renameDescription")}
        icon={Pencil}
        saveAction={{
          label: t("docxTemplates.renameAction"),
          onClick: handleRename,
          disabled: !renameName.trim(),
          loading: renameDocxTemplate.isPending,
        }}
        cancelLabel={t("common:cancel")}
        showCancelButton
      >
        <HuemulField
          type="text"
          label={t("docxTemplates.nameLabel")}
          name="rename-name"
          value={renameName}
          placeholder={t("docxTemplates.namePlaceholder")}
          onChange={(v) => setRenameName(String(v))}
          autoFocus
          required
        />
      </HuemulDialog>

      {/* ── Replace dialog ────────────────────────────────────────────────── */}
      <HuemulDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title={t("docxTemplates.replaceTitle")}
        description={t("docxTemplates.replaceDescription")}
        icon={Upload}
        saveAction={{
          label: t("docxTemplates.replaceAction"),
          onClick: handleReplace,
          disabled: !replaceFile,
          loading: replaceDocxTemplate.isPending,
        }}
        cancelLabel={t("common:cancel")}
        showCancelButton
      >
        <div className="space-y-4">
          <HuemulField
            type="text"
            label={t("docxTemplates.nameLabel")}
            name="replace-name"
            value={replaceName}
            placeholder={t("docxTemplates.namePlaceholder")}
            onChange={(v) => setReplaceName(String(v))}
          />
          <HuemulField
            type="file"
            label={t("docxTemplates.fileLabel")}
            name="replace-file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onFileChange={(files) => setReplaceFile(files?.[0] ?? null)}
            required
          />
        </div>
      </HuemulDialog>

      {/* ── Delete alert dialog ───────────────────────────────────────────── */}
      <HuemulAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("docxTemplates.deleteTitle")}
        description={t("docxTemplates.deleteDescription", {
          name: deleteTarget?.name ?? "",
        })}
        icon={Trash2}
        actionLabel={t("docxTemplates.deleteAction")}
        actionVariant="destructive"
        onAction={handleDelete}
        cancelLabel={t("common:cancel")}
      />
    </div>
  );
}
