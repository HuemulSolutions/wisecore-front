import { ChevronDown, ChevronRight, MoreVertical, Edit, Bot, Lock, Send, Trash2, FileText, Zap, Copy } from 'lucide-react';
import Markdown from "@/components/ui/markdown";
import { useState } from 'react';
import Editor from './editor';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fixSection } from '@/services/generate';
import { deleteSectionExec, modifyContent } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

interface SectionExecutionSheetProps {
    sectionExecution: {
        id: string;
        section_execution_id?: string;
        name?: string;
        prompt: string;
        output: string;
        type?: string;
    }
    onUpdate?: () => void;
    readyToEdit: boolean;
}



// Function to get preview content
const getPreviewContent = (content: string, maxLength: number = 150): string => {
    const cleanContent = content
        .replace(/```[\s\S]*?```/g, '[Code Block]')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
    
    return cleanContent.length > maxLength 
        ? cleanContent.substring(0, maxLength) + '...'
        : cleanContent;
};

export default function SectionExecutionSheet({ sectionExecution, onUpdate, readyToEdit }: SectionExecutionSheetProps) {
    const { selectedOrganizationId } = useOrganization();
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    console.log('SectionExecution Props:', { sectionExecution });

    const handleSave = async (sectionId: string, newContent: string) => {
        try {
            setIsSaving(true);
            await modifyContent(sectionId, newContent);
            setIsEditing(false);
            setAiPreview(null);
            onUpdate?.();
            toast.success("Section updated successfully");
        } catch (e) {
            console.error('Error saving content', e);
            toast.error("Error saving content. Please try again.");
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

    function openDeleteDialog() {
        setShowDeleteDialog(true);
    }

    function closeDeleteDialog() {
        setShowDeleteDialog(false);
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
            const sectionId = sectionExecution.section_execution_id || sectionExecution.id;
            await deleteSectionExec(sectionId);
            toast.success("Section deleted successfully");
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting section:', error);
            toast.error("Error deleting section. Please try again.");
        } finally {
            setIsDeleting(false);
            closeDeleteDialog();
        }
    };

    const displayedContent = (aiPreview ?? sectionExecution.output.replace(/\\n/g, "\n"));
    const previewContent = getPreviewContent(displayedContent);

    return (
        <>
            <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this section? This action cannot be undone.
                            {sectionExecution.name && (
                                <span className="block mt-2 font-medium">
                                    Section: {sectionExecution.name}
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            disabled={isDeleting}
                            className="hover:cursor-pointer"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="border rounded-lg bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            {sectionExecution.name && (
                                <h3 className="text-sm font-medium text-gray-900">
                                    {sectionExecution.name}
                                </h3>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsPromptOpen(!isPromptOpen)}
                            className="h-7 px-2 text-xs hover:cursor-pointer"
                        >
                            {isPromptOpen ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                            ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                            )}
                            Prompt
                        </Button>
                        
                        {readyToEdit && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0 hover:cursor-pointer"
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className='hover:cursor-pointer'
                                        onClick={handleCopy}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Content
                                    </DropdownMenuItem>
                                    {!isEditing && !isAiEditing && (
                                        <DropdownMenuItem
                                            className='hover:cursor-pointer'
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Content
                                        </DropdownMenuItem>
                                    )}
                                    {!isEditing && !isAiEditing && (
                                        <DropdownMenuItem 
                                            className="hover:cursor-pointer"
                                            onClick={() => setIsAiEditing(true)}
                                        >
                                            <Bot className="h-4 w-4 mr-2" />
                                            AI Edit
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="hover:cursor-pointer">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Lock Section
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="hover:cursor-pointer text-red-600 hover:text-red-700"
                                        onSelect={() => {
                                            setTimeout(() => openDeleteDialog(), 0);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
                
                {/* Prompt Section */}
                {isPromptOpen && (
                    <div className="p-4 bg-blue-50 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Section Prompt</span>
                        </div>
                        <div className="p-3 bg-white rounded-md border border-blue-200">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                {sectionExecution.prompt}
                            </pre>
                        </div>
                    </div>
                )}
                
                {/* Content Preview (when not editing) */}
                {!isEditing && !isAiEditing && (
                    <div className="p-4">
                        <div className="text-xs text-gray-600 mb-2">Content Preview:</div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {previewContent}
                        </p>
                    </div>
                )}
                
                {/* AI Editing Section */}
                {isAiEditing && (
                    <div className="p-4 bg-blue-50 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">AI Content Editor</span>
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
                                        organizationId: selectedOrganizationId!,
                                        onData: (chunk: string) => {
                                            const normalized = chunk.replace(/\\n/g, "\n");
                                            setAiPreview(prev => (prev ?? '') + normalized);
                                        },
                                        onError: (e: Event) => {
                                            console.error('AI edit error', e);
                                            setIsAiProcessing(false);
                                            toast.error("AI editing failed. Please try again.");
                                        },
                                        onClose: () => {
                                            setIsAiProcessing(false);
                                        }
                                    });
                                    setIsAiEditing(false);
                                    setAiPrompt('');
                                }}
                                disabled={!aiPrompt.trim() || isAiProcessing}
                                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Generate
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

                {/* AI Preview Section */}
                {aiPreview !== null && !isAiProcessing && (
                    <div className="p-4 bg-amber-50 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-amber-800">AI Preview Ready</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleSave(sectionExecution.section_execution_id || sectionExecution.id, aiPreview)}
                                    disabled={isSaving}
                                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAiPreview(null)}
                                    disabled={isSaving}
                                    className="hover:cursor-pointer"
                                >
                                    Discard
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                
                {aiPreview !== null && isAiProcessing && (
                    <div className="p-4 bg-blue-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-600 animate-pulse" />
                            <span className="text-sm text-blue-800">Generating AI content...</span>
                        </div>
                    </div>
                )}
                
                {/* Content Section */}
                <div className="p-4">
                    {isEditing ? (
                        <div className="border rounded-md">
                            <Editor
                                sectionId={sectionExecution.section_execution_id || sectionExecution.id}
                                content={sectionExecution.output.replace(/\\n/g, "\n")}
                                onSave={handleSave}
                                onCancel={() => setIsEditing(false)}
                                isSaving={isSaving}
                            />
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none">
                            <Markdown>{displayedContent}</Markdown>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}