import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionResult } from "./search-section-result";
import { useState } from "react";

interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

interface SearchResultData {
  document_id: string;
  execution_id: string;
  document_name: string;
  sections: SearchResultSection[];
}

interface DocumentResultProps {
  document: SearchResultData;
}

export function DocumentResult({ document }: DocumentResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOpenDocument = () => {
    // Navigate to the document using the path structure that Assets expects
    // Assets component should handle finding the document regardless of its folder location
    window.open(`/asset/${document.document_id}`, '_blank');
  };

  return (
    <Card className="border border-border bg-card">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground mb-1">{document.document_name}</h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge className="bg-blue-100/80 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">Documentación</Badge>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-muted-foreground text-[10px]">
                    {document.sections?.length || 0} segmento{(document.sections?.length || 0) !== 1 ? 's' : ''} encontrado{(document.sections?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDocument}
                className="hover:cursor-pointer h-8 text-xs px-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Asset
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:cursor-pointer h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="border-t border-border">
            {document.sections && document.sections.length > 0 && (
              <div className="p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Secciones encontradas:
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {document.sections.map((section, index) => (
                    <SectionResult 
                      key={section.section_execution_id}
                      section={section}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
