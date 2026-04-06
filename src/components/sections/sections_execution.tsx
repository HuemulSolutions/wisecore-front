import { ChevronDown, ChevronRight, MoreVertical, Edit, Bot, Lock, Send, Trash2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import Markdown from "@/components/ui/markdown";
import { useState } from 'react';
import Editor from '../layout/editor';
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteSectionExecutionDialog } from "@/components/assets/dialogs/assets-delete-section-execution-dialog";
import { fixSection } from '@/services/generate';
import { deleteSectionExec, modifyContent } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('assets');
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            const sectionId = sectionExecution.section_execution_id || sectionExecution.id;
            await deleteSectionExec(sectionId);
            toast.success(t('section.sectionDeleted'));
            onUpdate?.();
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('section.deleteFailed') });
            throw error;
        }
    };

    const displayedContent = (aiPreview ?? sectionExecution.output.replace(/\\n/g, "\n"));

    return (
        <>
            <DeleteSectionExecutionDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                sectionExecution={sectionExecution}
                onAction={handleDelete}
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
                                {t('section.edit')}
                            </DropdownMenuItem>
                        )}
                        {!isEditing && !isAiEditing && (
                            <DropdownMenuItem 
                                className="hover:cursor-pointer"
                                onClick={() => setIsAiEditing(true)}
                            >
                                <Bot className="h-4 w-4 mr-2" />
                                {t('section.askAiToEditMenu')}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="hover:cursor-pointer">
                            <Lock className="h-4 w-4 mr-2" />
                            {t('section.lock')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="hover:cursor-pointer text-red-600 hover:text-red-700"
                            onSelect={() => {
                                // Defer apertura hasta que el dropdown cierre por completo
                                setTimeout(() => setShowDeleteDialog(true), 0);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('section.delete')}
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
                    {t('section.prompt')}
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
                        <span className="text-sm font-medium text-blue-800">{t('section.askAiToEdit')}</span>
                    </div>
                    <Textarea
                        placeholder={t('aiEditSection.promptPlaceholder')}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="mb-3"
                        rows={3}
                    />
                    <div className="flex gap-2">
                        <HuemulButton 
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
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {t('aiEditSection.send')}
                        </HuemulButton>
                        <HuemulButton 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                                setIsAiEditing(false);
                                setAiPrompt('');
                            }}
                            label={t('section.cancel')}
                        />
                    </div>
                </div>
            )}

            {aiPreview !== null && !isAiProcessing && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between sticky top-0 z-40 shadow-lg">
                    <span className="text-sm text-amber-800">{t('section.aiPreviewReady')}</span>
                    <div className="flex gap-2">
                        <HuemulButton
                            size="sm"
                            onClick={() => handleSave(sectionExecution.section_execution_id || sectionExecution.id, aiPreview)}
                            disabled={isSaving}
                            label={t('section.save')}
                        />
                        <HuemulButton
                            size="sm"
                            variant="outline"
                            onClick={() => setAiPreview(null)}
                            disabled={isSaving}
                            label={t('section.undo')}
                        />
                    </div>
                </div>
            )}
            {aiPreview !== null && isAiProcessing && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 sticky top-0 z-40 shadow-lg">
                    {t('section.generatingAiProposal')}
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
