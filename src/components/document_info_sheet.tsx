import { FileText, Hash, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentInfoSheetProps {
    document: {
        id: string;
        name: string;
        sections?: Array<any>;
    };
    onConfigureDocument?: () => void;
}

export default function DocumentInfoSheet({ document, onConfigureDocument }: DocumentInfoSheetProps) {
    const sectionCount = document.sections?.length || 0;
    
    return (
        <div className="border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#4464f7]" />
                    <h3 className="text-sm font-medium text-gray-900">Document Information</h3>
                </div>
                
                {onConfigureDocument && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onConfigureDocument}
                        className="h-7 px-2 text-xs hover:cursor-pointer"
                    >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="space-y-4">
                    {/* Document Name */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Document Name</span>
                        <span className="text-sm font-medium text-gray-900">{document.name}</span>
                    </div>
                    
                    {/* Section Count */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sections</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${sectionCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                <Hash className="h-3 w-3 mr-1" />
                                {sectionCount}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Execute this document to generate content based on its sections and context. 
                        {sectionCount === 0 ? ' Add sections first to enable execution.' : ` Ready to execute ${sectionCount} section${sectionCount !== 1 ? 's' : ''}.`}
                    </p>
                </div>
            </div>
        </div>
    );
}