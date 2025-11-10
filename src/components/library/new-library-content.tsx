import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { File, Loader2, Download, Trash2, FileText, FileCode, Plus, Play, List, Edit3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import Chatbot from "../chatbot/chatbot";
import { ExecuteSheet, SectionSheet, DependenciesSheet, ContextSheet } from "../sheets";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { getDocumentContent, deleteDocument, getDocumentById } from "@/services/documents";
import { exportExecutionToMarkdown, exportExecutionToWord } from "@/services/executions";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/table-of-contents";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/edit_document_dialog";
import CreateDocumentLib from "@/components/library/create_document_lib";
import SectionExecution from "./library_section";

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

// Interface for content sections
interface ContentSection {
  id: string;
  content: string;
}

interface LibraryContentProps {
  selectedFile: LibraryItem | null;
  breadcrumb: BreadcrumbItem[];
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  refetchDocumentContent: () => void;
  setSelectedFile: (file: LibraryItem | null) => void;
  onRefresh: () => void;
  currentFolderId?: string;
}

// Function to extract headings from multiple content sections for table of contents
function extractHeadingsFromSections(sections: ContentSection[]) {
  const headings: Array<{
    id: string;
    title: string;
    level: number;
    sectionId: string;
    sectionIndex: number;
  }> = [];
  
  sections.forEach((section, sectionIndex) => {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;

    while ((match = headingRegex.exec(section.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      // Generate the same ID as the Markdown component
      const id = `section-${sectionIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      
      headings.push({
        id,
        title,
        level,
        sectionId: section.id,
        sectionIndex,
      });
    }
  });

  return headings;
}

// Legacy function for backward compatibility
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

export function AssetContent({ 
  selectedFile, 
  breadcrumb, 
  selectedExecutionId, 
  setSelectedExecutionId, 
  refetchDocumentContent,
  setSelectedFile,
  onRefresh,
  currentFolderId
}: LibraryContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTocSidebarOpen, setIsTocSidebarOpen] = useState(true);
  const [isExecuteSheetOpen, setIsExecuteSheetOpen] = useState(false);
  const [isSectionSheetOpen, setIsSectionSheetOpen] = useState(false);
  const [isDependenciesSheetOpen, setIsDependenciesSheetOpen] = useState(false);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);

  // Handle document creation
  const handleDocumentCreated = (createdDocument: { id: string; name: string; type: "document" }) => {
    onRefresh();
    setSelectedFile(createdDocument);
  };

  // Handle template creation
  const handleCreateTemplate = () => {
    navigate('/templates');
  };

  // Handle add section
  const handleAddSection = () => {
    if (selectedFile && selectedFile.type === 'document') {
      setIsSectionSheetOpen(true);
    }
  };

  // Handle create new execution
  const handleCreateExecution = () => {
    if (selectedFile && selectedFile.type === 'document') {
      setIsExecuteSheetOpen(true);
    }
  };

  // Fetch document content when a document is selected
  const { data: documentContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['document-content', selectedFile?.id, selectedExecutionId],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id,
  });

  // Fetch full document details for sections management
  const { data: fullDocument } = useQuery({
    queryKey: ['document', selectedFile?.id],
    queryFn: () => getDocumentById(selectedFile!.id),
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
    
    // Check if content is in new format (array of sections)
    if (Array.isArray(documentContent.content)) {
      return extractHeadingsFromSections(documentContent.content);
    }
    
    // Fallback for old format (single string)
    if (typeof documentContent.content === 'string') {
      return extractHeadings(documentContent.content);
    }
    
    return [];
  }, [documentContent?.content]);

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

  function openDeleteDialog() {
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setIsDeleteDialogOpen(false);
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (open) {
      openDeleteDialog();
    } else {
      closeDeleteDialog();
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
        
        closeDeleteDialog();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again.');
      }
    }
  };

  // Open edit dialog and prefill values
  const openEditDialog = () => {
    if (!selectedFile || selectedFile.type !== 'document') return;
    // Apertura diferida para que primero se cierre el dropdown y no dispare outside click sobre el dialog recién montado
    setTimeout(() => setIsEditDialogOpen(true), 0);
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 bg-white">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 opacity-40" style={{ color: '#4464f7' }} />
          <p className="text-lg font-medium text-gray-500">Select a file to view its content</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Choose a file from the sidebar to get started</p>
          
          <div className="flex gap-3 justify-center">
            <CreateDocumentLib
              trigger={
                <Button 
                  variant="outline" 
                  className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Asset
                </Button>
              }
              folderId={currentFolderId}
              onDocumentCreated={handleDocumentCreated}
            />
            
            <Button 
              variant="outline" 
              onClick={handleCreateTemplate}
              className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Document Content */}
      <div className="flex-1 flex flex-col max-w-none overflow-auto">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm py-4 px-7 sticky top-0 z-10">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{breadcrumb.map(item => item.name).join(' > ')}</span>
            </div>
            
            {/* Title and Type Section */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">{selectedFile.name}</h1>
              {documentContent?.document_type && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: documentContent.document_type.color }}
                  />
                  {documentContent.document_type.name}
                </div>
              )}
            </div>
            
            {/* Action Buttons Section */}
            <div className="flex items-center gap-3">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                <ExecuteSheet
                  selectedFile={selectedFile}
                  fullDocument={fullDocument}
                  isOpen={isExecuteSheetOpen}
                  onOpenChange={setIsExecuteSheetOpen}
                  onSectionSheetOpen={() => setIsSectionSheetOpen(true)}
                />
                
                <SectionSheet
                  selectedFile={selectedFile}
                  fullDocument={fullDocument}
                  isOpen={isSectionSheetOpen}
                  onOpenChange={setIsSectionSheetOpen}
                />
                
                <DependenciesSheet
                  selectedFile={selectedFile}
                  isOpen={isDependenciesSheetOpen}
                  onOpenChange={setIsDependenciesSheetOpen}
                />
                
                <ContextSheet
                  selectedFile={selectedFile}
                  isOpen={isContextSheetOpen}
                  onOpenChange={setIsContextSheetOpen}
                />
              </div>
              
              {/* Secondary Actions Group */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                {/* Execution Dropdown - only show for documents with executions */}
                {selectedFile.type === 'document' && documentContent?.executions?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors"
                        title="Switch Execution"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {documentContent.executions
                        .sort((a: { created_at: string }, b: { created_at: string }) => 
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )
                        .map((execution: { id: string; created_at: string }, index: number) => {
                          const date = new Date(execution.created_at);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const timeStr = date.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          });
                          const dateStr = isToday ? 'Today' : date.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                          const isSelected = selectedExecutionId === execution.id;
                          
                          return (
                            <DropdownMenuItem 
                              key={execution.id} 
                              className="hover:cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setSelectedExecutionId(execution.id);
                                refetchDocumentContent();
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {index === 0 && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                <span className={`text-sm ${isSelected ? 'font-semibold text-[#4464f7]' : 'font-medium'}`}>
                                  {dateStr} {timeStr}
                                </span>
                              </div>
                              {index === 0 && <span className="text-xs text-green-600">Latest</span>}
                              {isSelected && <span className="text-xs text-[#4464f7]">Active</span>}
                            </DropdownMenuItem>
                          );
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <Button
                  onClick={openEditDialog}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                  title="Edit Document"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                      title="Export Options"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={handleExportMarkdown}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={handleExportWord}>
                      <FileCode className="mr-2 h-4 w-4" />
                      Export as Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  onClick={() => setTimeout(() => openDeleteDialog(), 0)}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 bg-white">
          <div className="py-8 px-6">
            {selectedFile.type === 'document' ? (
              <>
                {isLoadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading document content...</span>
                  </div>
                ) : documentContent?.content ? (
                  <div className="prose prose-gray max-w-none">
                    {Array.isArray(documentContent.content) ? (
                      // New format: array of sections
                      <>
                        {documentContent.content.map((section: ContentSection, index: number) => (
                          <div key={section.id} id={`section-${index}`}>
                            <SectionExecution 
                              sectionExecution={{
                                id: section.id,
                                output: section.content
                              }}
                              onUpdate={() => {
                                // Refresh document content when section is updated
                                refetchDocumentContent();
                              }}
                              readyToEdit={true}
                              sectionIndex={index}
                            />
                          </div>
                        ))}
                      </>
                    ) : (
                      // Legacy format: single string content
                      <Markdown>{documentContent.content}</Markdown>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <File className="h-16 w-16 mx-auto mb-4 opacity-40" style={{ color: '#4464f7' }} />
                      <p className="text-lg font-medium text-gray-500">No content available</p>
                      <p className="text-sm text-gray-400 mt-1 mb-6">This document doesn't have any content yet</p>
                      
                      <div className="flex gap-3 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={handleAddSection}
                          className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={handleCreateExecution}
                          className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Create Execution
                        </Button>
                      </div>
                    </div>
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
        </div>
      </div>

      {/* Table of Contents Sidebar - only show for documents with content */}
      {selectedFile.type === 'document' && documentContent?.content && tocItems.length > 0 && (
        <CollapsibleSidebar
          isOpen={isTocSidebarOpen}
          onToggle={() => setIsTocSidebarOpen(!isTocSidebarOpen)}
          position="right"
          toggleAriaLabel={isTocSidebarOpen ? "Hide Table of Contents" : "Show Table of Contents"}
          header={
            <div className="p-4">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Table of Contents</h3>
              </div>
            </div>
          }
        >
          <div className="p-4">
            <TableOfContents items={tocItems} />
          </div>
        </CollapsibleSidebar>
      )}

      {documentContent && documentContent.content && (
        <Chatbot executionId={documentContent.execution_id} />
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:cursor-pointer">
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

      <EditDocumentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        documentId={selectedFile?.id || ''}
        currentName={selectedFile?.name || ''}
        currentDescription={documentContent?.description}
        onUpdated={(newName) => {
          if (selectedFile) {
            setSelectedFile({ ...selectedFile, name: newName });
          }
          // Opcional: refresh sin forzar re-render grande
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        }}
      />
    </div>
  );
}