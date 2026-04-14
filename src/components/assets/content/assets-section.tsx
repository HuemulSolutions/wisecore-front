import { MoreVertical, Edit, Bot, Copy, Trash2, Play, FastForward, Loader2, GitCompare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SectionPlateEditor from '@/components/plate-editor/section-plate-editor';
import { Button } from "@/components/ui/button";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { useIsMobile } from "@/hooks/use-mobile";
import ExecutionConfigDialog, { type ExecutionConfig } from '@/components/execution/execution-config-dialog';
import { DeleteSectionDialog } from '@/components/assets/dialogs/assets-delete-section-dialog';
import { AiEditSectionDialog } from '@/components/assets/dialogs/assets-ai-edit-section-dialog';
import { SectionExecutionFeedback } from '@/components/execution/section-execution-feedback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { executeSingleSection, executeFromSection } from '@/services/generate';
import { deleteSectionExec, modifyContent, createAiSuggestion, acceptAiSuggestion, rejectAiSuggestion } from '@/services/section_execution';
import { AiSuggestionFeedback } from '@/components/execution/ai-suggestion-feedback';
import MarkdownDiffViewer from '@/components/MarkdownDiffViewer';
import { useOrganization } from '@/contexts/organization-context';
import { useOptionalEditingGuard } from '@/contexts/editing-guard-context';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useTranslation } from 'react-i18next';

interface SectionExecutionProps {
    sectionExecution: {
        id: string;
        output: string;
        section_id?: string;
        /** Plate JSON nodes (stringified) – used to restore comment marks on load */
        plate_content?: string[];
        ai_suggestion_status?: 'pending' | 'completed' | 'failed' | null;
        ai_suggestion_content?: string | null;
        ai_suggestion_instruction?: string | null;
    }
    onUpdate?: () => void;
    readyToEdit: boolean;
    sectionIndex?: number;
    documentId?: string;
    executionId?: string;
    onExecutionStart?: (executionId?: string) => void;
    executionStatus?: string;
    onOpenExecuteSheet?: () => void;
    executionMode?: 'single' | 'from' | 'full' | 'full-single';
    showExecutionFeedback?: boolean;
    sectionType?: 'ai' | 'manual' | 'reference' | null;
    sectionName?: string;
    canEditSections?: boolean;
    onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
}

export default function SectionExecution({ 
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
    canEditSections = false,
    onCreateSectionFromSelection,
}: SectionExecutionProps) {
    const { selectedOrganizationId } = useOrganization();
    const { setIsSectionEditing } = useOptionalEditingGuard();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditDialogOpen, setIsAiEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiSuggestionActive, setIsAiSuggestionActive] = useState(
        sectionExecution.ai_suggestion_status === 'pending'
    );
    const [isDiffOpen, setIsDiffOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Derived: whether there's a completed suggestion ready to review
    const hasPendingSuggestion =
        !!sectionExecution.ai_suggestion_content &&
        sectionExecution.ai_suggestion_status === 'completed' &&
        aiPreview === null &&
        !isAiSuggestionActive;
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionConfigOpen, setExecutionConfigOpen] = useState(false);
    const [localExecutionMode, setLocalExecutionMode] = useState<'single' | 'from'>('single');
    const isMobile = useIsMobile();
    const { t } = useTranslation('assets');
    const isExecutionApproved = executionStatus === 'approved';
    
    // Determine which actions are available based on section type
    const canExecute = sectionType === 'ai' || sectionType === null; // AI sections y null pueden ejecutarse
    const canEdit = sectionType !== 'reference'; // Manual y AI pueden editarse, reference no
    const canAiEdit = sectionType !== 'reference'; // Manual y AI pueden usar AI edit, reference no
    const canDelete = sectionType !== 'reference'; // Manual y AI pueden eliminarse, reference no
    
    // Check if there's an execution in progress
    const isExecutionInProgress = !!(executionStatus && !['completed', 'done', 'failed', 'cancelled', 'approved', 'approving'].includes(executionStatus));
    
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
        setIsSectionEditing(isEditing);
        return () => setIsSectionEditing(false);
    }, [isEditing, setIsSectionEditing]);

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
    const handleAutoSavePlateContent = async (sId: string, markdown: string, pContent: string[]) => {
        try {
            await modifyContent(sId, markdown, pContent);
        } catch {
            // Silent fail – auto-save is best-effort, not user-initiated
        }
    };

    const handleSave = async (sectionId: string, newContent: string, plateContent?: string[]) => {
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
        } catch (e) {
            console.error('Error saving content', e);
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
            const contentToCopy = displayedContent;
            await navigator.clipboard.writeText(contentToCopy);
            toast.success(t('section.contentCopied'));
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error(t('section.copyFailed'));
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

        try {
            setIsExecuting(true);
            setExecutionConfigOpen(false);
            onExecutionStart?.(executionId); // Pass executionId to show banner

            if (executionMode === 'single') {
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

            onUpdate?.();
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
    const sectionTypeLabel = normalizedSectionType.charAt(0).toUpperCase() + normalizedSectionType.slice(1);

    const handleSendAiEdit = async (prompt: string) => {
        try {
            await createAiSuggestion(sectionExecution.id, prompt, selectedOrganizationId ?? undefined);
            setIsAiSuggestionActive(true);
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.executionFailed') });
        }
        setIsAiEditDialogOpen(false);
    };

    const handleDelete = async () => {
        try {
            await deleteSectionExec(sectionExecution.id);
            toast.success(t('section.sectionDeleted'));
            onUpdate?.();
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.deleteFailed') });
            throw error;
        }
    };

    const displayedContent = (aiPreview !== null && !isDiffOpen)
        ? aiPreview
        : sectionExecution.output.replace(/\\n/g, "\n");

    const handleViewSuggestion = () => {
        setAiPreview(sectionExecution.ai_suggestion_content ?? null);
        setIsDiffOpen(true);
    };

    const handleAiSuggestionCompleted = (_content: string) => {
        setIsAiSuggestionActive(false);
        // Invalidate so props refresh with ai_suggestion_status: 'completed'
        // hasPendingSuggestion will become true and the button will update
        queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
    };

    const handleAiSuggestionFailed = () => {
        setIsAiSuggestionActive(false);
    };

    // Debug logging for execution tracking
    console.log('🔍 SectionExecution render:', {
        executionId,
        sectionId: sectionExecution.section_id,
        executionMode,
        showExecutionFeedback,
        willRenderFeedback: !!(showExecutionFeedback && executionId && sectionExecution.section_id)
    });

    return (
        <div ref={containerRef} className="p-2 relative">
            {/* Action Buttons - Always sticky */}
            {readyToEdit && (
                <div className="sticky top-0 z-50 justify-end py-1 px-2 bg-white backdrop-blur-sm -mx-2 -mt-2 mb-2 max-w-full w-full flex items-center">
                    {(sectionName || sectionType) && (
                        <div className="mr-auto flex items-center rounded-md border border-blue-100 bg-blue-50/55 px-2.5 py-1 backdrop-blur-[1px]">
                            <span className="max-w-[240px] truncate text-xs font-medium text-blue-700/80">
                                {sectionName || t('section.untitled')}
                            </span>
                            <span className="mx-1.5 text-[10px] text-blue-300">•</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600/70">
                                {sectionTypeLabel}
                            </span>
                        </div>
                    )}
                    
                    {!isEditing && (
                    <>
                        {/* Desktop: Direct Action Buttons */}
                        {!isMobile && (
                            <div className="flex items-center gap-1">
                                {onOpenExecuteSheet && !isExecutionApproved && canExecute && canEditSections && !!sectionExecution.section_id && (
                                    <HuemulButton
                                        variant="ghost"
                                        size="sm"
                                        icon={Play}
                                        iconClassName="h-3.5 w-3.5 text-blue-600"
                                        className="h-7 w-7 hover:bg-blue-50"
                                        tooltip={isExecutionInProgress ? t('section.executionInProgress') : t('section.openExecuteSheet')}
                                        onClick={onOpenExecuteSheet}
                                        disabled={isExecutionInProgress}
                                    />
                                )}

                                {!isEditing && !isExecutionApproved && canAiEdit && canEditSections && (
                                    <div className="relative">
                                        <HuemulButton
                                            variant="ghost"
                                            size="sm"
                                            icon={hasPendingSuggestion ? GitCompare : Bot}
                                            iconClassName={`h-3.5 w-3.5 ${hasPendingSuggestion ? 'text-amber-600' : 'text-blue-600'}`}
                                            className={`h-7 w-7 ${hasPendingSuggestion ? 'hover:bg-amber-50' : 'hover:bg-blue-50'}`}
                                            tooltip={hasPendingSuggestion ? t('section.viewAiSuggestion') : t('section.askAiToEdit')}
                                            onClick={() => hasPendingSuggestion ? handleViewSuggestion() : setIsAiEditDialogOpen(true)}
                                        />
                                        {hasPendingSuggestion && (
                                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                                        )}
                                    </div>
                                )}

                                {!isEditing && !isExecutionApproved && canEdit && canEditSections && (
                                    <HuemulButton
                                        variant="ghost"
                                        size="sm"
                                        icon={Edit}
                                        iconClassName="h-3.5 w-3.5 text-gray-600"
                                        className="h-7 w-7 hover:bg-gray-100"
                                        tooltip={t('section.editSection')}
                                        onClick={handleStartEditing}
                                    />
                                )}

                                <HuemulButton
                                    variant="ghost"
                                    size="sm"
                                    icon={Copy}
                                    iconClassName="h-3.5 w-3.5 text-gray-600"
                                    className="h-7 w-7 hover:bg-gray-100"
                                    tooltip={t('section.copyContent')}
                                    onClick={handleCopy}
                                />

                                {!isEditing && !isExecutionApproved && canDelete && canEditSections && (
                                    <HuemulButton
                                        variant="ghost"
                                        size="sm"
                                        icon={Trash2}
                                        iconClassName="h-3.5 w-3.5 text-red-600"
                                        className="h-7 w-7 hover:bg-red-50"
                                        tooltip={t('section.deleteSection')}
                                        onClick={() => openDeleteDialog()}
                                    />
                                )}
                            </div>
                        )}

                        {/* Mobile: Dropdown Menu */}
                        {isMobile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 rounded-md hover:bg-gray-100 hover:cursor-pointer">
                                        <MoreVertical className="h-4 w-4 text-gray-600" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/* <DocumentAccessControl
                                        requiredAccess=""
                                        checkGlobalPermissions={false}
                                        resource="asset"
                                    > */}
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={handleCopy}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            {t('section.copy')}
                                        </DropdownMenuItem>
                                    {/* </DocumentAccessControl> */}
                                    {documentId && executionId && sectionIdForExecution && !isExecutionApproved && canExecute && canEditSections && (
                                        <>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onSelect={() => {
                                                    setTimeout(() => handleOpenExecutionConfig('single'), 0);
                                                }}
                                                disabled={isExecuting}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {t('section.executeSection')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onSelect={() => {
                                                    setTimeout(() => handleOpenExecutionConfig('from'), 0);
                                                }}
                                                disabled={isExecuting}
                                            >
                                                <FastForward className="h-4 w-4 mr-2" />
                                                {t('section.executeFromSection')}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {!isEditing && !isExecutionApproved && canEdit && canEditSections && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={handleStartEditing}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {t('section.edit')}
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isExecutionApproved && canAiEdit && canEditSections && (
                                        hasPendingSuggestion ? (
                                            <DropdownMenuItem
                                                className="hover:cursor-pointer"
                                                onSelect={() => {
                                                    setTimeout(() => handleViewSuggestion(), 0);
                                                }}
                                            >
                                                <GitCompare className="h-4 w-4 mr-2 text-amber-600" />
                                                {t('section.viewAiSuggestionMenu')}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem 
                                                className="hover:cursor-pointer"
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
                                            {t('section.delete')}
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
                    </>
                    )}
                    
                    {/* Copy button - always visible */}
                    {/* <ProtectedComponent resource="section_execution" resourceAction="r">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer ml-2"
                                    onClick={handleCopy}
                                >
                                    <Copy className="h-3.5 w-3.5 text-gray-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy content</p>
                            </TooltipContent>
                        </Tooltip>
                    </ProtectedComponent> */}
                </div>
            )}
            
            {isAiSuggestionActive && (
                <div className="mb-3 sticky top-9 z-40 shadow-lg">
                    <AiSuggestionFeedback
                        sectionExecutionId={sectionExecution.id}
                        onCompleted={handleAiSuggestionCompleted}
                        onFailed={handleAiSuggestionFailed}
                        onDismiss={() => setIsAiSuggestionActive(false)}
                    />
                </div>
            )}
            {aiPreview !== null && !isAiSuggestionActive && !isDiffOpen && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between sticky top-9 z-40 shadow-lg">
                    <span className="text-sm text-amber-800">{t('section.aiPreviewReady')}</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleSave(sectionExecution.id, aiPreview || '')}
                            disabled={isSaving}
                            className="hover:cursor-pointer"
                        >
                            {t('section.save')}
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
            
            {/* Section Execution Feedback Banner - for single/from modes */}
            {showExecutionFeedback && executionId && sectionExecution.section_id && sectionIndex !== undefined && 
             (executionMode === 'single' || executionMode === 'from') && (
                <div className="mb-3">
                    <SectionExecutionFeedback
                        executionId={executionId}
                        sectionId={sectionExecution.section_id}
                        sectionIndex={sectionIndex}
                        executionMode={executionMode}
                        onComplete={() => {
                            console.log('🎯 Section execution feedback completed');
                            onUpdate?.();
                        }}
                    />
                </div>
            )}
            
            {/* Content area */}
            {showExecutionFeedback && executionId && (executionMode === 'single' || executionMode === 'from') && 
                 executionStatus && !['completed', 'done', 'failed', 'cancelled', 'approved', 'approving'].includes(executionStatus) ? (
                /* Show skeleton ONLY when section is actively being executed (not when completed) */
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
            ) : (
                /* Unified Plate view: readOnly when not editing, editable when editing */
                <div className={isEditing ? 'pt-2 pr-0' : `${readyToEdit ? 'pt-4' : 'pt-1'} pr-2 w-full`}>
                    <SectionPlateEditor
                        sectionId={sectionExecution.id}
                        content={displayedContent}
                        plateContent={sectionExecution.plate_content}
                        isEditing={isEditing}
                        onSave={handleSave}
                        onAutoSavePlateContent={handleAutoSavePlateContent}
                        onCancel={handleCancelEdit}
                        isSaving={isSaving}
                        documentId={documentId}
                        sectionExecutionId={sectionExecution.id}
                        toolbarTopOffset="36px"
                        onCreateSectionFromSelection={readyToEdit && canEditSections ? onCreateSectionFromSelection : undefined}
                    />
                </div>
            )}
        
        {/* Delete Confirmation Dialog */}
        <DeleteSectionDialog
            open={isDeleteDialogOpen}
            onOpenChange={handleDeleteDialogChange}
            onAction={handleDelete}
        />

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

        {/* AI Suggestion Diff Dialog */}
        <HuemulDialog
            open={isDiffOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setAiPreview(null);
                    setIsDiffOpen(false);
                    // Refresh so hasPendingSuggestion reflects server state
                    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
                }
            }}
            title={t('section.diffDialogTitle')}
            description={
                sectionExecution.ai_suggestion_instruction
                    ? `${t('section.diffInstruction')} "${sectionExecution.ai_suggestion_instruction}"`
                    : undefined
            }
            icon={GitCompare}
            iconClassName="text-amber-600"
            maxWidth="w-[95vw]"
            maxHeight="max-h-[90vh]"
            className="!max-w-[95vw]"
            cancelLabel={t('section.diffDismiss')}
            extraActions={[{
                label: t('section.diffReject'),
                variant: 'destructive',
                closeOnSuccess: false,
                onClick: async () => {
                    await rejectAiSuggestion(sectionExecution.id, selectedOrganizationId ?? undefined);
                    setAiPreview(null);
                    setIsDiffOpen(false);
                },
            }]}
            saveAction={{
                label: t('section.diffAccept'),
                onClick: async () => {
                    await acceptAiSuggestion(sectionExecution.id, selectedOrganizationId ?? undefined);
                    setAiPreview(null);
                    setIsDiffOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
                    onUpdate?.();
                },
                closeOnSuccess: false,
            }}
        >
            <MarkdownDiffViewer
                oldContent={sectionExecution.output.replace(/\\n/g, "\n")}
                newContent={aiPreview ?? sectionExecution.ai_suggestion_content ?? ''}
                oldLabel={t('section.diffCurrentLabel')}
                newLabel={t('section.diffSuggestionLabel')}
                defaultMode='rendered'
                showModeToggle={false}
                showRenderedDiffPanel={false}
            />
        </HuemulDialog>
        </div>
    );

}
