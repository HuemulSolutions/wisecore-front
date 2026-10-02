import { useEffect, useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { updateDocument, getDocumentById } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { handleApiError } from "@/lib/error-utils"

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

  // El formulario nace null y se inicializa con el detalle real del documento:
  // nunca se edita/guarda un estado parcial y un refetch no pisa lo escrito.
  const [formState, setFormState] = useState<{
    documentId: string
    name: string
    internalCode: string
    description: string
  } | null>(null)
  const form = formState?.documentId === documentId ? formState : null

  const { data: doc, isLoading, error: loadError } = useQuery({
    queryKey: ["document", documentId, "edit"],
    queryFn: () => getDocumentById(documentId, selectedOrganizationId!),
    enabled: open && canSave && !!documentId && !!selectedOrganizationId,
  })

  useEffect(() => {
    if (!open) {
      setFormState(null)
      return
    }
    if (!doc) return
    setFormState((prev) =>
      prev && prev.documentId === documentId
        ? prev
        : {
            documentId,
            name: doc.name ?? currentName,
            internalCode: doc.internal_code || currentInternalCode || "",
            description: doc.description || "",
          },
    )
  }, [open, doc, documentId, currentName, currentInternalCode])

  // Error de carga: avisar y cerrar, nunca dejar el skeleton para siempre.
  useEffect(() => {
    if (open && loadError) {
      handleApiError(loadError)
      onOpenChange(false)
    }
  }, [open, loadError, onOpenChange])

  const patchForm = useCallback((patch: Partial<{ name: string; internalCode: string; description: string }>) => {
    setFormState((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

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
    if (!canSave || !form) return
    if (!form.name.trim()) {
      toast.error(t("assets:edit.errorNameRequired"))
      return
    }

    const payload: { name: string; description?: string; internal_code?: string } = {
      name: form.name.trim(),
    }
    if (form.description.trim()) payload.description = form.description.trim()
    if (form.internalCode.trim()) payload.internal_code = form.internalCode.trim()

    mutation.mutate(payload)
  }, [canSave, form, mutation, t])

  if (!canSave) {
    return null
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("assets:edit.title")}
      description={t("assets:edit.description")}
      icon={Pencil}
      side="right"
      maxWidth="sm:max-w-xl"
      cancelLabel={t("common:cancel")}
      bodyLoading={isLoading || !form}
      saveAction={{
        label: t("assets:edit.submitLabel"),
        onClick: handleSave,
        loading: mutation.isPending,
        disabled: !canSave || !form || !form.name.trim(),
      }}
    >
      {form && (
        <HuemulFieldGroup>
          <HuemulField
            label={t("assets:form.assetName")}
            name="name"
            value={form.name}
            onChange={(v) => patchForm({ name: String(v) })}
            placeholder={t("assets:form.assetNamePlaceholder")}
            required
            autoFocus
            disabled={mutation.isPending}
          />

          <HuemulField
            label={t("assets:form.internalCode")}
            name="internalCode"
            value={form.internalCode}
            onChange={(v) => patchForm({ internalCode: String(v) })}
            placeholder={t("assets:form.internalCodePlaceholder")}
            disabled={mutation.isPending}
          />

          <HuemulField
            type="textarea"
            label={t("assets:form.description")}
            name="description"
            value={form.description}
            onChange={(v) => patchForm({ description: String(v) })}
            placeholder={t("assets:form.descriptionPlaceholder")}
            rows={4}
            disabled={mutation.isPending}
          />
        </HuemulFieldGroup>
      )}
    </HuemulSheet>
  )
}
