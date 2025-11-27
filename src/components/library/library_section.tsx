import { MoreVertical, Edit, Bot, Send, Copy, Trash2, Play, FastForward } from 'lucide-react';
import Markdown from "@/components/ui/markdown";
import { useState } from 'react';
import Editor from '../editor';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { fixSection, generateSingleSection, generateFromSection } from '@/services/generate';
import { deleteSectionExec, modifyContent } from '@/services/section_execution';
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
}

export default function SectionExecution({ 
    sectionExecution, 
    onUpdate, 
    readyToEdit, 
    sectionIndex, 
    documentId, 
    executionId, 
    onExecutionStart 
}: SectionExecutionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const isMobile = useIsMobile();

    console.log('SectionExecution Props:', { 
        sectionExecution, 
        documentId, 
        executionId,
        section_id: sectionExecution.section_id 
    });

    const handleSave = async (sectionId: string, newContent: string) => {
        try {
            setIsSaving(true);
            await modifyContent(sectionId, newContent);
            setIsEditing(false);
            setAiPreview(null);
            onUpdate?.();
        } catch (e) {
            console.error('Error saving content', e);
        } finally {
            setIsSaving(false);
        }
    };

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

    const handleExecuteSection = async () => {
        if (!documentId || !executionId || !sectionExecution.section_id) {
            toast.error('Missing required information for section execution');
            return;
        }

        try {
            setIsExecuting(true);
            onExecutionStart?.(executionId); // Pass executionId to show banner
            await generateSingleSection(documentId, executionId, sectionExecution.section_id);
            toast.success('Section execution started successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Error executing section:', error);
            toast.error('Failed to execute section. Please try again.');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleExecuteFromSection = async () => {
        if (!documentId || !executionId || !sectionExecution.section_id) {
            toast.error('Missing required information for section execution');
            return;
        }

        try {
            setIsExecuting(true);
            onExecutionStart?.(executionId); // Pass executionId to show banner
            await generateFromSection(documentId, executionId, sectionExecution.section_id);
            toast.success('Execution from this section started successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Error executing from section:', error);
            toast.error('Failed to execute from section. Please try again.');
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
        <div className="p-2 relative">
            {/* Action Buttons - Positioned absolutely in top right */}
            <div className="absolute top-2 right-2 z-10">
                {readyToEdit && !isEditing && (
                    <>
                        {/* Desktop: Direct Action Buttons */}
                        {!isMobile && (
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer"
                                            onClick={handleCopy}
                                        >
                                            <Copy className="h-3.5 w-3.5 text-gray-600" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy content</p>
                                    </TooltipContent>
                                </Tooltip>

                                {documentId && executionId && sectionExecution.section_id && (
                                    <>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 hover:bg-green-50 hover:cursor-pointer"
                                                    onClick={handleExecuteSection}
                                                    disabled={isExecuting}
                                                >
                                                    <Play className="h-3.5 w-3.5 text-green-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Execute this section</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 hover:bg-purple-50 hover:cursor-pointer"
                                                    onClick={handleExecuteFromSection}
                                                    disabled={isExecuting}
                                                >
                                                    <FastForward className="h-3.5 w-3.5 text-purple-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Execute from this section</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </>
                                )}

                                {!isEditing && !isAiEditing && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit className="h-3.5 w-3.5 text-gray-600" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Edit section</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {!isEditing && !isAiEditing && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:cursor-pointer"
                                                onClick={() => setIsAiEditing(true)}
                                            >
                                                <Bot className="h-3.5 w-3.5 text-blue-600" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ask AI to edit</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {!isEditing && !isAiEditing && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-red-50 hover:cursor-pointer"
                                                onClick={() => openDeleteDialog()}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                            </Button>
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
                                    <DropdownMenuItem
                                        className='hover:cursor-pointer'
                                        onClick={handleCopy}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </DropdownMenuItem>
                                    {documentId && executionId && sectionExecution.section_id && (
                                        <>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onClick={handleExecuteSection}
                                                disabled={isExecuting}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Execute Section
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className='hover:cursor-pointer'
                                                onClick={handleExecuteFromSection}
                                                disabled={isExecuting}
                                            >
                                                <FastForward className="h-4 w-4 mr-2" />
                                                Execute From Section
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {!isEditing && !isAiEditing && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isAiEditing && (
                                        <DropdownMenuItem 
                                            className="hover:cursor-pointer"
                                            onClick={() => setIsAiEditing(true)}
                                        >
                                            <Bot className="h-4 w-4 mr-2" />
                                            Ask AI to Edit
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isAiEditing && (
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
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </>
                )}
            </div>
            
            {isAiEditing && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Ask AI to Edit</span>
                    </div>
                    <Textarea
                        placeholder="Describe how you want to modify this content..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="mb-3"
                        rows={3}
                    />
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            onClick={() => {
                                setIsAiProcessing(true);
                                setAiPreview('');
                                fixSection({
                                    instructions: aiPrompt,
                                    content: sectionExecution.output.replace(/\\n/g, "\n"),
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
                                setIsAiEditing(false);
                                setAiPrompt('');
                            }}
                            disabled={!aiPrompt.trim() || isAiProcessing}
                            className="hover:cursor-pointer"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                                setIsAiEditing(false);
                                setAiPrompt('');
                            }}
                            className="hover:cursor-pointer"
                        >
                            Cancel
                        </Button>
                    </div>
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
                        onCancel={() => setIsEditing(false)}
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
        </div>
    );

}
