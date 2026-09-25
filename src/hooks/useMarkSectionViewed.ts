import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@/contexts/organization-context'
import { markSectionViewed } from '@/services/section_execution'
import { hasRequiredQuestions, isSectionAnswersCompleted } from '@/components/workflow/workflow-section-stats'
import type { ContentSection } from '@/types/assets'

type ViewableSection = Pick<ContentSection, 'id' | 'section_type' | 'answers_status' | 'form_fields'>

/**
 * Avisa al backend que el usuario abrió una sección form (POST /section_executions/{id}/mark_viewed),
 * fire-and-forget. Solo tiene efecto en secciones sin preguntas obligatorias: ahí el backend deja
 * `answers_status: "pending"` hasta que se respondan todas las opcionales o se llame a este endpoint.
 *
 * Una sola llamada por sección mientras viva el componente que usa el hook; si falla, se reintenta
 * en la próxima apertura. Tras el éxito invalida /content solo cuando el badge puede cambiar.
 */
export function useMarkSectionViewed(documentId?: string) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const sentRef = useRef<Set<string>>(new Set())

  return useCallback(
    (section: ViewableSection | undefined) => {
      if (!section || section.section_type !== 'form') return
      if (isSectionAnswersCompleted(section) || sentRef.current.has(section.id)) return
      sentRef.current.add(section.id)
      const affectsBadge = !hasRequiredQuestions(section as ContentSection)
      markSectionViewed(section.id, selectedOrganizationId ?? undefined)
        .then(() => {
          if (affectsBadge && documentId) {
            queryClient.invalidateQueries({ queryKey: ['document-content', documentId] })
          }
        })
        .catch(() => {
          sentRef.current.delete(section.id)
        })
    },
    [documentId, queryClient, selectedOrganizationId],
  )
}
