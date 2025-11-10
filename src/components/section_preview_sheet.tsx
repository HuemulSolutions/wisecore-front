import { FileText, ChevronRight, Layers, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SectionPreviewSheetProps {
    sections: Array<{
        id: string;
        name: string;
        prompt?: string;
        order?: number;
        dependencies?: string[];
    }>;
    onSectionSheetOpen?: () => void;
}

// Function to get preview content
const getPreviewContent = (prompt: string, maxLength: number = 80): string => {
    if (!prompt) return 'No prompt defined';
    
    const cleanContent = prompt
        .replace(/\n+/g, ' ')
        .trim();
    
    return cleanContent.length > maxLength 
        ? cleanContent.substring(0, maxLength) + '...'
        : cleanContent;
};

export default function SectionPreviewSheet({ sections, onSectionSheetOpen }: SectionPreviewSheetProps) {

    if (!sections || sections.length === 0) {
        return (
            <div className="border rounded-lg bg-white shadow-sm">
                <div className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-gray-900">No Sections Found</h3>
                            <p className="text-xs text-gray-500 max-w-sm">
                                This document doesn't have any sections yet. Add sections to structure your content before creating an execution.
                            </p>
                        </div>
                        {onSectionSheetOpen && (
                            <Button
                                size="sm"
                                onClick={onSectionSheetOpen}
                                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Sections
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div className="border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#4464f7]" />
                    <h3 className="text-sm font-medium text-gray-900">Document Sections</h3>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {sections.length} sections
                    </Badge>
                </div>
                
                {onSectionSheetOpen && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onSectionSheetOpen}
                        className="h-7 px-2 text-xs hover:cursor-pointer"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Manage
                    </Button>
                )}
            </div>

            {/* Sections List */}
            <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedSections.map((section, index) => {
                        const previewContent = getPreviewContent(section.prompt || '');
                        
                        return (
                            <div key={section.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                {/* Section Number */}
                                <div className="flex-shrink-0 w-6 h-6 bg-[#4464f7] text-white rounded-full text-xs flex items-center justify-center font-medium">
                                    {index + 1}
                                </div>
                                
                                {/* Section Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {section.name}
                                        </h4>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {previewContent}
                                    </p>
                                    
                                    {section.dependencies && section.dependencies.length > 0 && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <ChevronRight className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                {section.dependencies.length} dependencies
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}