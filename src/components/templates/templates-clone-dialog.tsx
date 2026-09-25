import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cloneTemplate } from "@/services/templates";
import type { CloneTemplateDialogProps } from "@/types/templates";
export type { CloneTemplateDialogProps } from "@/types/templates";

export function CloneTemplateDialog({
  open,
  onOpenChange,
  templateId,
  organizationId,
  onSuccess,
}: CloneTemplateDialogProps) {
  const { t } = useTranslation(["templates", "common"]);
  const queryClient = useQueryClient();
  const [includeRelationships, setIncludeRelationships] = useState(true);

  const cloneMutation = useMutation({
    mutationFn: () =>
      cloneTemplate(templateId, organizationId, {
        include_relationships: includeRelationships,
      }),
    meta: { successMessage: t("templates:content.cloneSuccess") },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });
    },
  });

  const handleClone = async () => {
    const cloned = await new Promise<Awaited<ReturnType<typeof cloneTemplate>>>(
      (resolve, reject) => {
        cloneMutation.mutate(undefined, {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error),
        });
      },
    );
    onSuccess(cloned);
  };

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("templates:content.cloneDialogTitle")}
      description={t("templates:content.cloneDialogDescription")}
      icon={Copy}
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("templates:sidebar.cloneTemplate"),
        icon: Copy,
        onClick: handleClone,
      }}
    >
      <Label className="cursor-pointer py-2">
        <Checkbox
          checked={includeRelationships}
          onCheckedChange={(checked) => setIncludeRelationships(checked === true)}
        />
        <span>{t("templates:content.copyDocumentTypeRelationships")}</span>
      </Label>
    </HuemulDialog>
  );
}
