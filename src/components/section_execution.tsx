import { ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useState } from 'react';
interface SectionExecutionProps {
    sectionExecution: {
        id: string;
        name: string;
        prompt: string;
    }

}

export default function SectionExecution({ sectionExecution }: SectionExecutionProps) {
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold">{sectionExecution.name.toUpperCase()}</h3>
            
            <div className="mt-3">
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
            <Separator className="my-4" />
        </div>
    );

}