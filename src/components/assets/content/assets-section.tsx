import { MoreVertical, SlidersHorizontal, Pencil, Bot, Copy, Trash2, Play, FastForward, Loader2, GitCompare, History, Eye, XCircle, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useState, useEffect, useRef, useContext, useMemo } from 'react';
import { SectionCollapseContext } from '@/contexts/section-collapse-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SectionPlateEditor, { type SectionPlateEditorRef } from '@/components/plate-editor/section-plate-editor';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import ExecutionConfigDialog, { type ExecutionConfig } from '@/components/execution/execution-config-dialog';
import { DeleteSectionDialog } from '@/components/assets/dialogs/assets-delete-section-dialog';
import { AiEditSectionDialog } from '@/components/assets/dialogs/assets-ai-edit-section-dialog';
import { AssetHistorySheet } from '@/components/assets/content/history/asset-history-sheet';
import type { AssetHistoryTab } from '@/types/assets';
import { isExecutionTerminal } from '@/lib/execution-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { executeSingleSection, executeFromSection } from '@/services/generate';
import { deleteSectionExec, modifyContent, createAiSuggestion, getAiSuggestion, rejectAiSuggestion, updateReviewStatus, type ReviewStatus } from '@/services/section_execution';
import { HuemulField } from '@/huemul/components/huemul-field';
import { AiSuggestionFeedback } from '@/components/execution/ai-suggestion-feedback';
import { AiSuggestionDiffDialog } from '@/components/assets/dialogs/assets-ai-suggestion-diff-dialog';
import { useOrganization } from '@/contexts/organization-context';
import { useOptionalEditingGuard } from '@/contexts/editing-guard-context';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { isSectionPermissionDeniedError } from '@/lib/section-permission-errors';
import { useInvalidateDocumentSectionAccess } from '@/hooks/useDocumentSectionAccess';
import { logger } from '@/lib/logger';
import { stripCommentMarkers } from '@/lib/plate-comment-markers';
import { useAcceptAiSuggestion } from '@/hooks/useAcceptAiSuggestion';
import { useMarkSectionViewed } from '@/hooks/useMarkSectionViewed';
import { useTranslation } from 'react-i18next';
import { AssetFormSection, type AssetFormSectionHandle } from '@/components/assets/content/asset-form-section';
import { AssetFormSectionReader } from '@/components/assets/content/asset-form-section-reader';
import { useOverflowTitle } from '@/hooks/useOverflowTitle';
import { sectionsConfigQueryOptions } from '@/components/assets/content/components/section-definition-query';
import { SectionDefinitionSheet } from '@/components/assets/content/components/section-definition-sheet';
import { SectionBarButton, SectionBarDivider } from '@/components/assets/content/components/section-bar-button';
import {
  ANSWERS_PILL_CLASS,
  REVIEW_STATUS_DOT_COLOR,
  interleaveGroups,
  reviewSelectClass,
  type AnswersPillTone,
} from '@/components/assets/content/components/section-bar-styles';
import { QUESTION_TYPE, formatFieldValueForCopy, isFieldAnswerable, isFieldVisible } from '@/components/sections/question-type-meta';
import { isSectionContentEmpty } from '@/components/assets/content/utils/section-content';
import type { SectionExecutionProps } from '@/types/assets';
export type { SectionExecutionProps } from '@/types/assets';

const SECTION_BAR_BADGE_CLASS = 'inline-flex h-[22px] items-center rounded-md bg-[#f1f5f9] px-2 text-[11.5px] font-semibold text-[#475569]';

// Constante a nivel de módulo (no array literal inline): una referencia
// estable evita recrear el array de tabs en cada render del sheet de historial.
const SECTION_HISTORY_TABS: AssetHistoryTab[] = ['section'];

function SectionExecutionInner({ 
    sectionExecution, 
    onUpdate, 
    readyToEdit, 
    sectionIndex, 
    documentId, 
    executionId,
    onExecutionStart,
    executionStatus,
    onOpenExecuteSheet,
    executionMode = 'single',
    showExecutionFeedback = false,
    sectionType = 'ai',
    sectionName,
    status,
    canEditSections = false,
    onCreateSectionFromSelection,
    sectionCanAnswer = true,
    readOnlyBySectionRule = false,
    canGenerate = true,
    cannotGenerateReason,
    onCollapsedChange,
    // onCopyLink,
}: SectionExecutionProps) {
    const generationBlocked = canGenerate === false;
    const { selectedOrganizationId } = useOrganization();
    const { setIsSectionEditing } = useOptionalEditingGuard();
    const queryClient = useQueryClient();
    const invalidateSectionAccess = useInvalidateDocumentSectionAccess();
    // ¿El formulario tiene al menos un campo editable? Los custom_field son solo lectura,
    // y las preguntas condicionales inactivas (can_answer === false) tampoco se pueden responder.
    const formHasEditableFields = (sectionExecution.form_fields ?? []).some(isFieldAnswerable);
    const isFormAnswered = !!status && status !== 'pending';
    // Un formulario pendiente sin respuestas arranca directamente en modo edición.
    // sectionCanAnswer=false (depends_on propio de la sección no cumplido, ver
    // "ia context/dependencias-condicionales-formularios-guide.md" §3.2) bloquea entrar en
    // modo edición aunque AssetFormSection ya vaya a forzar can_answer:false por campo —
    // evita que el usuario abra el formulario para encontrarlo todo deshabilitado.
    const [isEditing, setIsEditing] = useState(
        sectionType === 'form' && readyToEdit && canEditSections && sectionCanAnswer && formHasEditableFields && !isFormAnswered
    );
    // Responder el formulario sin salir del modo lector del asset — atajo sobre la tarjeta
    // del reader (ver AssetFormSectionReader), independiente del `isEditing` de modo editor.
    const [isAnsweringInReader, setIsAnsweringInReader] = useState(false);
    const canAnswerInReader = sectionType === 'form' && canEditSections && sectionCanAnswer && formHasEditableFields;

    // Si el usuario cambia a modo editor mientras respondía desde el reader, se corta ese modo
    // para no terminar con dos formularios (reader + editor) montados a la vez.
    useEffect(() => {
        if (readyToEdit) setIsAnsweringInReader(false);
    }, [readyToEdit]);

    // Empezar a responder/editar el formulario = "la vio" (mark_viewed): las tarjetas del lector
    // se renderizan expandidas, así que el render inicial no es señal de apertura.
    const markSectionViewed = useMarkSectionViewed(documentId);
    useEffect(() => {
        if (sectionType === 'form' && (isEditing || isAnsweringInReader)) {
            markSectionViewed(sectionExecution);
        }
    }, [sectionType, isEditing, isAnsweringInReader, sectionExecution, markSectionViewed]);
    const [isAiEditDialogOpen, setIsAiEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Ref al form de la sección: el botón Enviar/Cancelar vive en la barra de acciones de acá
    // arriba, pero la lógica de guardado/validación sigue en AssetFormSection.
    const formSectionRef = useRef<AssetFormSectionHandle>(null);
    const [isFormSaving, setIsFormSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiSuggestionActive, setIsAiSuggestionActive] = useState(
        sectionExecution.ai_suggestion_status === 'pending'
    );
    // Tracks when polling just completed (banner still visible, button should already update)
    const [suggestionReadyLocally, setSuggestionReadyLocally] = useState(false);
    const [localSuggestionContent, setLocalSuggestionContent] = useState<string | null>(null);
    const [isDiffOpen, setIsDiffOpen] = useState(false);
    const plateEditorRef = useRef<SectionPlateEditorRef>(null);
    const acceptSuggestion = useAcceptAiSuggestion({
        sectionExecutionId: sectionExecution.id,
        documentId,
        organizationId: selectedOrganizationId ?? undefined,
        editorRef: plateEditorRef,
    });
    // Comentarios anclados que propone la IA: solo se leen mientras el diff está abierto.
    const { data: diffSuggestion } = useQuery({
        queryKey: ['ai-suggestion-detail', sectionExecution.id],
        queryFn: () => getAiSuggestion(sectionExecution.id, selectedOrganizationId ?? undefined),
        enabled: isDiffOpen && !!selectedOrganizationId,
        staleTime: 0,
    });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDefinitionSheetOpen, setIsDefinitionSheetOpen] = useState(false);
    const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(
        (sectionExecution.review_status as ReviewStatus) ?? null
    );
    const [isUpdatingReviewStatus, setIsUpdatingReviewStatus] = useState(false);

    // Sync reviewStatus with server data when the parent refreshes content
    useEffect(() => {
        setReviewStatus((sectionExecution.review_status as ReviewStatus) ?? null);
    }, [sectionExecution.review_status]);

    // Derived: whether there's a completed suggestion ready to review (from server props)
    const hasPendingSuggestion =
        !!sectionExecution.ai_suggestion_content &&
        sectionExecution.ai_suggestion_status === 'completed' &&
        aiPreview === null &&
        !isAiSuggestionActive;
    // Combined: show suggestion-ready UI as soon as polling completes, even while banner is still shown
    const showSuggestionReady = hasPendingSuggestion || suggestionReadyLocally;
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionConfigOpen, setExecutionConfigOpen] = useState(false);
    const [localExecutionMode, setLocalExecutionMode] = useState<'single' | 'from'>('single');
    const isMobile = useIsMobile();
    const { t } = useTranslation(["assets", "common", "sections", "execute"]);
    const { ref: chipNameRef, title: chipNameTitle } = useOverflowTitle<HTMLSpanElement>(sectionName || '');
    const isExecutionApproved = executionStatus === 'approved';

    // Determine which actions are available based on section type
    const canExecute = sectionType === 'ai' || sectionType === null; // AI sections y null pueden ejecutarse
    const canEdit = sectionType !== 'reference' && (sectionType !== 'form' || formHasEditableFields); // Manual, AI y form (con campos editables) pueden editarse
    const canAiEdit = sectionType !== 'reference' && sectionType !== 'form'; // Manual y AI pueden usar AI edit
    const canDelete = sectionType !== 'reference'; // Manual, AI y form pueden eliminarse, reference no
    // Editar la definición (nombre, prompt, dependencias…) aplica a todos los tipos, incluida reference:
    // mismo criterio que el sheet global de Secciones. Requiere la definición viva (section_id).
    const canEditDefinition = canEditSections && !isExecutionApproved && !!sectionExecution.section_id && !!documentId;
    // La definición completa sale de sections_config: se precalienta al acercar el cursor/foco al
    // botón (o al abrir el menú móvil) para que el sheet aparezca ya con el formulario listo.
    const prefetchDefinition = () => {
        if (!canEditDefinition || !documentId || !selectedOrganizationId) return;
        void queryClient.prefetchQuery(sectionsConfigQueryOptions(documentId, selectedOrganizationId, executionId));
    };

    // Check if there's an execution in progress. 'approving' no cuenta como
    // "en progreso de generación": la sección ya terminó, solo falta aprobar.
    const isExecutionInProgress = !!executionStatus && !isExecutionTerminal(executionStatus) && executionStatus !== 'approving';

    // Esta sección puntual está siendo generada/regenerada AHORA por la
    // corrida single/from en curso (a diferencia de isExecutionInProgress,
    // que solo mira executionStatus — acá también hace falta showExecutionFeedback,
    // que AssetContent solo prende para las secciones dentro del scope de esa corrida).
    const isSectionRunActive = showExecutionFeedback && !!executionId &&
        (executionMode === 'single' || executionMode === 'from') && isExecutionInProgress;

    // Colapso local de la sección (editor y lector, todos los tipos). El botón
    // "colapsar/expandir todas" del toolbar (ver assets-content.tsx) no levanta
    // este estado — emite una señal por Context con un `version` que cada sección
    // sincroniza una única vez, para que un toggle individual posterior no quede
    // pisado por renders del Provider que no correspondan a un nuevo click.
    const [isCollapsed, setIsCollapsed] = useState(false);
    const collapseAllSignal = useContext(SectionCollapseContext);
    const lastCollapseSignalVersion = useRef(collapseAllSignal?.version ?? 0);
    useEffect(() => {
        if (!collapseAllSignal || collapseAllSignal.version === lastCollapseSignalVersion.current) return;
        lastCollapseSignalVersion.current = collapseAllSignal.version;
        setIsCollapsed(collapseAllSignal.collapsed);
    }, [collapseAllSignal]);

    // Reporta el estado de colapso de ESTA sección hacia AssetContent — sin esto, el botón
    // "colapsar/expandir todas" del toolbar sólo se entera de su propia última señal, no de un
    // colapso hecho a mano (botón individual o chevron de la columna del lector). Se desregistra
    // al desmontar.
    useEffect(() => {
        onCollapsedChange?.(sectionExecution.id, isCollapsed);
        return () => onCollapsedChange?.(sectionExecution.id, undefined);
    }, [sectionExecution.id, isCollapsed, onCollapsedChange]);

    // Force-open: no tiene sentido editar, responder o ver generarse una sección colapsada.
    useEffect(() => {
        if (isEditing || isAnsweringInReader || isSectionRunActive) setIsCollapsed(false);
    }, [isEditing, isAnsweringInReader, isSectionRunActive]);

    // If section_id is null, the section was removed from the structure and cannot be executed
    const sectionIdForExecution = sectionExecution.section_id ?? null;
    
    // Refs and state for maintaining scroll position - Updated for ScrollArea
    const containerRef = useRef<HTMLDivElement>(null);
    const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);

    // Helper function to find the ScrollArea viewport
    const getScrollAreaViewport = () => {
        // Find the closest ScrollArea viewport (it should have the scroll functionality)
        const viewport = containerRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLDivElement;
        return viewport;
    };

    // Sync editing state with the guard context
    useEffect(() => {
        setIsSectionEditing(isEditing || isAnsweringInReader);
        return () => setIsSectionEditing(false);
    }, [isEditing, isAnsweringInReader, setIsSectionEditing]);

    // Handle entering edit mode with scroll position preservation - Updated for ScrollArea
    const handleStartEditing = () => {
        // Save current scroll position relative to the ScrollArea viewport
        const viewport = getScrollAreaViewport();
        if (viewport && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();
            const scrollTop = viewport.scrollTop;
            const relativePosition = scrollTop + (containerRect.top - viewportRect.top) + viewport.clientHeight / 2;
            setSavedScrollPosition(Math.max(0, relativePosition));
        }
        setIsEditing(true);
    };

    // Handle exiting edit mode - Updated for ScrollArea
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Restore scroll position after a brief delay to allow DOM to update
        setTimeout(() => {
            const viewport = getScrollAreaViewport();
            if (viewport && containerRef.current && savedScrollPosition > 0) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const viewportRect = viewport.getBoundingClientRect();
                const targetScrollTop = savedScrollPosition - (containerRect.top - viewportRect.top) - viewport.clientHeight / 2;
                viewport.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    /**
     * Silent auto-save triggered after a comment mark is added to the editor.
     * Persists plate_content (with the new mark) without affecting edit mode.
     */
    // Autocorrige la UI cuando el backend rechaza una escritura por permiso de
    // sección (403 SECTION_LIFECYCLE_PERMISSION_DENIED / LIFECYCLE_PERMISSION_DENIED):
    // refresca el contenido para que la sección se re-renderice como solo lectura
    // en vez de quedar mostrando controles que van a seguir fallando.
    const invalidateContentOnPermissionDenied = (error: unknown) => {
        if (isSectionPermissionDeniedError(error) && documentId) {
            queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
        }
    };

    const handleAutoSavePlateContent = async (sId: string, markdown: string, pContent: string[]) => {
        // El autosave se dispara por marks de comentario, sin click: necesita su
        // propio gate (capa (c) de los gestos sin botón).
        if (!canEditSections) return;
        try {
            await modifyContent(sId, markdown, pContent);
        } catch (error) {
            // Silent fail para fallas transitorias (best-effort, not user-initiated) —
            // pero un rechazo por permiso es determinístico, no vale la pena callarlo.
            if (isSectionPermissionDeniedError(error)) {
                handleApiError(error, { fallbackMessage: t('section.saveFailed') });
                invalidateContentOnPermissionDenied(error);
            }
        }
    };

    const handleSave = async (sectionId: string, newContent: string, plateContent?: string[]) => {
        if (!canEditSections) return;
        try {
            setIsSaving(true);
            await modifyContent(sectionId, newContent, plateContent);
            setIsEditing(false);
            setAiPreview(null);
            onUpdate?.();

            // Restore scroll position after save - Updated for ScrollArea
            setTimeout(() => {
                const viewport = getScrollAreaViewport();
                if (viewport && containerRef.current && savedScrollPosition > 0) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const viewportRect = viewport.getBoundingClientRect();
                    const targetScrollTop = savedScrollPosition - (containerRect.top - viewportRect.top) - viewport.clientHeight / 2;
                    viewport.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth'
                    });
                }
            }, 100);
        } catch (error) {
            logger.error('Error saving content', error);
            handleApiError(error, { fallbackMessage: t('section.saveFailed') });
            if (isSectionPermissionDeniedError(error)) {
                // Seguir en modo edición sería engañoso acá: a diferencia de una falla
                // transitoria, reintentar guardar va a fallar igual.
                setIsEditing(false);
                invalidateContentOnPermissionDenied(error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Effect to restore scroll position when entering edit mode - Updated for ScrollArea
    useEffect(() => {
        if (isEditing && savedScrollPosition > 0 && containerRef.current) {
            setTimeout(() => {
                const viewport = getScrollAreaViewport();
                if (viewport && containerRef.current) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const viewportRect = viewport.getBoundingClientRect();
                    const targetScrollTop = savedScrollPosition - (containerRect.top - viewportRect.top) - viewport.clientHeight / 2;
                    viewport.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth'
                    });
                }
            }, 150); // Slightly longer delay to ensure editor is fully rendered
        }
    }, [isEditing, savedScrollPosition]);

    const handleCopy = async () => {
        try {
            const contentToCopy = sectionType === 'form'
                ? (sectionExecution.form_fields ?? [])
                    .filter(isFieldVisible)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((field) =>
                        // Etiqueta es un separador visual, no una pregunta: solo el título, sin "campo: valor".
                        field.question_type === QUESTION_TYPE.label
                            ? formatFieldValueForCopy(field, t)
                            : `${field.field_name}: ${formatFieldValueForCopy(field, t)}`,
                    )
                    .join('\n')
                : displayedContent;
            await navigator.clipboard.writeText(contentToCopy);
            toast.success(t('section.contentCopied'));
        } catch (error) {
            logger.error('Error copying to clipboard:', error);
            toast.error(t('section.copyFailed'));
        }
    };

    const handleReviewStatusChange = async (newStatus: ReviewStatus) => {
        // Es un select, no un botón: el `disabled` es solo la capa visual.
        if (!canEditSections) return;
        try {
            setIsUpdatingReviewStatus(true);
            await updateReviewStatus(sectionExecution.id, newStatus, selectedOrganizationId ?? undefined);
            setReviewStatus(newStatus);
            onUpdate?.();
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.reviewStatusUpdateFailed') });
            invalidateContentOnPermissionDenied(error);
        } finally {
            setIsUpdatingReviewStatus(false);
        }
    };

    const handleOpenExecutionConfig = (mode: 'single' | 'from') => {
        setLocalExecutionMode(mode);
        setExecutionConfigOpen(true);
    };

    const handleExecuteWithConfig = async (config: ExecutionConfig) => {
        if (!documentId || !executionId || !sectionIdForExecution) {
            toast.error(t('section.missingInfo'));
            return;
        }

        if (generationBlocked) {
            toast.error(cannotGenerateReason ?? t('section.executionFailed'));
            return;
        }

        try {
            setIsExecuting(true);
            setExecutionConfigOpen(false);
            // localExecutionMode es lo que el usuario eligió en el menú ("Ejecutar
            // sección" vs "Ejecutar desde esta sección"); el prop executionMode
            // describe la ejecución EN CURSO (default 'single') y no debe usarse acá
            // para elegir el endpoint — hacerlo regeneraba siempre desde la sección
            // en adelante, sin importar qué opción se hubiera elegido.
            onExecutionStart?.(executionId, localExecutionMode); // Pass executionId to show banner

            if (localExecutionMode === 'single') {
                await executeSingleSection(
                    documentId,
                    executionId,
                    sectionIdForExecution,
                    selectedOrganizationId!,
                    config.llmModel,
                    config.instructions
                );
                toast.success(t('section.sectionExecutionStarted'));
            } else {
                await executeFromSection(
                    documentId,
                    executionId,
                    sectionIdForExecution,
                    selectedOrganizationId!,
                    config.llmModel,
                    config.instructions
                );
                toast.success(t('section.executionFromSectionStarted'));
            }
            // No se invalida document-content acá (B8): el contenido todavía no
            // cambió, lo refresca AssetContent cuando la sección aparece 'done'
            // de verdad en sections_status.
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.executionFailed') });
        } finally {
            setIsExecuting(false);
        }
    };

    function openDeleteDialog() {
        setIsDeleteDialogOpen(true);
    }

    function closeDeleteDialog() {
        setIsDeleteDialogOpen(false);
    }

    const handleDeleteDialogChange = (open: boolean) => {
        if (open) {
            openDeleteDialog();
        } else {
            closeDeleteDialog();
        }
    };

    const handleAiEditDialogChange = (open: boolean) => {
        setIsAiEditDialogOpen(open);
    };

    const normalizedSectionType = sectionType ?? 'manual';
    // Sección manual sin texto, en modo editor y fuera de edición: se muestra una caja de ayuda en vez de
    // un editor en blanco. El editor sigue montado (solo se oculta) para no reconstruir Plate.
    const isManualEmpty = useMemo(
        () => normalizedSectionType === 'manual' && isSectionContentEmpty(sectionExecution),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- depende solo del texto; `sectionExecution` cambia de identidad en cada render
        [normalizedSectionType, sectionExecution.output, sectionExecution.plate_content],
    );
    const showManualEmptyBox = isManualEmpty && readyToEdit && !isEditing && !isSectionRunActive;
    const SECTION_TYPE_LABEL_KEY = {
        ai: 'section.typeAi',
        manual: 'section.typeManual',
        reference: 'section.typeReference',
        form: 'section.typeForm',
    } as const;
    const sectionTypeLabel = t(SECTION_TYPE_LABEL_KEY[normalizedSectionType as keyof typeof SECTION_TYPE_LABEL_KEY] ?? 'section.typeManual');
    const answersPillTone: AnswersPillTone = !sectionCanAnswer
        ? 'inactive'
        : sectionExecution.answers_status === 'completed'
            ? 'completed'
            : 'pending';

    const handleSendAiEdit = async (prompt: string) => {
        try {
            await createAiSuggestion(sectionExecution.id, prompt, selectedOrganizationId ?? undefined);
            // Remove stale cache so AiSuggestionFeedback starts polling fresh data on mount
            queryClient.removeQueries({ queryKey: ['ai-suggestion', sectionExecution.id] });
            setIsAiSuggestionActive(true);
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.executionFailed') });
            invalidateContentOnPermissionDenied(error);
        }
        setIsAiEditDialogOpen(false);
    };

    const handleDelete = async () => {
        try {
            await deleteSectionExec(sectionExecution.id);
            toast.success(t('section.sectionDeleted'));
            // Borrar una sección cambia qué filas de acceso aplican — refresca la lista
            // de secciones con `view` (ver useDocumentSectionAccess).
            invalidateSectionAccess(documentId);
            onUpdate?.();
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.deleteFailed') });
            throw error;
        }
    };

    const displayedContent = (aiPreview !== null && !isDiffOpen)
        ? stripCommentMarkers(aiPreview)
        : sectionExecution.output.replace(/\\n/g, "\n");

    // Compartido entre secciones form y no-form: dónde deben quedar los archivos que
    // se suban (editor Plate o campos de formulario tipo carga_de_archivos) — a la
    // versión activa (execution) si existe, si no al asset (document).
    const mediaUploadTarget = executionId
      ? { level: 'execution' as const, parentId: executionId }
      : documentId
        ? { level: 'document' as const, parentId: documentId }
        : null;

    // Compartido entre las ramas editor/lector de sección no-form: sólo cambia el wrapper
    // (barra sticky con chevron en editor, header discreto en lector), nunca este elemento —
    // ver comentario de "no desmontar Plate" más abajo.
    const plateEditor = (
        <SectionPlateEditor
            ref={plateEditorRef}
            sectionId={sectionExecution.id}
            content={displayedContent}
            plateContent={sectionExecution.plate_content}
            isEditing={readyToEdit && isEditing}
            onSave={handleSave}
            onAutoSavePlateContent={handleAutoSavePlateContent}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
            documentId={documentId}
            sectionExecutionId={sectionExecution.id}
            organizationId={selectedOrganizationId ?? undefined}
            mediaUploadTarget={mediaUploadTarget}
            toolbarTopOffset="42px"
            flushReadOnly
            onCreateSectionFromSelection={readyToEdit && canEditSections ? onCreateSectionFromSelection : undefined}
        />
    );

    const handleViewSuggestion = () => {
        setAiPreview(sectionExecution.ai_suggestion_content ?? null);
        setIsDiffOpen(true);
    };

    const handleAiSuggestionCompleted = (content: string) => {
        // Keep banner visible (transitions to completed state) and update the button immediately.
        setSuggestionReadyLocally(true);
        setLocalSuggestionContent(content);
        // Refresh server props in the background so ai_suggestion_status becomes 'completed'.
        queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
    };

    const handleAiSuggestionView = (content: string) => {
        // User clicked "View Suggestion" (either in banner or header button) – open the diff.
        setIsAiSuggestionActive(false);
        setSuggestionReadyLocally(false);
        setLocalSuggestionContent(null);
        setAiPreview(content || sectionExecution.ai_suggestion_content || null);
        setIsDiffOpen(true);
    };

    const handleAiSuggestionDismiss = () => {
        setIsAiSuggestionActive(false);
        setSuggestionReadyLocally(false);
        setLocalSuggestionContent(null);
    };

    const handleAiSuggestionFailed = () => {
        // Called when the user dismisses a failed banner; clear all local suggestion state.
        setSuggestionReadyLocally(false);
        setLocalSuggestionContent(null);
    };

    return (
        <div ref={containerRef} className={`${readyToEdit ? 'p-2' : 'py-0 px-2'} relative`}>
            {/* Action Buttons - Always sticky */}
            {readyToEdit && (
                <div
                    className={cn(
                        'sticky top-0 z-(--z-page-sticky) -ml-[14px] -mr-[10px] -mt-2 mb-2 flex w-[calc(100%+24px)] max-w-none flex-wrap items-center gap-[10px] border-l-2 bg-[rgba(255,255,255,.97)] py-[6px] pl-[14px] pr-[8px]',
                        isEditing ? 'border-l-[#2563eb]' : 'border-l-transparent'
                    )}
                >
                    {/* Además de informativo, es un segundo trigger de colapso (el chevron
                        de más abajo es el principal — este chip no siempre está presente). */}
                    {(sectionName || sectionType) && (
                        <button
                            type="button"
                            onClick={() => setIsCollapsed((prev) => !prev)}
                            className={cn(
                                'flex h-7 items-center gap-2 rounded-lg px-[11px] transition-[filter] hover:cursor-pointer hover:brightness-[.97]',
                                sectionCanAnswer ? 'bg-[#eff5ff]' : 'bg-[#f1f5f9]'
                            )}
                            title={isCollapsed ? t('section.expand') : t('section.collapse')}
                        >
                            <span
                                ref={chipNameRef}
                                title={chipNameTitle}
                                className={cn(
                                    'max-w-60 truncate text-[12.5px] font-semibold',
                                    sectionCanAnswer ? 'text-[#2563eb]' : 'text-[#64748b]'
                                )}
                            >
                                {sectionIndex !== undefined && `${sectionIndex + 1}. `}
                                {sectionName || t('section.untitled')}
                            </span>
                            <span
                                aria-hidden
                                className={cn('h-[3px] w-[3px] rounded-full opacity-50', sectionCanAnswer ? 'bg-[#2563eb]' : 'bg-[#64748b]')}
                            />
                            <span
                                className={cn(
                                    'text-[10.5px] font-bold uppercase tracking-[.06em]',
                                    sectionCanAnswer ? 'text-[#6b8fe8]' : 'text-[#64748b]'
                                )}
                            >
                                {sectionTypeLabel}
                            </span>
                        </button>
                    )}

                    {/* Permiso de sección por ciclo de vida: solo lectura en esta etapa aunque
                        el resto del documento sea editable (ver readOnlyBySectionRule arriba). */}
                    {readOnlyBySectionRule && (
                        <span className={SECTION_BAR_BADGE_CLASS} title={t('section.readOnlyByLifecycleRuleTooltip')}>
                            {t('section.readOnlyBadge')}
                        </span>
                    )}

                    {/* Sección con depends_on propio no cumplido, mostrada por show_when_inactive:true */}
                    {!sectionCanAnswer && (
                        <span className={SECTION_BAR_BADGE_CLASS} title={t('form.fill.sectionInactive', { ns: 'sections' })}>
                            {t('form.fill.sectionInactive', { ns: 'sections' })}
                        </span>
                    )}

                    {/* Estado de respuestas (form: solo lectura, calculado por el backend). */}
                    {sectionType === 'form' && (
                        <span
                            className={cn(
                                'inline-flex h-6 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold',
                                ANSWERS_PILL_CLASS[answersPillTone].pill
                            )}
                        >
                            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', ANSWERS_PILL_CLASS[answersPillTone].dot)} />
                            {answersPillTone === 'inactive'
                                ? t('form.fill.sectionInactive', { ns: 'sections' })
                                : t(answersPillTone === 'completed' ? 'section.answersStatusCompleted' : 'section.answersStatusPending')}
                        </span>
                    )}

                    {/* Estado de revisión (no-form): selector manual. */}
                    {sectionType !== 'form' && !isEditing && (
                        <HuemulField
                            type="select"
                            label=""
                            value={reviewStatus ?? ''}
                            onChange={(v) => handleReviewStatusChange(v as ReviewStatus)}
                            disabled={isUpdatingReviewStatus || !canEditSections}
                            placeholder={t('section.reviewStatusPlaceholder')}
                            options={[
                                { value: 'editing', label: t('section.reviewStatusEditing'), color: REVIEW_STATUS_DOT_COLOR.editing },
                                { value: 'reviewing', label: t('section.reviewStatusReviewing'), color: REVIEW_STATUS_DOT_COLOR.reviewing },
                                { value: 'finished', label: t('section.reviewStatusFinished'), color: REVIEW_STATUS_DOT_COLOR.finished },
                                { value: 'rejected', label: t('section.reviewStatusRejected'), color: REVIEW_STATUS_DOT_COLOR.rejected },
                            ]}
                            className="w-auto"
                            selectSize="xs"
                            inputClassName={reviewSelectClass(reviewStatus, !canEditSections)}
                        />
                    )}

                    {/* Espaciador */}
                    <div className="flex-1" />

                    {/* Edición de formulario: "Dejar de editar" reemplaza las acciones normales, Copiar se mantiene */}
                    {isEditing && sectionType === 'form' && (
                        <div className="flex items-center gap-2">
                            <SectionBarButton tone="tertiary" icon={Copy} tooltip={t('section.copyContent')} onClick={handleCopy} />
                            <button
                                type="button"
                                disabled={isFormSaving}
                                onClick={() => formSectionRef.current?.exit()}
                                className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] bg-[#0f172a] px-3 text-[12.5px] font-semibold text-white transition-colors hover:cursor-pointer hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isFormSaving ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Eye className="h-[15px] w-[15px] stroke-[1.9]" />}
                                {isFormSaving ? t('common:saving') : t('sections:form.fill.doneEditing')}
                            </button>
                        </div>
                    )}

                    {!isEditing && (
                    <>
                        {/* Desktop: acciones directas en tres grupos [Ejecutar] | [Editar · IA] | [Copiar · Historial · Eliminar] */}
                        {!isMobile && (
                            <div className="flex items-center">
                                {interleaveGroups(
                                    [
                                        ((onOpenExecuteSheet && !isExecutionApproved && canExecute && canEditSections && !!sectionExecution.section_id) || canEditDefinition) && (
                                            <div key="run" className="flex items-center gap-px">
                                                {onOpenExecuteSheet && !isExecutionApproved && canExecute && canEditSections && !!sectionExecution.section_id && (
                                                    <SectionBarButton
                                                        tone="primary"
                                                        icon={Play}
                                                        label={t('section.run')}
                                                        tooltip={
                                                            isExecutionInProgress
                                                                ? t('section.executionInProgress')
                                                                : generationBlocked
                                                                    ? (cannotGenerateReason ?? t('section.openExecuteSheet'))
                                                                    : t('section.openExecuteSheet')
                                                        }
                                                        onClick={onOpenExecuteSheet}
                                                        disabled={isExecutionInProgress || generationBlocked}
                                                    />
                                                )}
                                                {canEditDefinition && (
                                                    <SectionBarButton
                                                        tone="secondary"
                                                        icon={SlidersHorizontal}
                                                        tooltip={t('section.editDefinition')}
                                                        onClick={() => setIsDefinitionSheetOpen(true)}
                                                        onPrefetch={prefetchDefinition}
                                                    />
                                                )}
                                            </div>
                                        ),
                                        ((!isExecutionApproved && canEdit && canEditSections) || (!isExecutionApproved && canAiEdit && canEditSections)) && (
                                            <div key="edit" className="flex items-center gap-px">
                                                {!isExecutionApproved && canEdit && canEditSections && (
                                                    <SectionBarButton
                                                        tone="secondary"
                                                        icon={Pencil}
                                                        tooltip={t('section.editSection')}
                                                        onClick={handleStartEditing}
                                                    />
                                                )}
                                                {!isExecutionApproved && canAiEdit && canEditSections && (
                                                    <SectionBarButton
                                                        tone="secondary"
                                                        icon={showSuggestionReady ? GitCompare : Bot}
                                                        iconClassName={showSuggestionReady ? 'text-amber-600' : undefined}
                                                        className={cn(
                                                            isAiSuggestionActive && !suggestionReadyLocally && 'pointer-events-none opacity-40'
                                                        )}
                                                        tooltip={
                                                            showSuggestionReady
                                                                ? t('section.viewAiSuggestion')
                                                                : isAiSuggestionActive
                                                                    ? t('section.suggestionInProgress')
                                                                    : t('section.askAiToEdit')
                                                        }
                                                        onClick={() => {
                                                            if (suggestionReadyLocally) {
                                                                handleAiSuggestionView(localSuggestionContent ?? '');
                                                            } else if (hasPendingSuggestion) {
                                                                handleViewSuggestion();
                                                            } else {
                                                                setIsAiEditDialogOpen(true);
                                                            }
                                                        }}
                                                    >
                                                        {showSuggestionReady && (
                                                            <span className={cn(
                                                                'absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500',
                                                                suggestionReadyLocally && 'animate-pulse'
                                                            )} />
                                                        )}
                                                    </SectionBarButton>
                                                )}
                                            </div>
                                        ),
                                        <div key="tail" className="flex items-center gap-px">
                                            <SectionBarButton tone="tertiary" icon={Copy} tooltip={t('section.copyContent')} onClick={handleCopy} />
                                            <SectionBarButton
                                                tone="tertiary"
                                                icon={History}
                                                tooltip={t('section.viewHistory')}
                                                onClick={() => setIsHistorySheetOpen(true)}
                                            />
                                            {!isExecutionApproved && canDelete && canEditSections && (
                                                <SectionBarButton
                                                    tone="danger"
                                                    icon={Trash2}
                                                    tooltip={t('section.deleteSection')}
                                                    onClick={() => openDeleteDialog()}
                                                />
                                            )}
                                        </div>,
                                    ],
                                    (i) => <SectionBarDivider key={`divider-${i}`} />
                                )}
                            </div>
                        )}

                        {/* Mobile: Dropdown Menu */}
                        {isMobile && (
                            <DropdownMenu onOpenChange={(isOpen) => { if (isOpen) prefetchDefinition(); }}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        title={t('common:actions')}
                                        aria-label={t('common:actions')}
                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[#94a3b8] hover:cursor-pointer hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                                    >
                                        <MoreVertical className="h-[15px] w-[15px] stroke-[1.9]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className='hover:cursor-pointer'
                                        onClick={handleCopy}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        {t('section.copy')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className='hover:cursor-pointer'
                                        onSelect={() => {
                                            setTimeout(() => setIsHistorySheetOpen(true), 0);
                                        }}
                                    >
                                        <History className="h-4 w-4 mr-2" />
                                        {t('section.viewHistoryMenu')}
                                    </DropdownMenuItem>
                                    {documentId && executionId && sectionIdForExecution && !isExecutionApproved && canExecute && canEditSections && (
                                        <>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onSelect={() => {
                                                    setTimeout(() => handleOpenExecutionConfig('single'), 0);
                                                }}
                                                disabled={isExecuting || isExecutionInProgress || generationBlocked}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {t('section.executeSection')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onSelect={() => {
                                                    setTimeout(() => handleOpenExecutionConfig('from'), 0);
                                                }}
                                                disabled={isExecuting || isExecutionInProgress || generationBlocked}
                                            >
                                                <FastForward className="h-4 w-4 mr-2" />
                                                {t('section.executeFromSection')}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {canEditDefinition && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onSelect={() => {
                                                setTimeout(() => setIsDefinitionSheetOpen(true), 0);
                                            }}
                                        >
                                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                                            {t('section.editDefinition')}
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isExecutionApproved && canEdit && canEditSections && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={handleStartEditing}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            {t('common:edit')}
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isExecutionApproved && canAiEdit && canEditSections && (
                                        showSuggestionReady ? (
                                            <DropdownMenuItem
                                                className="hover:cursor-pointer"
                                                onSelect={() => {
                                                    if (suggestionReadyLocally) {
                                                        setTimeout(() => handleAiSuggestionView(localSuggestionContent ?? ''), 0);
                                                    } else {
                                                        setTimeout(() => handleViewSuggestion(), 0);
                                                    }
                                                }}
                                            >
                                                <GitCompare className="h-4 w-4 mr-2 text-amber-600" />
                                                {t('section.viewAiSuggestionMenu')}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem 
                                                className="hover:cursor-pointer"
                                                disabled={isAiSuggestionActive}
                                                onSelect={() => {
                                                    setTimeout(() => setIsAiEditDialogOpen(true), 0);
                                                }}
                                            >
                                                <Bot className="h-4 w-4 mr-2" />
                                                {t('section.askAiToEditMenu')}
                                            </DropdownMenuItem>
                                        )
                                    )}
                                    {!isEditing && !isExecutionApproved && canDelete && canEditSections && (
                                        <DropdownMenuItem 
                                            className="text-red-600 hover:cursor-pointer"
                                            onSelect={() => {
                                                setTimeout(() => openDeleteDialog(), 0);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t('common:delete')}
                                        </DropdownMenuItem>
                                    )}
                                    {onOpenExecuteSheet && !isExecutionApproved && canExecute && canEditSections && !!sectionExecution.section_id && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onSelect={() => {
                                                setTimeout(() => onOpenExecuteSheet(), 0);
                                            }}
                                            disabled={isExecutionInProgress}
                                        >
                                            <Play className="h-4 w-4 mr-2 text-blue-600" />
                                            {isExecutionInProgress ? t('section.executionInProgress') : t('section.openExecuteSheet')}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Colapsar/expandir sección — navegación, no una acción de edición,
                            por eso vive fuera del dropdown móvil y de los grupos anteriores. */}
                        <SectionBarDivider className="mx-[3px]" />
                        <button
                            type="button"
                            title={isCollapsed ? t('common:expand') : t('common:collapse')}
                            aria-label={isCollapsed ? t('common:expand') : t('common:collapse')}
                            onClick={() => setIsCollapsed((prev) => !prev)}
                            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9] hover:text-[#475569]"
                        >
                            <ChevronDown
                                className={cn('h-3.5 w-3.5 transition-transform duration-200', !isCollapsed && 'rotate-180')}
                            />
                        </button>
                    </>
                    )}

                </div>
            )}
            
            {isAiSuggestionActive && (
                <div className="mb-3 sticky top-[42px] z-(--z-page-sticky-secondary) shadow-lg">
                    <AiSuggestionFeedback
                        sectionExecutionId={sectionExecution.id}
                        onCompleted={handleAiSuggestionCompleted}
                        onFailed={handleAiSuggestionFailed}
                        onDismiss={handleAiSuggestionDismiss}
                        onViewSuggestion={handleAiSuggestionView}
                    />
                </div>
            )}
            {aiPreview !== null && !isAiSuggestionActive && !isDiffOpen && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between sticky top-[42px] z-(--z-page-sticky-secondary) shadow-lg">
                    <span className="text-sm text-amber-800">{t('section.aiPreviewReady')}</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleSave(sectionExecution.id, stripCommentMarkers(aiPreview || ''))}
                            disabled={isSaving}
                            className="hover:cursor-pointer"
                        >
                            {t('common:save')}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAiPreview(null)}
                            disabled={isSaving}
                            className="hover:cursor-pointer"
                        >
                            {t('section.undo')}
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Chip discreto de estado — el progreso agregado de la corrida vive en un
                único banner por encima del contenido (ver ExecutionRunProgressBanner
                en AssetContent), no uno por sección. */}
            {isSectionRunActive && (
                <div className="mb-2 flex items-center gap-1.5">
                    <span className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        executionStatus === 'failed'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                    )}>
                        {executionStatus === 'failed'
                            ? <XCircle className="h-3 w-3" />
                            : executionStatus === 'pending'
                                ? <Clock className="h-3 w-3" />
                                : <Loader2 className="h-3 w-3 animate-spin" />}
                        {executionStatus === 'failed'
                            ? t('execute:sectionChip.failed')
                            : executionStatus === 'pending'
                                ? t('execute:sectionChip.pending')
                                : t('execute:sectionChip.generating')}
                    </span>
                </div>
            )}

            {/* Content area — wrapped in a relative container so the "generating"
                skeleton can be OVERLAID on top of the real content instead of
                replacing it in the tree. Unmounting/remounting SectionPlateEditor
                on every run (as before) tears down and rebuilds a full Plate
                instance (~22 plugin kits) synchronously on the main thread right
                when the run finishes — that's the freeze users hit. Keeping it
                mounted and just hiding it (`invisible`) avoids that rebuild; the
                editor picks up the fresh content via its own reset effect once
                `content`/`plateContent` change (see SectionPlateEditor). */}
            <div className="relative">
            {isSectionRunActive && (
                <div className="pt-4 pr-4">
                    <div className="animate-pulse space-y-4">
                        {/* Title skeleton */}
                        <div className="h-6 bg-gray-200 rounded w-2/3"></div>

                        {/* Paragraph skeletons */}
                        <div className="space-y-3 pt-4">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>

                        {/* Loading indicator */}
                        <div className="flex items-center justify-center pt-4 pb-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="ml-2 text-xs text-gray-500">{t('section.generatingSectionContent')}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className={isSectionRunActive ? 'invisible absolute inset-0 overflow-hidden' : undefined}>
            {sectionType === 'form' ? (
                !readyToEdit ? (
                    /* Reader mode: numbered/collapsible summary card instead of the flat answer stack.
                       Colapso controlado desde acá (open/onOpenChange) — mismo estado que gobierna las
                       secciones no-form, así "colapsar todas" también alcanza a los forms. */
                    <AssetFormSectionReader
                        section={sectionExecution}
                        sectionName={sectionName}
                        sectionIndex={sectionIndex ?? 0}
                        canAnswer={canAnswerInReader}
                        isAnswering={isAnsweringInReader}
                        isSaving={isFormSaving}
                        onStartAnswering={() => setIsAnsweringInReader(true)}
                        onDoneAnswering={() => formSectionRef.current?.exit()}
                        onOpenHistory={() => setIsHistorySheetOpen(true)}
                        open={!isCollapsed}
                        onOpenChange={(open) => setIsCollapsed(!open)}
                    >
                        {isAnsweringInReader && (
                            <AssetFormSection
                                ref={formSectionRef}
                                sectionExecutionId={sectionExecution.id}
                                formFields={sectionExecution.form_fields ?? []}
                                status={status}
                                organizationId={selectedOrganizationId ?? undefined}
                                documentId={documentId}
                                mediaUploadTarget={mediaUploadTarget}
                                canInteract={canEditSections}
                                isEditing
                                onExitEditing={() => setIsAnsweringInReader(false)}
                                onUpdate={onUpdate}
                                onSavingChange={setIsFormSaving}
                            />
                        )}
                    </AssetFormSectionReader>
                ) : (
                    /* Form section: render fillable/read-only form instead of the Plate editor.
                       El chevron vive en la barra sticky de arriba; acá sólo se oculta el contenido. */
                    <div className={cn('pt-4 pr-2 w-full', isCollapsed && 'hidden')}>
                        <AssetFormSection
                            ref={formSectionRef}
                            sectionExecutionId={sectionExecution.id}
                            formFields={sectionExecution.form_fields ?? []}
                            status={status}
                            organizationId={selectedOrganizationId ?? undefined}
                            documentId={documentId}
                            mediaUploadTarget={mediaUploadTarget}
                            canInteract={readyToEdit && canEditSections && sectionCanAnswer}
                            isEditing={isEditing}
                            onExitEditing={handleCancelEdit}
                            onUpdate={onUpdate}
                            onSavingChange={setIsFormSaving}
                        />
                    </div>
                )
            ) : (
                /* Editor y lector, no-form: MISMO árbol en ambos modos — la columna de controles
                   del lector es un hermano CONDICIONAL (índice estable), nunca una rama
                   alternativa. Si {plateEditor} cambiara de posición entre modos, React lo
                   desmonta y remonta (reconstruye un Plate completo, ~25 plugin kits, por
                   sección) en cada toggle Lector/Editor — ese remount síncrono en todas las
                   secciones a la vez es lo que congelaba el cambio de modo. En editor el chevron
                   vive en la barra sticky de arriba; en lector, una columna flotante en el margen
                   derecho (fuera de la columna de lectura: menú ⋮ con historial + chevron) casi
                   invisible. COLAPSADA se muestra además una pastilla con el nombre de la sección:
                   único indicio de cuál es. */
                <div className={cn(!readyToEdit && 'relative')}>
                    {!readyToEdit && (
                        <div
                            className={cn(
                                'absolute top-[2px] flex flex-col gap-[2px]',
                                isMobile ? 'right-0' : '-right-[44px]'
                            )}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        title={t('common:actions')}
                                        aria-label={t('common:actions')}
                                        className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-transparent text-[#cbd5e1] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9] hover:text-[#334155]"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-[180px] rounded-[10px] border-0 bg-white p-[5px] shadow-[0_0_0_1px_#e2e8f0,0_18px_36px_-14px_rgba(15,23,42,.28)]"
                                >
                                    <DropdownMenuItem
                                        className="h-8 text-[13px] font-medium hover:cursor-pointer focus:bg-[#f1f5f9]"
                                        onSelect={() => {
                                            setTimeout(() => setIsHistorySheetOpen(true), 0);
                                        }}
                                    >
                                        <History className="h-4 w-4 mr-2" />
                                        {t('section.viewHistoryMenu')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button
                                type="button"
                                title={isCollapsed ? t('section.expand') : t('section.collapse')}
                                aria-label={isCollapsed ? t('section.expand') : t('section.collapse')}
                                onClick={() => setIsCollapsed((prev) => !prev)}
                                className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-transparent text-[#cbd5e1] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9] hover:text-[#334155]"
                            >
                                <ChevronDown
                                    className={cn('h-4 w-4 transition-transform duration-200', isCollapsed && '-rotate-90')}
                                />
                            </button>
                        </div>
                    )}
                    <div className={cn('min-w-0', !readyToEdit && isMobile && 'pr-9')}>
                        {!readyToEdit && isCollapsed && (
                            <button
                                type="button"
                                onClick={() => setIsCollapsed(false)}
                                className="mb-1 inline-flex h-[30px] max-w-full items-center gap-1 rounded-lg bg-[#f8fafc] px-3 text-left hover:cursor-pointer hover:bg-[#f1f5f9]"
                                title={t('section.expand')}
                            >
                                <span className="truncate text-[13px] font-semibold text-[#475569]">
                                    {sectionName || t('section.untitled')}
                                </span>
                                <span className="shrink-0 text-[13px] text-[#94a3b8]">· {t('section.contentHidden')}</span>
                            </button>
                        )}
                        {showManualEmptyBox && !isCollapsed && (
                            <div className="mt-4 mr-2 rounded-lg bg-[#f8fafc] p-3.5 text-center text-[13px] text-[#94a3b8]">
                                {t('section.emptyManual')}
                            </div>
                        )}
                        <div
                            className={cn(
                                readyToEdit ? (isEditing ? 'pt-2 pr-0' : 'pt-4 pr-2 w-full') : 'pt-1 w-full',
                                ((!isEditing && isCollapsed) || showManualEmptyBox) && 'hidden'
                            )}
                        >
                            {plateEditor}
                        </div>
                    </div>
                </div>
            )}
            </div>
            </div>

        {/* Delete Confirmation Dialog */}
        <DeleteSectionDialog
            open={isDeleteDialogOpen}
            onOpenChange={handleDeleteDialogChange}
            onAction={handleDelete}
        />

        {canEditDefinition && sectionExecution.section_id && documentId && (
            <SectionDefinitionSheet
                open={isDefinitionSheetOpen}
                onOpenChange={setIsDefinitionSheetOpen}
                documentId={documentId}
                executionId={executionId}
                sectionId={sectionExecution.section_id}
            />
        )}

        {/* Execution Configuration Dialog */}
        <ExecutionConfigDialog
            open={executionConfigOpen}
            onOpenChange={setExecutionConfigOpen}
            mode={localExecutionMode}
            onExecute={handleExecuteWithConfig}
            isExecuting={isExecuting}
        />

        {/* AI Edit Dialog */}
        <AiEditSectionDialog
            open={isAiEditDialogOpen}
            onOpenChange={handleAiEditDialogChange}
            onSend={handleSendAiEdit}
            isProcessing={false}
        />

        {/* Change History Sheet */}
        <AssetHistorySheet
            open={isHistorySheetOpen}
            onOpenChange={setIsHistorySheetOpen}
            organizationId={selectedOrganizationId ?? ''}
            tabs={SECTION_HISTORY_TABS}
            sectionExecutionId={sectionExecution.id}
            sectionName={sectionName}
            entityName={sectionName}
        />

        {/* AI Suggestion Diff Dialog */}
        <AiSuggestionDiffDialog
            open={isDiffOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setAiPreview(null);
                    setIsDiffOpen(false);
                    // Refresh so hasPendingSuggestion reflects server state
                    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
                }
            }}
            sectionOutput={sectionExecution.output}
            aiSuggestionInstruction={sectionExecution.ai_suggestion_instruction}
            aiSuggestionContent={sectionExecution.ai_suggestion_content}
            aiSuggestionComments={diffSuggestion?.comments}
            aiPreview={aiPreview}
            onReject={async () => {
                try {
                    await rejectAiSuggestion(sectionExecution.id, selectedOrganizationId ?? undefined);
                    await queryClient.refetchQueries({ queryKey: ['document-content', documentId] });
                    setAiPreview(null);
                    setIsDiffOpen(false);
                } catch (error) {
                    // Dejar el diálogo abierto con el diff visible: el usuario ve el error
                    // sin perder el estado de lo que estaba revisando.
                    handleApiError(error, { fallbackMessage: t('section.aiSuggestionActionFailed') });
                    invalidateContentOnPermissionDenied(error);
                }
            }}
            onAccept={async () => {
                try {
                    await acceptSuggestion();
                    await queryClient.refetchQueries({ queryKey: ['document-content', documentId] });
                    setAiPreview(null);
                    setIsDiffOpen(false);
                    onUpdate?.();
                } catch (error) {
                    handleApiError(error, { fallbackMessage: t('section.aiSuggestionActionFailed') });
                    invalidateContentOnPermissionDenied(error);
                }
            }}
        />
        </div>
    );

}

/**
 * Shallow-equal for arbitrary values, with array support: arrays are compared
 * by length + per-item shallow equality (object items compared by their own keys).
 * Used so array-typed fields (plate_content, form_fields, ...) don't need special-casing.
 */
function shallowEqualValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => {
      const other = b[i];
      if (item && typeof item === "object" && other && typeof other === "object") {
        const keys = new Set([...Object.keys(item), ...Object.keys(other)]);
        for (const key of keys) {
          if (!Object.is((item as Record<string, unknown>)[key], (other as Record<string, unknown>)[key])) {
            return false;
          }
        }
        return true;
      }
      return Object.is(item, other);
    });
  }
  return false;
}

/**
 * Custom equality check for React.memo.
 * Compares every field of `sectionExecution` and every non-function top-level prop
 * generically (Object.keys), rather than a hardcoded whitelist — so a field added
 * later to `ContentSection`/`SectionExecutionProps` is covered without editing this
 * function. Callbacks are skipped (assumed stable enough across renders).
 */
function areSectionPropsEqual(prev: SectionExecutionProps, next: SectionExecutionProps): boolean {
  const sectionKeys = new Set([
    ...Object.keys(prev.sectionExecution),
    ...Object.keys(next.sectionExecution),
  ]);
  // `output` (markdown) is a single string compare — cheap even for a huge section.
  // `plate_content` never changes without `output` also changing, so skip its per-item
  // walk (shallowEqualValue over every JSON string) when output didn't move. Without this,
  // every render of AssetContent (e.g. each 2s execution-status poll) re-scans the full
  // serialized content of every section just to conclude nothing changed.
  // `form_fields` SÍ se compara siempre: el parche de PATCH /form_values
  // (applyFormValuesPatch) lo reemplaza sin tocar `output`, y saltarlo dejaba el modo
  // lector con las respuestas viejas hasta refrescar la página.
  const outputChanged = !Object.is(prev.sectionExecution.output, next.sectionExecution.output);
  for (const key of sectionKeys) {
    if (!outputChanged && key === 'plate_content') continue;
    const k = key as keyof typeof next.sectionExecution;
    if (!shallowEqualValue(prev.sectionExecution[k], next.sectionExecution[k])) return false;
  }

  for (const key of Object.keys(next) as (keyof SectionExecutionProps)[]) {
    if (key === "sectionExecution") continue;
    const nextVal = next[key];
    if (typeof nextVal === "function") continue;
    if (!Object.is(prev[key], nextVal)) return false;
  }

  return true;
}

const SectionExecution = memo(SectionExecutionInner, areSectionPropsEqual);
export default SectionExecution;
