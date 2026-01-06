import { MoreVertical, Edit, Bot, Send, Copy, Trash2, Play, FastForward } from 'lucide-react';
import Markdown from "@/components/ui/markdown";
import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/editor';
import { Button } from "@/components/ui/button";
import { DocumentActionButton, DocumentAccessControl } from "@/components/document-access-control";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import ExecutionConfigDialog, { type ExecutionConfig } from '@/components/execution-config-dialog';
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
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
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
    onOpenExecuteSheet
}: SectionExecutionProps) {
    const { selectedOrganizationId } = useOrganization();
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditDialogOpen, setIsAiEditDialogOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionConfigOpen, setExecutionConfigOpen] = useState(false);
    const [executionMode, setExecutionMode] = useState<'single' | 'from'>('single');
    const isMobile = useIsMobile();
    const isExecutionApproved = executionStatus === 'approved';
    
    // Solucion temporal: usar el ID de la sección como fallback si section_id no existe
    const sectionIdForExecution = sectionExecution.section_id || sectionExecution.id;
    
    // Refs and state for maintaining scroll position
    const containerRef = useRef<HTMLDivElement>(null);
    const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);

    // Removed debug logging for performance optimization

    // Handle entering edit mode with scroll position preservation
    const handleStartEditing = () => {
        // Save current scroll position relative to the container
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const relativePosition = scrollTop - containerRect.top + window.innerHeight / 2; // Center of viewport relative to container
            setSavedScrollPosition(Math.max(0, relativePosition));
        }
        setIsEditing(true);
    };

    // Handle exiting edit mode
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Restore scroll position after a brief delay to allow DOM to update
        setTimeout(() => {
            if (containerRef.current && savedScrollPosition > 0) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const targetScrollTop = containerRect.top + window.pageYOffset + savedScrollPosition - window.innerHeight / 2;
                window.scrollTo({
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
            
            // Restore scroll position after save
            setTimeout(() => {
                if (containerRef.current && savedScrollPosition > 0) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const targetScrollTop = containerRect.top + window.pageYOffset + savedScrollPosition - window.innerHeight / 2;
                    window.scrollTo({
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

    // Effect to restore scroll position when entering edit mode
    useEffect(() => {
        if (isEditing && savedScrollPosition > 0 && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const targetScrollTop = containerRect.top + window.pageYOffset + savedScrollPosition - window.innerHeight / 2;
                    window.scrollTo({
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
        setExecutionMode(mode);
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
        if (!open) {
            setAiPrompt('');
        }
    };

    const handleSendAiEdit = () => {
        setIsAiProcessing(true);
        setAiPreview('');
        fixSection({
            instructions: aiPrompt,
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
        setAiPrompt('');
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

    return (
        <div ref={containerRef} className="p-2 relative">
            {/* Action Buttons - Always sticky */}
            {readyToEdit && (
                <div className="sticky top-0 z-20 flex justify-end p-2 bg-white -mx-2 -mt-2 mb-4">
                    {!isEditing && (
                    <>
                        {/* Desktop: Direct Action Buttons */}
                        {!isMobile && (
                            <div className="flex items-center gap-1">
                                {onOpenExecuteSheet && accessLevels?.includes('approve') && !isExecutionApproved && (
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

                                {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && (
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

                                {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && (
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

                                {!isEditing && accessLevels?.includes('delete') && !isExecutionApproved && (
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
                                    {documentId && executionId && sectionIdForExecution && accessLevels?.includes('approve') && !isExecutionApproved && (
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
                                    {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && (
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
                                    {!isEditing && accessLevels?.includes('edit') && !isExecutionApproved && (
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
                                    {!isEditing && accessLevels?.includes('delete') && !isExecutionApproved && (
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
                                    {onOpenExecuteSheet && accessLevels?.includes('approve') && !isExecutionApproved && (
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
            
            {/* Content area - conditional padding based on editing state */}
            {isEditing ? (
                /* Editor takes full width when editing */
                <div className="pt-8">
                    <Editor
                        sectionId={sectionExecution.id}
                        content={sectionExecution.output.replace(/\\n/g, "\n")}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        isSaving={isSaving}
                    />
                </div>
            ) : (
                /* Content with padding for floating buttons when not editing */
                <div className="pt-8 pr-12">
                    <div className="relative">
                        <Markdown sectionIndex={sectionIndex}>{displayedContent}</Markdown>
                    </div>
                </div>
            )}
        
        {/* Delete Confirmation AlertDialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Section</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this section? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel 
                        className="hover:cursor-pointer" 
                        disabled={isDeleting}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Execution Configuration Dialog */}
        <ExecutionConfigDialog
            open={executionConfigOpen}
            onOpenChange={setExecutionConfigOpen}
            mode={executionMode}
            onExecute={handleExecuteWithConfig}
            isExecuting={isExecuting}
        />

        {/* AI Edit Dialog */}
        <Dialog open={isAiEditDialogOpen} onOpenChange={handleAiEditDialogChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-600" />
                        Ask AI to Edit
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="Describe how you want to modify this content..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="min-h-[120px]"
                        rows={5}
                    />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button 
                            variant="outline" 
                            className="hover:cursor-pointer"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button 
                        onClick={handleSendAiEdit}
                        disabled={!aiPrompt.trim() || isAiProcessing}
                        className="hover:cursor-pointer"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </div>
    );

}
