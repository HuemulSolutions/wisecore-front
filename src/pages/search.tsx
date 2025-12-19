import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import SearchResult from "@/components/search_result";
import { Loader2, Search, FileText, X, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Markdown from "@/components/ui/markdown";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";

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

// Component for individual section results
function SectionResult({ section, index }: { section: SearchResultSection; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to get preview text (first 120 characters)
  const getPreviewText = (content: string) => {
    const plainText = content.replace(/[#*\[\]()]/g, '').replace(/\n+/g, ' ').trim();
    return plainText.length > 120 ? `${plainText.substring(0, 120)}...` : plainText;
  };

  return (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
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
                <h5 className="text-sm font-medium text-foreground truncate">
                  {section.section_execution_name || `Sección ${index + 1}`}
                </h5>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:cursor-pointer h-5 w-5 p-0 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              {!isExpanded && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {getPreviewText(section.content)}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="border-t border-gray-100">
            <div className="px-2.5 pb-2.5 pt-2">
              <div className="ml-7 prose prose-sm max-w-none text-muted-foreground">
                <Markdown>{section.content}</Markdown>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Component for individual document results
function DocumentResult({ document }: { document: SearchResultData }) {
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {document.document_name}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    Documentación
                  </span>
                  <span>
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
                className="hover:cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir documento
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
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
                <h4 className="text-sm font-medium text-foreground mb-3">
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

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "normal");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { selectedOrganizationId } = useOrganization();
  
  // Get initial search query from URL
  const initialSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const { data: searchResults, isLoading, error, refetch } = useQuery<SearchResultData[]>({
    queryKey: ['search', searchQuery, selectedOrganizationId],
    queryFn: () => search(searchQuery, selectedOrganizationId!),
    enabled: !!searchQuery && searchQuery.trim().length > 0,
  });

  // Update URL params when mode changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (mode) {
      newParams.set("mode", mode);
    } else {
      newParams.delete("mode");
    }
    setSearchParams(newParams, { replace: true });
  }, [mode, searchParams, setSearchParams]);

  const handleSearch = () => {
    if (query.trim()) {
      const trimmedQuery = query.trim();
      
      // Si es la misma query que ya estamos buscando, forzar refetch
      if (trimmedQuery === searchQuery && searchQuery) {
        refetch();
      } else {
        setSearchQuery(trimmedQuery);
      }
      
      // Update URL with search parameters
      const newParams = new URLSearchParams();
      newParams.set("q", trimmedQuery);
      newParams.set("mode", mode);
      setSearchParams(newParams);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Search</h1>
              <p className="text-sm text-muted-foreground">Search through your organization's documents and content</p>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Enter your search query..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full md:w-32 hover:cursor-pointer">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch} 
              className="hover:cursor-pointer px-6" 
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={handleClearSearch} 
                className="hover:cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading && (
              <Card className="border border-border bg-card p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary" />
                  <span className="text-muted-foreground">Searching through your documents...</span>
                </div>
              </Card>
            )}

            {error && (
              <Card className="border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Search Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">Error performing search. Please try again.</p>
              </Card>
            )}

            {searchResults && searchResults.length === 0 && !isLoading && (
              <Card className="border border-border bg-card p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search query or using different keywords.</p>
              </Card>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Supporting Documents</h2>
                  <div className="space-y-3">
                    {searchResults.map((document) => (
                      <DocumentResult 
                        key={document.document_id} 
                        document={document}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
