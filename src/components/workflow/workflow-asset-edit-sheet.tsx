import { useEffect, useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Edit3 } from "lucide-react"
import { toast } from "sonner"
import { updateDocument, getDocumentById } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { logger } from "@/lib/logger"

interface WorkflowAssetEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * `asset:u` — PUT /documents/{id}. Obligatoria (sin default) para que un
   * call-site futuro no herede un default permisivo.
   */
  canSave: boolean
  documentId: string
  currentName: string
  currentInternalCode?: string
  onUpdated: (name: string, internalCode?: string, description?: string) => void
}

export function WorkflowAssetEditSheet({
  open,
  onOpenChange,
  canSave,
  documentId,
  currentName,
  currentInternalCode,
  onUpdated,
}: WorkflowAssetEditSheetProps) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const { t } = useTranslation(["assets", "common"])

  const [name, setName] = useState(currentName)
  const [internalCode, setInternalCode] = useState(currentInternalCode || "")
  const [description, setDescription] = useState("")

  useEffect(() => {
    let cancelled = false
    async function prefill() {
      if (!open || !canSave) return
      setName(currentName)
      setInternalCode(currentInternalCode || "")
      setDescription("")

      try {
        const doc = await getDocumentById(documentId, selectedOrganizationId!)
        if (!cancelled) {
          setName(doc?.name ?? currentName)
          setInternalCode(doc?.internal_code || "")
          setDescription(doc?.description || "")
        }
      } catch (e) {
        logger.error("Error loading document:", e)
      }
    }
    prefill()
    return () => {
      cancelled = true
    }
  }, [open, canSave, documentId, currentName, currentInternalCode, selectedOrganizationId])

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; internal_code?: string }) => {
      if (!selectedOrganizationId) throw new Error("Organization not selected")
      return updateDocument(documentId, payload, selectedOrganizationId)
    },
    meta: { successMessage: t("assets:edit.success") },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
      queryClient.invalidateQueries({ queryKey: ["document-content", documentId] })
      onUpdated(data.name, data.internal_code, data.description)
      onOpenChange(false)
    },
  })

  const handleSave = useCallback(() => {
    if (!canSave) return
    if (!name.trim()) {
      toast.error(t("assets:edit.errorNameRequired"))
      return
    }

    const payload: { name: string; description?: string; internal_code?: string } = {
      name: name.trim(),
    }
    if (description.trim()) payload.description = description.trim()
    if (internalCode.trim()) payload.internal_code = internalCode.trim()

    mutation.mutate(payload)
  }, [canSave, name, description, internalCode, mutation])

  if (!canSave) {
    return null
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("assets:edit.title")}
      description={t("assets:edit.description")}
      icon={Edit3}
      side="right"
      maxWidth="sm:max-w-xl"
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("assets:edit.submitLabel"),
        onClick: handleSave,
        loading: mutation.isPending,
        disabled: !canSave || !name.trim(),
      }}
    >
      <HuemulFieldGroup>
        <HuemulField
          label={t("assets:form.assetName")}
          name="name"
          value={name}
          onChange={(v) => setName(String(v))}
          placeholder={t("assets:form.assetNamePlaceholder")}
          required
          autoFocus
          disabled={mutation.isPending}
        />

        <HuemulField
          label={t("assets:form.internalCode")}
          name="internalCode"
          value={internalCode}
          onChange={(v) => setInternalCode(String(v))}
          placeholder={t("assets:form.internalCodePlaceholder")}
          disabled={mutation.isPending}
        />

        <HuemulField
          type="textarea"
          label={t("assets:form.description")}
          name="description"
          value={description}
          onChange={(v) => setDescription(String(v))}
          placeholder={t("assets:form.descriptionPlaceholder")}
          rows={4}
          disabled={mutation.isPending}
        />
      </HuemulFieldGroup>
    </HuemulSheet>
  )
}
