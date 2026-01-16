import { ChevronDown, ChevronRight, MoreVertical, Edit, Bot, Lock, Send, Trash2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import Markdown from "@/components/ui/markdown";
import { useState } from 'react';
import Editor from '../layout/editor';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";
import { fixSection } from '@/services/generate';
import { deleteSectionExec, modifyContent } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

interface SectionExecutionProps {
    sectionExecution: {
        id: string;
        section_execution_id?: string;
        name?: string;
        prompt: string;
        output: string;
    }
    onUpdate?: () => void;
    readyToEdit: boolean;
}

export default function SectionExecution({ sectionExecution, onUpdate, readyToEdit }: SectionExecutionProps) {
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
        } catch (e) {
            console.error('Error saving content', e);
        } finally {
            setIsSaving(false);
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
            setShowDeleteDialog(false);
        }
    };

    const displayedContent = (aiPreview ?? sectionExecution.output.replace(/\\n/g, "\n"));

    return (
        <>
            <ReusableAlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Section"
                description={
                    <>
                        Are you sure you want to delete this section? This action cannot be undone.
                        {sectionExecution.name && (
                            <span className="block mt-2 font-medium">
                                Section: {sectionExecution.name}
                            </span>
                        )}
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                isProcessing={isDeleting}
                variant="destructive"
            />

            <div className="p-4">
                <div className="flex items-center justify-between">
                    {sectionExecution.name && <h3 className="text-lg font-semibold">{sectionExecution.name.toUpperCase()}</h3>}
                    {readyToEdit && (
                        <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-gray-100 hover:cursor-pointer">
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                        <DropdownMenuItem className="hover:cursor-pointer">
                            <Lock className="h-4 w-4 mr-2" />
                            Lock
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="hover:cursor-pointer text-red-600 hover:text-red-700"
                            onSelect={() => {
                                // Defer apertura hasta que el dropdown cierre por completo
                                setTimeout(() => setShowDeleteDialog(true), 0);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                )}
                
            </div>
            
            <div className="mt-3 pb-3">
                <button
                    onClick={() => setIsPromptOpen(!isPromptOpen)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:cursor-pointer"
                >
                    {isPromptOpen ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Prompt
                </button>
                
                {isPromptOpen && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {sectionExecution.prompt}
                        </pre>
                    </div>
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
                            onClick={() => handleSave(sectionExecution.section_execution_id || sectionExecution.id, aiPreview)}
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
            
            {
                isEditing ? (
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
                    <Markdown>{displayedContent}</Markdown>
                )
            }
            <Separator className="my-4" />
            </div>
        </>
    );

}
