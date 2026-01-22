import { MoreVertical, Edit, Bot, Copy, Trash2, Play, FastForward, Loader2 } from 'lucide-react';
import Markdown from "@/components/ui/markdown";
import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/layout/editor';
import { Button } from "@/components/ui/button";
import { DocumentActionButton, DocumentAccessControl } from "@/components/assets/content/assets-access-control";
import { useIsMobile } from "@/hooks/use-mobile";
import ExecutionConfigDialog, { type ExecutionConfig } from '@/components/execution/execution-config-dialog';
import { DeleteSectionDialog } from '@/components/assets/dialogs/assets-delete-section-dialog';
import { AiEditSectionDialog } from '@/components/assets/dialogs/assets-ai-edit-section-dialog';
import { SectionExecutionFeedback } from '@/components/execution/section-execution-feedback';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fixSection, executeSingleSection, executeFromSection } from '@/services/generate';
import { deleteSectionExec, modifyContent } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

interface SectionExecutionProps {
    sectionExecution: {
        id: string;
        output: string;
        section_id?: string;
    }
    onUpdate?: () => void;
    readyToEdit: boolean;
    sectionIndex?: number;
    documentId?: string;
    executionId?: string;
    onExecutionStart?: (executionId?: string) => void;
    executionStatus?: string;
    accessLevels?: string[];
    onOpenExecuteSheet?: () => void;
    executionMode?: 'single' | 'from' | 'full' | 'full-single';
    showExecutionFeedback?: boolean;
    sectionType?: 'ai' | 'manual' | 'reference';
    sectionName?: string;
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
    accessLevels,
    onOpenExecuteSheet,
    executionMode = 'single',
    showExecutionFeedback = false,
    sectionType = 'ai',
    // sectionName
}: SectionExecutionProps) {
    const { selectedOrganizationId } = useOrganization();
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditDialogOpen, setIsAiEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionConfigOpen, setExecutionConfigOpen] = useState(false);
    const [localExecutionMode, setLocalExecutionMode] = useState<'single' | 'from'>('single');
    const isMobile = useIsMobile();
    const isExecutionApproved = executionStatus === 'approved';
    
    // Determine which actions are available based on section type
    const canExecute = sectionType === 'ai'; // Solo AI sections pueden ejecutarse
    const canEdit = sectionType !== 'reference'; // Manual y AI pueden editarse, reference no
    const canAiEdit = sectionType !== 'reference'; // Manual y AI pueden usar AI edit, reference no
    const canDelete = sectionType !== 'reference'; // Manual y AI pueden eliminarse, reference no
    
    // Solucion temporal: usar el ID de la sección como fallback si section_id no existe
    const sectionIdForExecution = sectionExecution.section_id || sectionExecution.id;
    
    // Refs and state for maintaining scroll position - Updated for ScrollArea
    const containerRef = useRef<HTMLDivElement>(null);
    const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);

    // Helper function to find the ScrollArea viewport
    const getScrollAreaViewport = () => {
        // Find the closest ScrollArea viewport (it should have the scroll functionality)
        const viewport = containerRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLDivElement;
        return viewport;
    };

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

    const handleSave = async (sectionId: string, newContent: string) => {
        try {
            setIsSaving(true);
            await modifyContent(sectionId, newContent);
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
            toast.success('Content copied to clipboard!');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy content to clipboard');
        }
    };

    const handleOpenExecutionConfig = (mode: 'single' | 'from') => {
        setLocalExecutionMode(mode);
        setExecutionConfigOpen(true);
    };

    const handleExecuteWithConfig = async (config: ExecutionConfig) => {
        if (!documentId || !executionId || !sectionIdForExecution) {
            toast.error('Missing required information for section execution');
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
                toast.success('Section execution started successfully');
            } else {
                await executeFromSection(
                    documentId,
                    executionId,
                    sectionIdForExecution,
                    selectedOrganizationId!,
                    config.llmModel,
                    config.instructions
                );
                toast.success('Execution from this section started successfully');
            }

            onUpdate?.();
        } catch (error) {
            console.error('Error executing section:', error);
            toast.error('Failed to execute section. Please try again.');
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

    const handleSendAiEdit = (prompt: string) => {
        setIsAiProcessing(true);
        setAiPreview('');
        fixSection({
            instructions: prompt,
            content: sectionExecution.output.replace(/\\n/g, "\n"),
            organizationId: selectedOrganizationId!,
            onData: (chunk: string) => {
                const normalized = chunk.replace(/\\n/g, "\n");
                setAiPreview(prev => (prev ?? '') + normalized);
            },
            onError: (e: Event) => {
                console.error('AI edit error', e);
                setIsAiProcessing(false);
            },
            onClose: () => {
                setIsAiProcessing(false);
            }
        });
        setIsAiEditDialogOpen(false);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteSectionExec(sectionExecution.id);
            toast.success('Section deleted successfully!');
            closeDeleteDialog();
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting section:', error);
            toast.error('Failed to delete section. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const displayedContent = (aiPreview ?? sectionExecution.output.replace(/\\n/g, "\n"));

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
                <div className="sticky top-0 z-20 justify-end py-1 px-2 bg-white backdrop-blur-sm -mx-2 -mt-2 mb-2 max-w-full w-full flex items-center">
                    {/* Section Info */}
                    {/* {(sectionName || sectionType) && (
                        <div className="flex items-center gap-1.5">
                            {sectionName && (
                                <span className="text-xs font-medium text-gray-500">{sectionName}</span>
                            )}
                            {sectionType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    sectionType === 'ai' 
                                        ? 'bg-blue-50 text-blue-600'
                                        : sectionType === 'manual'
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-purple-50 text-purple-600'
                                }`}>
                                    {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}
                                </span>
                            )}
                        </div>
                    )} */}
                    
                    {!isEditing && (
                    <>
                        {/* Desktop: Direct Action Buttons */}
                        {!isMobile && (
                            <div className="flex items-center gap-1">
                                {onOpenExecuteSheet && accessLevels?.includes('approve') && !isExecutionApproved && canExecute && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DocumentActionButton
                                                accessLevels={accessLevels}
                                                requiredAccess="approve"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:cursor-pointer"
                                                onClick={onOpenExecuteSheet}
                                            >
                                                <Play className="h-3.5 w-3.5 text-blue-600" />
                                            </DocumentActionButton>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Open Execute Sheet</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && canAiEdit && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DocumentActionButton
                                                accessLevels={accessLevels}
                                                requiredAccess="edit"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:cursor-pointer"
                                                onClick={() => setIsAiEditDialogOpen(true)}
                                            >
                                                <Bot className="h-3.5 w-3.5 text-blue-600" />
                                            </DocumentActionButton>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ask AI to edit</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && canEdit && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DocumentActionButton
                                                accessLevels={accessLevels}
                                                requiredAccess="edit"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer"
                                                onClick={handleStartEditing}
                                            >
                                                <Edit className="h-3.5 w-3.5 text-gray-600" />
                                            </DocumentActionButton>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Edit section</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DocumentActionButton
                                            accessLevels={accessLevels}
                                            requiredAccess="read"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer"
                                            onClick={handleCopy}
                                        >
                                            <Copy className="h-3.5 w-3.5 text-gray-600" />
                                        </DocumentActionButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy content</p>
                                    </TooltipContent>
                                </Tooltip>

                                {!isEditing && accessLevels?.includes('delete') && !isExecutionApproved && canDelete && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DocumentActionButton
                                                accessLevels={accessLevels}
                                                requiredAccess="delete"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-red-50 hover:cursor-pointer"
                                                onClick={() => openDeleteDialog()}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                            </DocumentActionButton>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete section</p>
                                        </TooltipContent>
                                    </Tooltip>
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
                                    <DocumentAccessControl
                                        accessLevels={accessLevels}
                                        requiredAccess="read"
                                    >
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={handleCopy}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </DropdownMenuItem>
                                    </DocumentAccessControl>
                                    {documentId && executionId && sectionIdForExecution && accessLevels?.includes('approve') && !isExecutionApproved && canExecute && (
                                        <>
                                            <DocumentAccessControl
                                                accessLevels={accessLevels}
                                                requiredAccess="approve"
                                            >
                                                <DropdownMenuItem
                                                    className='hover:cursor-pointer'
                                                    onSelect={() => {
                                                        setTimeout(() => handleOpenExecutionConfig('single'), 0);
                                                    }}
                                                    disabled={isExecuting}
                                                >
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Execute Section
                                                </DropdownMenuItem>
                                            </DocumentAccessControl>
                                            <DocumentAccessControl
                                                accessLevels={accessLevels}
                                                requiredAccess="approve"
                                            >
                                                <DropdownMenuItem
                                                    className='hover:cursor-pointer'
                                                    onSelect={() => {
                                                        setTimeout(() => handleOpenExecutionConfig('from'), 0);
                                                    }}
                                                    disabled={isExecuting}
                                                >
                                                    <FastForward className="h-4 w-4 mr-2" />
                                                    Execute From Section
                                                </DropdownMenuItem>
                                            </DocumentAccessControl>
                                        </>
                                    )}
                                    {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && canEdit && (
                                        <DocumentAccessControl
                                            accessLevels={accessLevels}
                                            requiredAccess="edit"
                                        >
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onClick={handleStartEditing}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                        </DocumentAccessControl>
                                    )}
                                    {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && canAiEdit && (
                                        <DocumentAccessControl
                                            accessLevels={accessLevels}
                                            requiredAccess="edit"
                                        >
                                            <DropdownMenuItem 
                                                className="hover:cursor-pointer"
                                                onSelect={() => {
                                                    setTimeout(() => setIsAiEditDialogOpen(true), 0);
                                                }}
                                            >
                                                <Bot className="h-4 w-4 mr-2" />
                                                Ask AI to Edit
                                            </DropdownMenuItem>
                                        </DocumentAccessControl>
                                    )}
                                    {!isEditing && accessLevels?.includes('delete') && !isExecutionApproved && canDelete && (
                                        <DocumentAccessControl
                                            accessLevels={accessLevels}
                                            requiredAccess="delete"
                                        >
                                            <DropdownMenuItem 
                                                className="text-red-600 hover:cursor-pointer"
                                                onSelect={() => {
                                                    // Sincroniza apertura al ciclo de cierre del dropdown
                                                    setTimeout(() => openDeleteDialog(), 0);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DocumentAccessControl>
                                    )}
                                    {onOpenExecuteSheet && accessLevels?.includes('approve') && !isExecutionApproved && canExecute && (
                                        <DocumentAccessControl
                                            accessLevels={accessLevels}
                                            requiredAccess="approve"
                                        >
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onSelect={() => {
                                                    setTimeout(() => onOpenExecuteSheet(), 0);
                                                }}
                                            >
                                                <Play className="h-4 w-4 mr-2 text-blue-600" />
                                                Open Execute Sheet
                                            </DropdownMenuItem>
                                        </DocumentAccessControl>
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
            
            {aiPreview !== null && !isAiProcessing && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between relative z-30 shadow-lg">
                    <span className="text-sm text-amber-800">Vista previa de edición por IA lista. ¿Guardar cambios?</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleSave(sectionExecution.id, aiPreview || '')}
                            disabled={isSaving}
                            className="hover:cursor-pointer"
                        >
                            Guardar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAiPreview(null)}
                            disabled={isSaving}
                            className="hover:cursor-pointer"
                        >
                            Deshacer
                        </Button>
                    </div>
                </div>
            )}
            {aiPreview !== null && isAiProcessing && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 relative z-30 shadow-lg">
                    Generando propuesta con IA...
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
            
            {/* Content area - conditional padding based on editing state */}
            {isEditing ? (
                /* Editor takes full width when editing */
                <div className="pt-8 pr-0">
                    <Editor
                        sectionId={sectionExecution.id}
                        content={sectionExecution.output.replace(/\\n/g, "\n")}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        isSaving={isSaving}
                    />
                </div>
            ) : showExecutionFeedback && executionId && (executionMode === 'single' || executionMode === 'from') && 
                 executionStatus && !['completed', 'done', 'failed', 'cancelled', 'approved', 'approving'].includes(executionStatus) ? (
                /* Show skeleton ONLY when section is actively being executed (not when completed) */
                <div className="pt-8 pr-12">
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
                            <span className="ml-2 text-xs text-gray-500">Generating section content...</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Content with padding for floating buttons when not editing */
                <div className="pt-8 pr-12">
                    <div className="relative">
                        <Markdown sectionIndex={sectionIndex}>{displayedContent}</Markdown>
                    </div>
                </div>
            )}
        
        {/* Delete Confirmation Dialog */}
        <DeleteSectionDialog
            open={isDeleteDialogOpen}
            onOpenChange={handleDeleteDialogChange}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
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
            isProcessing={isAiProcessing}
        />
        </div>
    );

}
