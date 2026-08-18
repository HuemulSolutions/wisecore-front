import { useTranslation } from "react-i18next";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import {
  HuemulInfoDisplay,
  HuemulInfoSection,
  HuemulInfoItem,
} from "@/huemul/components/huemul-info-display";
import { formatApiDateTime } from "@/lib/utils";
import { useUserById } from "@/hooks/useUsers";
import { useObjectTags } from "@/hooks/useTags";
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip";
import type { AssetsInfoSheetProps } from '@/types/assets';
export type { AssetsInfoSheetProps } from '@/types/assets';

const STAGE_COLORS: Record<string, string> = {
  create: "bg-purple-100 text-purple-700",
  edit: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  approve: "bg-orange-100 text-orange-700",
  publish: "bg-green-100 text-green-700",
  archive: "bg-gray-100 text-gray-600",
  view: "bg-slate-100 text-slate-600",
};

const EXECUTION_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  approved: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function UserAuditRow({
  label,
  user,
  accentColor,
  onCopy,
}: {
  label: string;
  user: { name: string; last_name: string; email: string; id: string };
  accentColor: "blue" | "purple";
  onCopy: (v: string) => void;
}) {
  const colors = accentColor === "blue"
    ? { bg: "bg-blue-100", text: "text-blue-600" }
    : { bg: "bg-purple-100", text: "text-purple-600" };

  return (
    <div className="py-2 space-y-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2.5">
        <div className={`h-7 w-7 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-semibold ${colors.text}`}>
            {user.name.charAt(0)}{user.last_name.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name} {user.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      {user.id && (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1">
          <code className="text-[11px] font-mono text-gray-500 flex-1 truncate">{user.id}</code>
          <button
            onClick={() => onCopy(user.id)}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 hover:cursor-pointer"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export function AssetsInfoSheet({
  open,
  onOpenChange,
  documentContent,
  selectedExecutionInfo,
  canViewTags = false,
}: AssetsInfoSheetProps) {
  const { t } = useTranslation(["assets", "tags", "common"]);

  const documentId: string | undefined = documentContent?.document_id;
  const { data: assignedTags = [] } = useObjectTags("document", documentId ?? "", {
    enabled: open && canViewTags && !!documentId,
  });

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      toast.success(t("content.info.copied"));
    });
  };

  // The creator (creator_id) is immutable and distinct from the owner (created_by_user,
  // which is reassignable). When they're the same person, reuse the owner's already-loaded
  // data instead of firing an extra lookup.
  const creatorId: string | null = documentContent?.creator_id ?? null;
  const ownerUser = documentContent?.created_by_user ?? null;
  const creatorMatchesOwner = !!creatorId && ownerUser?.id === creatorId;
  const { data: resolvedCreator } = useUserById(
    creatorId,
    !!open && !!creatorId && !creatorMatchesOwner
  );
  const creatorUser = creatorMatchesOwner ? ownerUser : resolvedCreator ?? null;

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("content.assetInfoTitle")}
      icon={Info}
      showFooter={false}
      maxWidth="sm:max-w-xl"
    >
      <HuemulInfoDisplay className="pb-4">
        {/* Document */}
        <HuemulInfoSection title={t("content.info.document")}>
          <HuemulInfoItem label={t("content.info.name")} value={documentContent?.document_name} />
          <HuemulInfoItem label={t("content.info.documentId")} value={documentContent?.document_id} variant="mono" copyable hideWhenEmpty />
          <HuemulInfoItem label={t("content.info.internalCode")} value={documentContent?.internal_code} variant="mono" hideWhenEmpty />
          <HuemulInfoItem label={t("content.info.description")} value={documentContent?.description} hideWhenEmpty />
          {documentContent?.document_type && (
            <>
              <HuemulInfoItem
                label={t("content.info.documentType")}
                value={
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: documentContent.document_type.color }} />
                    {documentContent.document_type.name}
                  </span>
                }
              />
              <HuemulInfoItem label={t("content.info.typeId")} value={documentContent.document_type.id} variant="mono" copyable hideWhenEmpty />
            </>
          )}
          <HuemulInfoItem label={t("content.info.accessLevel")} value={documentContent?.access_level} hideWhenEmpty />
          {documentContent?.template_name && (
            <>
              <HuemulInfoItem label={t("content.info.template")} value={documentContent.template_name} />
              <HuemulInfoItem label={t("content.info.templateId")} value={documentContent.template_id} variant="mono" copyable hideWhenEmpty />
            </>
          )}
        </HuemulInfoSection>

        {/* Tags */}
        {canViewTags && assignedTags.length > 0 && (
          <HuemulInfoSection title={t("tags:assign.assignedLabel")}>
            <div className="flex flex-wrap gap-1.5 py-1">
              {assignedTags.map((tag) => (
                <HuemulTagChip key={tag.id} label={tag.name} color={tag.color} size="sm" />
              ))}
            </div>
          </HuemulInfoSection>
        )}

        {/* Version */}
        <HuemulInfoSection title={t("content.info.version")}>
          <HuemulInfoItem label={t("content.info.versionName")} value={documentContent?.execution_name} />
          <HuemulInfoItem label={t("content.info.versionId")} value={documentContent?.execution_id} variant="mono" copyable hideWhenEmpty />
          {selectedExecutionInfo?.status && (
            <HuemulInfoItem
              label={t("content.info.status")}
              value={<StatusBadge status={selectedExecutionInfo.status} colorMap={EXECUTION_STATUS_COLORS} />}
            />
          )}
          <HuemulInfoItem label={t("content.info.statusMessage")} value={selectedExecutionInfo?.status_message} hideWhenEmpty />
          {selectedExecutionInfo?.created_at && (
            <HuemulInfoItem label={t("content.info.createdAt")} value={formatApiDateTime(selectedExecutionInfo.created_at)} />
          )}
          <HuemulInfoItem label={t("content.info.semanticVersion")} value={selectedExecutionInfo?.version} variant="mono" hideWhenEmpty />
          {selectedExecutionInfo?.expiration_date && (
            <HuemulInfoItem label={t("content.info.expirationDate")} value={formatApiDateTime(selectedExecutionInfo.expiration_date)} />
          )}
          {selectedExecutionInfo?.estimated_publication_date && (
            <HuemulInfoItem label={t("content.info.estimatedPublicationDate")} value={formatApiDateTime(selectedExecutionInfo.estimated_publication_date)} />
          )}
          {selectedExecutionInfo?.review_date && (
            <HuemulInfoItem label={t("content.info.reviewDate")} value={formatApiDateTime(selectedExecutionInfo.review_date)} />
          )}
          {selectedExecutionInfo?.audit_date && (
            <HuemulInfoItem label={t("content.info.auditDate")} value={formatApiDateTime(selectedExecutionInfo.audit_date)} />
          )}
          {selectedExecutionInfo?.content_hash && (
            <HuemulInfoItem label={t("content.info.contentHash")} value={selectedExecutionInfo.content_hash} variant="mono" copyable />
          )}
        </HuemulInfoSection>

        {/* Lifecycle */}
        {documentContent?.lifecycle_status && (
          <HuemulInfoSection title={t("content.info.lifecycle")}>
            <HuemulInfoItem label={t("content.info.state")} value={documentContent.lifecycle_status.state} />
            <HuemulInfoItem
              label={t("content.info.stage")}
              value={<StatusBadge status={documentContent.lifecycle_status.stage} colorMap={STAGE_COLORS} />}
            />
            <HuemulInfoItem label={t("content.info.currentGroup")} value={documentContent.lifecycle_status.current_group} hideWhenEmpty />
            <HuemulInfoItem label={t("content.info.semanticVersion")} value={documentContent.lifecycle_status.version} variant="mono" hideWhenEmpty />
            <HuemulInfoItem
              label={t("content.info.canAdvance")}
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${documentContent.lifecycle_status.can_advance ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {documentContent.lifecycle_status.can_advance ? t("common:yes") : t("common:no")}
                </span>
              }
            />
            <HuemulInfoItem
              label={t("content.info.canRollback")}
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${documentContent.lifecycle_status.can_rollback ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {documentContent.lifecycle_status.can_rollback ? t("common:yes") : t("common:no")}
                </span>
              }
            />
            <HuemulInfoItem
              label={t("content.info.versionRequired")}
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${documentContent.lifecycle_status.version_required ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                  {documentContent.lifecycle_status.version_required ? t("common:yes") : t("common:no")}
                </span>
              }
            />
            <HuemulInfoItem label={t("content.info.stepId")} value={documentContent.lifecycle_status.current_step_id} variant="mono" copyable hideWhenEmpty />
          </HuemulInfoSection>
        )}

        {/* Audit */}
        <HuemulInfoSection title={t("content.info.audit")}>
          {creatorUser && (
            <UserAuditRow
              label={t("content.info.creator")}
              user={creatorUser}
              accentColor="blue"
              onCopy={copyId}
            />
          )}
          {documentContent?.created_by_user && (
            <UserAuditRow
              label={t("content.info.owner")}
              user={documentContent.created_by_user}
              accentColor="blue"
              onCopy={copyId}
            />
          )}
          {documentContent?.updated_by_user && (
            <UserAuditRow
              label={t("content.info.updatedBy")}
              user={documentContent.updated_by_user}
              accentColor="purple"
              onCopy={copyId}
            />
          )}
        </HuemulInfoSection>
      </HuemulInfoDisplay>
    </HuemulSheet>
  );
}
