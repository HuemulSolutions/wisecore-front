import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewExecution = () => {
    navigate(`/execution/${execution_id}`);
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewExecution}
            className="hover:cursor-pointer flex items-center gap-2 shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            View Execution
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm">{isExpanded ? content : truncateContent(content)}</p>
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
    </Card>
  );
}