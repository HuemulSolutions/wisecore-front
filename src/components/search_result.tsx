import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ExecutionInfoSheet } from "@/components/sheets";

interface SearchResultProps {
  content: string;
  execution_id: string;
  document_id: string;
  document_name: string;
  section_execution_name: string;
}

export default function SearchResult({
  content,
  execution_id,
  document_name,
  section_execution_name,
}: SearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecutionSheetOpen, setIsExecutionSheetOpen] = useState(false);



  const truncateContent = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isContentTruncated = content.length > 300;

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="truncate">{document_name}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Section: {section_execution_name}
            </CardDescription>
          </div>
          {/* <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewExecution}
              className="hover:cursor-pointer flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToExecution}
              className="hover:cursor-pointer flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </Button>
          </div> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none text-sm">
            <ReactMarkdown
              components={{
                // Customize markdown rendering for search results
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mb-1">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-medium text-gray-900 mb-1">{children}</h4>,
                h5: ({ children }) => <h5 className="text-xs font-medium text-gray-900 mb-1">{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-medium text-gray-800 mb-1">{children}</h6>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm ml-4">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">{children}</blockquote>,
                code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto my-2">{children}</pre>,
                hr: () => <hr className="border-t border-gray-300 my-4" />,
                a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 my-2">{children}</table>,
                th: ({ children }) => <th className="border border-gray-300 px-2 py-1 bg-gray-50 font-medium text-xs">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 px-2 py-1 text-xs">{children}</td>,
              }}
            >
              {isExpanded ? content : truncateContent(content)}
            </ReactMarkdown>
          </div>
          {isContentTruncated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show More
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Execution Info Sheet */}
      <ExecutionInfoSheet
        isOpen={isExecutionSheetOpen}
        onOpenChange={setIsExecutionSheetOpen}
        executionId={execution_id}
        documentName={document_name}
        sectionName={section_execution_name}
      />
    </Card>
  );
}