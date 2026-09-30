import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useOrganization } from '@/contexts/organization-context'
import { handleApiError } from '@/lib/error-utils'
import {
  addDocumentContextWithProgress,
  addTextContext,
  deleteContext,
  editFileContext,
  editTextContext,
} from '@/services/context'
import {
  addDocumentDependency,
  removeDocumentDependency,
  updateDocumentDependency,
} from '@/services/dependencies'
import type { AddTextContextBody, EditTextContextBody } from '@/types/context'
import type { UpdateDependencyVersionRequest } from '@/types/dependency/sheets'
import type { SourceUpload } from '@/types/assets/sources'
import { contextsQueryKey, dependenciesQueryKey } from '../sources-queries'

/**
 * Mutaciones del panel "Fuentes". Replican las de `dependency-panel.tsx` y `context-add.tsx`:
 * mismas llamadas, mismos `refetch`/`invalidate` (`['document-content', id]` recalcula
 * `can_generate`) y mismo manejo de errores, con los toasts del namespace `sources`.
 */
export function useAssetSourceActions(documentId: string) {
  const { t } = useTranslation('sources')
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ''

  const [uploads, setUploads] = useState<SourceUpload[]>([])
  const controllers = useRef(new Map<string, AbortController>())

  // Cerrar la pantalla no puede dejar subidas huérfanas reportando progreso a un componente desmontado.
  useEffect(() => {
    const active = controllers.current
    return () => {
      active.forEach((controller) => controller.abort())
      active.clear()
    }
  }, [])

  const refreshContexts = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: contextsQueryKey(documentId) })
    // can_generate depende de si el activo tiene contexto configurado.
    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] })
  }, [queryClient, documentId])

  const refreshDependencies = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: dependenciesQueryKey(documentId) })
    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] })
  }, [queryClient, documentId])

  // ── Contextos (textos y archivos) ─────────────────────────────────────────

  const addText = useMutation({
    mutationFn: (body: AddTextContextBody) => addTextContext(documentId, body, orgId),
    onSuccess: async () => {
      await refreshContexts()
      toast.success(t('toast.textAdded'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.addFailed') }),
  })

  const editText = useMutation({
    mutationFn: ({ contextId, body }: { contextId: string; body: EditTextContextBody }) =>
      editTextContext(contextId, body, orgId),
    onSuccess: async () => {
      await refreshContexts()
      toast.success(t('toast.textUpdated'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.updateFailed') }),
  })

  const replaceFile = useMutation({
    mutationFn: ({ contextId, file }: { contextId: string; file: File }) =>
      editFileContext(contextId, file, orgId),
    onSuccess: async () => {
      await refreshContexts()
      toast.success(t('toast.fileReplaced'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.updateFailed') }),
  })

  const removeContext = useMutation({
    mutationFn: (contextId: string) => deleteContext(contextId, orgId),
    onSuccess: async () => {
      await refreshContexts()
      toast.success(t('toast.sourceRemoved'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.removeFailed') }),
  })

  // ── Dependencias (activos vinculados) ─────────────────────────────────────

  const addDependency = useMutation({
    mutationFn: (body: { depends_on_document_id: string } & UpdateDependencyVersionRequest) =>
      addDocumentDependency(documentId, body, orgId),
    onSuccess: async () => {
      await refreshDependencies()
      toast.success(t('toast.dependencyAdded'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.addFailed') }),
  })

  const updateDependency = useMutation({
    mutationFn: ({ dependencyId, body }: { dependencyId: string; body: UpdateDependencyVersionRequest }) =>
      updateDocumentDependency(documentId, dependencyId, body, orgId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: dependenciesQueryKey(documentId) })
      toast.success(t('toast.versionUpdated'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.updateFailed') }),
  })

  const removeDependency = useMutation({
    mutationFn: (dependencyId: string) => removeDocumentDependency(documentId, dependencyId, orgId),
    onSuccess: async () => {
      await refreshDependencies()
      toast.success(t('toast.dependencyRemoved'))
    },
    onError: (error) => handleApiError(error, { fallbackMessage: t('toast.removeFailed') }),
  })

  // ── Subida de archivos con progreso ───────────────────────────────────────

  const startUpload = useCallback(
    async (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const controller = new AbortController()
      controllers.current.set(id, controller)
      setUploads((prev) => [...prev, { id, name: file.name, size: file.size, progress: 0 }])

      try {
        await addDocumentContextWithProgress(documentId, file, orgId, {
          signal: controller.signal,
          onProgress: (progress) =>
            setUploads((prev) => prev.map((upload) => (upload.id === id ? { ...upload, progress } : upload))),
        })
        // La fila de subida se retira recién con la fuente ya listada: sin salto visual.
        await refreshContexts()
        toast.success(t('toast.fileAdded'))
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          toast.info(t('toast.uploadCancelled'))
        } else {
          handleApiError(error, { fallbackMessage: t('toast.uploadFailed') })
        }
      } finally {
        controllers.current.delete(id)
        setUploads((prev) => prev.filter((upload) => upload.id !== id))
      }
    },
    [documentId, orgId, refreshContexts, t],
  )

  const cancelUpload = useCallback((id: string) => {
    controllers.current.get(id)?.abort()
  }, [])

  return {
    uploads,
    startUpload,
    cancelUpload,
    addText,
    editText,
    replaceFile,
    removeContext,
    addDependency,
    updateDependency,
    removeDependency,
  }
}
