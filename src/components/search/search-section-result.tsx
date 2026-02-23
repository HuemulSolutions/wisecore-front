import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { useState } from "react";
import { SectionContentDialog } from "./search-section-content-dialog";

interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

interface SectionResultProps {
  section: SearchResultSection;
  index: number;
}

export function SectionResult({ section, index }: SectionResultProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to get preview text (first 120 characters)
  const getPreviewText = (content: string) => {
    const plainText = content.replace(/[#*\[\]()]/g, '').replace(/\n+/g, ' ').trim();
    return plainText.length > 120 ? `${plainText.substring(0, 120)}...` : plainText;
  };

  return (
    <>
      <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
        <div className="p-2.5">
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <FileText className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-sm font-semibold text-foreground truncate">
                  {section.section_execution_name || `Section ${index + 1}`}
                </h5>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:cursor-pointer h-6 text-xs px-2"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                {getPreviewText(section.content)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SectionContentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        section={section}
        index={index}
      />
    </>
  );
}
