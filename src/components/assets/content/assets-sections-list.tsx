import { memo } from 'react';
import SectionExecution from './assets-section';
import { SectionSeparator } from './components/SectionSeparator';
import { SectionIndexContext } from '@/contexts/section-index-context';
import {
  canViewSection,
  resolveSectionCanEdit,
  type SectionAccessMap,
} from '@/hooks/useDocumentSectionAccess';
import { isSectionAnswerable, isSectionVisible } from '@/components/workflow/workflow-section-stats';
import type { ContentSection } from '@/types/assets';
import type { FormValuesSectionPayload } from '@/types/sections/core';
import type { ExecutionSectionStatusValue } from '@/types/execution';

export interface AssetsSectionsListProps {
  content: ContentSection[];
  /** Índice a índice, en paralelo con `content` — ver isSectionContentEmpty en assets-content.tsx. */
  sectionEmptiness: boolean[];
  isViewMode: boolean;
  showEditorActions: boolean;
  canEditSections: boolean;
  isMobile: boolean;
  sectionAccess: SectionAccessMap;
  documentId: string | undefined;
  currentExecutionId: string | null;
  currentExecutionMode: 'full' | 'single' | 'from' | 'full-single';
  selectedExecutionId: string | null | undefined;
  selectedExecutionStatus: string | undefined;
  isSectionInScope: (index: number) => boolean;
  getDisplaySectionStatus: (index: number) => ExecutionSectionStatusValue | string | undefined;
  canGenerate: boolean;
  cannotGenerateReason: string | undefined;
  onSectionUpdate: (payload?: FormValuesSectionPayload[]) => void;
  onAddSectionAtPosition: (afterIndex?: number) => void;
  onExecutionStartForSection: (index: number) => (executionId: string, mode: 'single' | 'from') => void;
  onOpenExecuteSheetForSection: (sectionIndex: number, sectionId?: string) => () => void;
  onCreateSectionFromSelectionForSection: (sectionIndex: number) => (selectedMarkdown: string) => void;
  onCopyLink: (sectionId: string) => void;
}

/**
 * Loop de secciones extraído de AssetContent (assets-content.tsx) para que quede
 * memoizado como unidad: antes vivía inline en el JSX del componente de 3800+
 * líneas, así que CUALQUIER cambio de estado ahí arriba (abrir un dropdown, un
 * hover, un tick del polling de ejecución) reconstruía y re-recorría esta lista
 * completa, aunque cada `SectionExecution` individual terminara bailando por su
 * propio React.memo. Al vivir en su propio componente memoizado, un cambio de
 * estado en AssetContent que no toque estas props ya no fuerza a React a
 * siquiera recorrer las N secciones.
 *
 * La visibilidad/ocultamiento de cada sección usa el ÍNDICE ABSOLUTO de
 * `content` (no una lista pre-filtrada): los separadores de "agregar sección"
 * dependen de esa posición real, y una sección oculta se salta junto con su
 * separador siguiente — mismo comportamiento que antes de la extracción.
 */
function AssetsSectionsListInner({
  content,
  sectionEmptiness,
  isViewMode,
  showEditorActions,
  canEditSections,
  isMobile,
  sectionAccess,
  documentId,
  currentExecutionId,
  currentExecutionMode,
  selectedExecutionId,
  selectedExecutionStatus,
  isSectionInScope,
  getDisplaySectionStatus,
  canGenerate,
  cannotGenerateReason,
  onSectionUpdate,
  onAddSectionAtPosition,
  onExecutionStartForSection,
  onOpenExecuteSheetForSection,
  onCreateSectionFromSelectionForSection,
  onCopyLink,
}: AssetsSectionsListProps) {
  return (
    <>
      {/* Add section button at the beginning */}
      {showEditorActions && canEditSections && (
        <SectionSeparator
          onAddSection={() => onAddSectionAtPosition(-1)}
          index={-1}
          isMobile={isMobile}
        />
      )}

      {content.map((section: ContentSection, index: number) => {
        const realSectionId = section.section_id;

        // Sección con depends_on propio no cumplido y sin show_when_inactive: el
        // backend ya no la devuelve en /content, pero puede seguir en caché tras un
        // parche local (PATCH /form_values de otra sección) — se descarta siempre,
        // en editor y en lector (a diferencia del chequeo de abajo, que solo aplica
        // en modo lector). Ver ia context/dependencias-condicionales-formularios-guide.md §3.2.
        if (!isSectionVisible(section)) {
          return null;
        }

        // Sin `view` sobre esta sección según el permiso por ciclo de vida
        // (resuelto aparte, /content no lo trae — ver sectionAccess arriba).
        // Fail-open si la lista de acceso no está disponible.
        if (!canViewSection(section, sectionAccess)) {
          return null;
        }

        // In reader mode, hide sections with empty content — except sections
        // in scope of an in-progress 'single'/'from' execution: there the empty
        // content is transient and must show skeleton + feedback, not disappear.
        // sectionEmptiness[index] ya resuelve la distinción form/markdown (ver
        // el useMemo en AssetContent).
        if (isViewMode && !isSectionInScope(index) && sectionEmptiness[index]) {
          return null;
        }

        return (
          <SectionIndexContext.Provider key={`${section.id}-${index}`} value={index}>
            <div id={`section-${index}`} className="relative">
              <SectionExecution
                sectionExecution={{
                  id: section.id,
                  output: section.content,
                  section_id: realSectionId,
                  plate_content: section.plate_content,
                  ai_suggestion_status: section.ai_suggestion_status,
                  ai_suggestion_content: section.ai_suggestion_content,
                  ai_suggestion_instruction: section.ai_suggestion_instruction,
                  review_status: section.review_status,
                  form_fields: section.form_fields,
                }}
                status={section.status}
                onUpdate={onSectionUpdate}
                readyToEdit={showEditorActions}
                sectionIndex={index}
                documentId={documentId}
                executionId={
                  (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))
                    ? currentExecutionId
                    : (selectedExecutionId || undefined)
                }
                executionStatus={
                  // `?? undefined` normaliza el `null` de ExecutionSectionStatusValue
                  // (ver src/types/execution/hooks.ts) al `string | undefined` que
                  // espera SectionExecutionProps — incluso equivalentes en runtime
                  // (ambos "falsy" para los checks de abajo), TS los distingue.
                  (isSectionInScope(index)
                    ? getDisplaySectionStatus(index)
                    : selectedExecutionStatus) ?? undefined
                }
                executionMode={currentExecutionMode}
                showExecutionFeedback={isSectionInScope(index)}
                onExecutionStart={onExecutionStartForSection(index)}
                onOpenExecuteSheet={onOpenExecuteSheetForSection(index, realSectionId)}
                sectionType={section.section_type}
                sectionName={section.section_name}
                sectionCanAnswer={isSectionAnswerable(section)}
                // Resuelto contra sectionAccess (GET /documents/{id}/sections), no
                // contra section.can_edit (siempre undefined, /content no lo manda).
                // `null` no restringe: el flag no aplica a esta sección/documento.
                canEditSections={canEditSections && resolveSectionCanEdit(section, sectionAccess) !== false}
                // Distingue "no podés editar el documento" (canEditSections en false
                // por RBAC/lifecycle/etapa) de "esta sección puntual es de solo
                // lectura en esta etapa" — para el badge/tooltip en la barra de la sección.
                readOnlyBySectionRule={canEditSections && resolveSectionCanEdit(section, sectionAccess) === false}
                canGenerate={canGenerate}
                cannotGenerateReason={cannotGenerateReason}
                onCreateSectionFromSelection={onCreateSectionFromSelectionForSection(index)}
                onCopyLink={realSectionId ? () => onCopyLink(realSectionId) : undefined}
              />
            </div>

            {/* Add separator after each section - editor mode only */}
            {showEditorActions && canEditSections && (
              <SectionSeparator
                onAddSection={onAddSectionAtPosition}
                index={index}
                isLastSection={index === content.length - 1}
                isMobile={isMobile}
              />
            )}
          </SectionIndexContext.Provider>
        );
      })}
    </>
  );
}

export const AssetsSectionsList = memo(AssetsSectionsListInner);
export default AssetsSectionsList;
