import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { File, Loader2, MoreVertical, Settings, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chatbot from "../chatbot/chatbot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocumentContent, deleteDocument } from "@/services/documents";
import { exportExecutionToMarkdown, exportExecutionToWord } from "@/services/executions";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/table-of-contents";
import { toast } from "sonner";

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

interface LibraryContentProps {
  selectedFile: LibraryItem | null;
  breadcrumb: BreadcrumbItem[];
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  refetchDocumentContent: () => void;
  setSelectedFile: (file: LibraryItem | null) => void;
  onRefresh: () => void;
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

export function LibraryContent({ 
  selectedFile, 
  breadcrumb, 
  selectedExecutionId, 
  setSelectedExecutionId, 
  refetchDocumentContent,
  setSelectedFile,
  onRefresh
}: LibraryContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch document content when a document is selected
  const { data: documentContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['document-content', selectedFile?.id, selectedExecutionId],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id,
  });

  // Initialize selected execution ID when a document is selected
  useEffect(() => {
    if (selectedFile?.type === 'document' && documentContent?.executions?.length > 0) {
      // Si no hay ejecución seleccionada, usar la ejecución actual del documento
      if (!selectedExecutionId) {
        setSelectedExecutionId(documentContent.execution_id);
      }
    }
  }, [selectedFile, documentContent, selectedExecutionId, setSelectedExecutionId]);

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

  // Handle export to markdown
  const handleExportMarkdown = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToMarkdown(documentContent.execution_id);
      } catch (error) {
        console.error('Error exporting to markdown:', error);
      }
    }
  };

  // Handle export to word
  const handleExportWord = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToWord(documentContent.execution_id);
      } catch (error) {
        console.error('Error exporting to word:', error);
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (selectedFile) {
      try {
        await deleteDocument(selectedFile.id);
        console.log('Document deleted successfully:', selectedFile.id);
        toast.success(`Document "${selectedFile.name}" deleted successfully`);
        
        // Clear selected file
        setSelectedFile(null);
        
        // Refresh library content to update sidebar
        onRefresh();
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['library'] });
        queryClient.invalidateQueries({ queryKey: ['document-content'] });
        
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again.');
      }
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">Select a file to view its content</p>
          <p className="text-sm text-gray-400 mt-1">Choose a file from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  return (
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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={handleExportMarkdown}>
                      Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={handleExportWord}>
                      Word
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem 
                  className="text-red-600 hover:cursor-pointer" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Execution selector - only show for documents */}
          {selectedFile.type === 'document' && documentContent?.executions?.length > 0 && (
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Execution:</span>
                <Select 
                  value={selectedExecutionId || ""} 
                  onValueChange={(value) => {
                    setSelectedExecutionId(value);
                    // Refetch document content with new execution
                    refetchDocumentContent();
                  }}
                >
                  <SelectTrigger className="w-[250px] h-9 hover:cursor-pointer">
                    <SelectValue placeholder="Select execution" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentContent.executions.map((execution: { id: string; created_at: string }) => (
                      <SelectItem 
                        key={execution.id} 
                        value={execution.id}
                        className="hover:cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-500">
                              {new Date(execution.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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

      { documentContent && documentContent.content && (
        <Chatbot executionId={documentContent.execution_id} />
      ) }

      {/* Delete Confirmation AlertDialog (reemplaza Dialog) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:cursor-pointer" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
