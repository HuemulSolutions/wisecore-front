import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Play, Hash } from "lucide-react";
import { useState } from "react";
import Markdown from "@/components/ui/markdown";
import { ExecutionInfoSheet } from "@/components/sheets";

interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

interface SearchResultDocument {
  document_id: string;
  execution_id: string;
  document_name: string;
  sections: SearchResultSection[];
}

interface SearchResultProps {
  documents: SearchResultDocument[];
}

export default function SearchResult({
  documents = [],
}: SearchResultProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [selectedExecution, setSelectedExecution] = useState<{executionId: string, documentName: string, sectionName: string} | null>(null);

  // Early return if no documents
  if (!documents || documents.length === 0) {
    return null;
  }



  const truncateContent = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDocumentExpansion = (documentId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedDocuments(newExpanded);
  };


  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const isDocumentExpanded = expandedDocuments.has(document.document_id);
        const sectionsToShow = isDocumentExpanded ? document.sections : document.sections?.slice(0, 1) || [];
         
        return (
        <div key={document.document_id} className="space-y-3">
          {/* Document Header - Smaller */}
          <div className="flex gap-3">
            {/* Document Thumbnail/Icon - Smaller */}
            <div className="w-24 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>

            {/* Document Info - More Compact */}
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-medium text-foreground line-clamp-1">
                {document.document_name}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  ID: {document.execution_id.slice(0, 8)}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {document.sections?.length || 0} segments found
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                {/* <Button 
                  size="sm"
                  className="hover:cursor-pointer flex items-center gap-1 text-xs h-7"
                  onClick={() => openExecutionSheet(
                    document.execution_id, 
                    document.document_name, 
                    "Complete document"
                  )}
                >
                  <Play className="w-3 h-3" />
                  View Document
                </Button> */}
                {/* <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:cursor-pointer text-xs h-7"
                  onClick={() => {
                    if (document.sections && document.sections.length > 0) {
                      openExecutionSheet(
                        document.execution_id,
                        document.document_name,
                        document.sections[0].section_execution_name
                      );
                    }
                  }}
                >
                  First Result
                </Button> */}
              </div>
            </div>
          </div>

          {/* Segments Found Section - Compact */}
          <Card className="border-l-2 border-l-blue-500">
            <CardHeader className="pb-2 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-medium">Segments Found ({document.sections?.length || 0})</CardTitle>
                </div>
                <div className="flex gap-1">
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    className="hover:cursor-pointer text-blue-600 text-xs h-6 px-2"
                    onClick={() => {
                      if (document.sections && document.sections.length > 0) {
                        openExecutionSheet(
                          document.execution_id,
                          document.document_name,
                          document.sections[0].section_execution_name
                        );
                      }
                    }}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play First
                  </Button> */}
                  {document.sections && document.sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:cursor-pointer text-xs h-6 px-2"
                      onClick={() => toggleDocumentExpansion(document.document_id)}
                    >
                      {isDocumentExpanded ? (
                        <><ChevronUp className="w-3 h-3 mr-1" />Show Less</>
                      ) : (
                        <><ChevronDown className="w-3 h-3 mr-1" />Show All ({document.sections.length})</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 py-3">
              {sectionsToShow?.map((section, sectionIndex) => {
                const displayedContent = (section.content.replace(/\\n/g, "\n"));
                const isExpanded = expandedSections.has(section.section_execution_id);
                const isContentTruncated = section.content.length > 200;
                const actualSectionIndex = isDocumentExpanded ? sectionIndex + 1 : 1;
                
                return (
                  <div key={section.section_execution_id} className={`bg-gray-50/50 rounded-lg p-4 border border-gray-100 ${sectionIndex > 0 ? 'mt-4' : ''}`}>
                    {/* Section Header - More Prominent */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold min-w-[2rem] text-center">
                            #{actualSectionIndex}
                          </span>
                          <h4 className="font-semibold text-foreground text-sm">
                            {section.section_execution_name}
                          </h4>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                      </div>
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openExecutionSheet(
                          document.execution_id,
                          document.document_name,
                          section.section_execution_name
                        )}
                        className="hover:cursor-pointer flex items-center gap-1 shrink-0 h-7 px-3 text-xs border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Play className="w-3 h-3" />
                        View
                      </Button> */}
                    </div>
                    
                    {/* Section Content */}
                    <div className="prose prose-sm max-w-none text-sm text-muted-foreground bg-white rounded p-3 border border-gray-100">
                      <Markdown sectionIndex={actualSectionIndex}>{isExpanded ? displayedContent : truncateContent(displayedContent, 200)}</Markdown>
                    </div>
                    
                    {(isContentTruncated || isExpanded) && (
                      <div className="mt-3 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSectionExpansion(section.section_execution_id)}
                          className="hover:cursor-pointer text-blue-600 hover:text-blue-800 text-xs h-6 px-3 hover:bg-blue-50"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Show More
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
        );
      })}

      {/* Execution Info Sheet */}
      {selectedExecution && (
        <ExecutionInfoSheet
          isOpen={!!selectedExecution}
          onOpenChange={(open) => !open && setSelectedExecution(null)}
          executionId={selectedExecution.executionId}
          documentName={selectedExecution.documentName}
          sectionName={selectedExecution.sectionName}
        />
      )}
    </div>
  );
}