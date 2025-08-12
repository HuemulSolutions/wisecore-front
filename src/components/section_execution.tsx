import { ChevronDown, ChevronRight, MoreVertical, Edit, Bot, Lock } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import Markdown from "@/components/ui/markdown";
import { useState } from 'react';
import Editor from './editor';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modifyContent } from '@/services/executions';
interface SectionExecutionProps {
    sectionExecution: {
        id: string;
        section_execution_id?: string;
        name: string;
        prompt: string;
        output: string;
    }
    // isGenerating?: boolean;

}

export default function SectionExecution({ sectionExecution }: SectionExecutionProps) {
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [output, setOutput] = useState(sectionExecution.output);

    console.log('SectionExecution Props:', { sectionExecution });

    const handleSave = async (sectionId: string, newContent: string) => {
        try {
            setIsSaving(true);
            const updated = await modifyContent(sectionId, newContent);
            setOutput(updated?.content ?? newContent);
            setIsEditing(false);
        } catch (e) {
            console.error('Error saving content', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{sectionExecution.name.toUpperCase()}</h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-gray-100 hover:cursor-pointer">
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!isEditing && (
                            <DropdownMenuItem
                                className='hover:cursor-pointer'
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="hover:cursor-pointer">
                            <Bot className="h-4 w-4 mr-2" />
                            Ask AI to Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:cursor-pointer">
                            <Lock className="h-4 w-4 mr-2" />
                            Lock
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    <Markdown>{sectionExecution.output.replace(/\\n/g, "\n")}</Markdown>
                )
            }
            <Separator className="my-4" />
        </div>
    );

}