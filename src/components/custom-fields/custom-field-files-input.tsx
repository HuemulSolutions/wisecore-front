import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FileX, Loader2, X } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulFilePreview } from "@/huemul/components/huemul-file-preview"
import { ApiError } from "@/types/api-error"
import { getErrorMessage } from "@/lib/error-utils"
import { useCustomFieldValueBlobMutations } from "@/hooks/useCustomFieldValueBlobs"
import type { CustomFieldValueEntityType, CustomFieldValueFile, PendingCustomFieldFile } from "@/types/custom-fields"

export interface CustomFieldFilesInputProps {
  /** Cuando hay id, sube/borra de inmediato contra la API (sheet de edición de valor).
   *  Cuando es null, el custom field todavía no existe (sheet de alta) — acumula en
   *  memoria y el padre sube tras crear, ver onPendingFilesChange. */
  entityType: CustomFieldValueEntityType
  entityCustomFieldId: string | null
  files: CustomFieldValueFile[]
  pendingFiles?: PendingCustomFieldFile[]
  onPendingFilesChange?: (files: PendingCustomFieldFile[]) => void
  min: number
  max: number
  allowedTypes?: string[]
  maxSizeMb?: number
  disabled?: boolean
  error?: string
  onError?: (message: string | undefined) => void
}

// Colección de archivos de un custom field carga_de_archivos con max_value > 1 — subir
// varios, listar en grilla de miniaturas, borrar uno. Réplica del bloque
// QUESTION_TYPE.fileUpload de asset-form-section.tsx (runtime de formularios de
// sección), adaptado al backend de blobs de custom fields (sin tokens {{MEDIA:id}}).
export function CustomFieldFilesInput({
  entityType,
  entityCustomFieldId,
  files,
  pendingFiles = [],
  onPendingFilesChange,
  min,
  max,
  allowedTypes,
  maxSizeMb,
  disabled = false,
  error,
  onError,
}: CustomFieldFilesInputProps) {
  const { t } = useTranslation(["sections", "custom-fields"])
  const [isUploading, setIsUploading] = useState(false)
  const { addBlob, deleteBlob } = useCustomFieldValueBlobMutations(entityType, entityCustomFieldId ?? "")

  const isDeferred = !entityCustomFieldId
  const count = isDeferred ? pendingFiles.length : files.length
  const canAddMore = count < max
  const accept = allowedTypes?.length ? allowedTypes.map((ext) => `.${ext}`).join(",") : undefined

  const validate = (incoming: File[]): string | undefined => {
    if (count + incoming.length > max) {
      return t("sections:form.fill.tooManyFilesSelected", { max })
    }
    for (const file of incoming) {
      if (allowedTypes?.length) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
        if (!allowedTypes.includes(ext)) {
          return t("sections:form.fill.fileTypeNotAllowed", { types: allowedTypes.join(", ") })
        }
      }
      if (maxSizeMb) {
        const sizeMb = file.size / (1024 * 1024)
        if (sizeMb > maxSizeMb) {
          return t("sections:form.fill.fileTooLarge", { max: maxSizeMb })
        }
      }
    }
    return undefined
  }

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)

    const validationError = validate(incoming)
    if (validationError) {
      onError?.(validationError)
      return
    }
    onError?.(undefined)

    if (isDeferred) {
      const withPreviews = incoming.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
      onPendingFilesChange?.([...pendingFiles, ...withPreviews])
      return
    }

    setIsUploading(true)
    try {
      for (const file of incoming) {
        await addBlob.mutateAsync(file)
      }
    } catch (err) {
      const message = ApiError.isApiError(err) && err.detail ? err.detail : getErrorMessage(err, t("sections:form.fill.fileUploadError"))
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async (index: number) => {
    if (isDeferred) {
      const next = [...pendingFiles]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      onPendingFilesChange?.(next)
      return
    }
    const file = files[index]
    if (!file) return
    try {
      await deleteBlob.mutateAsync(file.id)
    } catch (err) {
      onError?.(getErrorMessage(err, t("sections:form.fill.fileUploadError")))
    }
  }

  const rows: Array<{ url: string; name: string; contentType?: string }> = isDeferred
    ? pendingFiles.map((p) => ({ url: p.previewUrl, name: p.file.name, contentType: p.file.type }))
    : files.map((f) => ({ url: f.download_url, name: f.name, contentType: f.content_type }))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {rows.map((row, i) => (
          <div key={i} className="relative">
            <HuemulFilePreview
              url={row.url}
              fileName={row.name}
              contentType={row.contentType}
              downloadLabel={t("sections:form.fill.fileDownload")}
              size="sm"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={t("sections:form.fill.fileRemove")}
                className="absolute -top-1.5 -right-1.5 rounded-full border border-gray-200 bg-white p-0.5 text-gray-400 shadow-sm hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      {canAddMore && (
        <HuemulField
          type="file"
          label=""
          accept={accept}
          multiple
          disabled={isUploading || disabled}
          onFileChange={handleFileChange}
          error={error}
        />
      )}
      <p className="text-xs text-gray-400">
        {t("sections:form.fill.filesCount", { count, max })}
      </p>
      {isUploading && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("sections:form.fill.fileUploading")}
        </p>
      )}
      {min > 0 && count < min && !isUploading && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <FileX className="h-3 w-3" />
          {t("sections:form.fill.tooFewFiles", { min })}
        </p>
      )}
    </div>
  )
}
