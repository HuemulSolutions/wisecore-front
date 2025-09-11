import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { File, Loader2, MoreVertical, Settings, Download, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
// import Chatbot from "@/components/chatbot/chatbot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/library";
import { getDocumentContent } from "@/services/documents";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/table-of-contents";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { useOrganization } from "@/contexts/organization-context";

// API response interface
interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

// Function to extract headings from markdown content for table of contents
function extractHeadings(markdown: string) {
  const headingRegex = /^(#{1,6})\s+(.*)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    headings.push({
      id,
      title,
      level,
    });
  }

  return headings;
}

export default function Library() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryItem | null>(null);
  const { selectedOrganizationId } = useOrganization();

  // Handle navigation state to restore selected document and breadcrumb
  useEffect(() => {
    if (location.state?.selectedDocumentId && location.state?.selectedDocumentName) {
      // Restore selected file
      setSelectedFile({
        id: location.state.selectedDocumentId,
        name: location.state.selectedDocumentName,
        type: location.state.selectedDocumentType || "document"
      });
      
      // Restore breadcrumb if requested
      if (location.state?.restoreBreadcrumb) {
        const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
        if (savedBreadcrumb) {
          try {
            const parsedBreadcrumb = JSON.parse(savedBreadcrumb);
            setBreadcrumb(parsedBreadcrumb);
          } catch (error) {
            console.error('Error parsing saved breadcrumb:', error);
          }
        }
      }
      
      // Clear the state after using it
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  // Get current folder ID (last item in breadcrumb or undefined for root)
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;

  // Fetch library content for current folder
  const { data: libraryData, isLoading, error } = useQuery({
    queryKey: ['library', currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId,
  });

  // Fetch document content when a document is selected
  const { data: documentContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['document-content', selectedFile?.id],
    queryFn: () => getDocumentContent(selectedFile!.id),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id,
  });

  const currentItems = libraryData?.content || [];

  // Extract headings for table of contents
  const tocItems = useMemo(() => {
    if (!documentContent?.content) return [];
    return extractHeadings(documentContent.content);
  }, [documentContent?.content]);

  // Handle manage action
  const handleManage = () => {
    if (selectedFile && selectedFile.type === 'document') {
      // Save current state before navigating
      sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
      sessionStorage.setItem('library-selected-file', JSON.stringify(selectedFile));
      navigate(`/document/${selectedFile.id}`);
    }
  };

  // Handle refresh library content
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['library', currentFolderId] });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-gray-50">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Error loading library content</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <LibrarySidebar
        breadcrumb={breadcrumb}
        setBreadcrumb={setBreadcrumb}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        currentItems={currentItems}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          {selectedFile ? (
            <div className="flex h-full">
              {/* Document Content */}
              <div className="flex-1 p-8 max-w-none overflow-auto">
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>{breadcrumb.map(item => item.name).join(' > ')}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-2">
                      
                      <h1 className="text-3xl font-bold text-gray-900">{selectedFile.name}</h1>
                      {documentContent?.document_type && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700 w-fit">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: documentContent.document_type.color }}
                          />
                          {documentContent.document_type.name}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="hover:cursor-pointer" onClick={handleManage}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:cursor-pointer">
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 hover:cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Separator className="bg-gray-200" />
                </div>
                
                {selectedFile.type === 'document' ? (
                  <>
                    {isLoadingContent ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Loading document content...</span>
                      </div>
                    ) : documentContent?.content ? (
                      <div className="prose prose-gray max-w-none">
                        <Markdown>{documentContent.content}</Markdown>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <File className="h-16 w-16 mx-auto mb-4 opacity-30 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">No content available</p>
                        <p className="text-sm text-gray-400 mt-1">This document doesn't have any content yet</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Item ID:</strong> {selectedFile.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Item Name:</strong> {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {selectedFile.type}
                    </p>
                  </div>
                )}
              </div>

              {/* Table of Contents - only show for documents with content */}
              {selectedFile.type === 'document' && documentContent?.content && tocItems.length > 0 && (
                <div className="w-64 border-l border-gray-200 bg-gray-50 p-4 overflow-auto">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Table of Contents</h3>
                  <TableOfContents items={tocItems} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
              <div className="text-center">
                <File className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-gray-500">Select a file to view its content</p>
                <p className="text-sm text-gray-400 mt-1">Choose a file from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* { documentContent && documentContent.content && (
        <Chatbot executionId={documentContent.execution_id} />
      )
        } */}
    </div>
  );
}