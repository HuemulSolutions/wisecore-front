import { toast } from "sonner"
import { handleApiError, parseErrorDetail } from "@/lib/error-utils"
import type { DuplicateDocumentDetail } from "@/types/assets"

// Mensajes traducidos para los códigos de error de POST /documents/import-from-url.
// Igual patrón que handleFolderActionError (nav-knowledge-utils.ts): se deja pasar
// el mensaje del backend para cualquier código no mapeado acá.
const URL_ERROR_KEYS: Record<string, string> = {
  INVALID_URL_SCHEME: "importFromUrl.errors.invalidUrlScheme",
  INVALID_URL: "importFromUrl.errors.invalidUrl",
  UNSUPPORTED_URL_CONTENT: "importFromUrl.errors.unsupportedUrlContent",
  URL_CONTENT_TYPE_NOT_MARKDOWN: "importFromUrl.errors.contentTypeNotMarkdown",
  URL_HOST_UNRESOLVABLE: "importFromUrl.errors.hostUnresolvable",
  URL_HOST_NOT_ALLOWED: "importFromUrl.errors.hostNotAllowed",
  URL_REDIRECT_NOT_SUPPORTED: "importFromUrl.errors.redirectNotSupported",
  URL_FETCH_FAILED: "importFromUrl.errors.fetchFailed",
  URL_FETCH_HTTP_ERROR: "importFromUrl.errors.fetchHttpError",
  URL_CONTENT_TOO_LARGE: "importFromUrl.errors.contentTooLarge",
}

export function handleImportFromUrlError(
  error: unknown,
  t: (key: string) => string,
  onDuplicate: (detail: DuplicateDocumentDetail | null) => void,
) {
  handleApiError(error, {
    onErrorCode: (code) => {
      if (code === 'DUPLICATE_DOCUMENT_CONTENT') {
        onDuplicate(parseErrorDetail<DuplicateDocumentDetail>(error))
        return true
      }
      const messageKey = URL_ERROR_KEYS[code]
      if (!messageKey) return false
      toast.error(t(messageKey))
      return true
    },
  })
}
