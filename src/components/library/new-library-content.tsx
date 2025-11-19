import { useMemo, useEffect, useState } from "react";
import { File, Loader2, Download, Trash2, FileText, FileCode, Plus, Play, List, Edit3, RotateCcw, FolderTree, PlusCircle, FileIcon, Zap } from "lucide-react";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { ExecutionStatusBanner } from "@/components/execution-status-banner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chatbot from "../chatbot/chatbot";
import { ExecuteSheet, SectionSheet, DependenciesSheet, ContextSheet, TemplateConfigSheet } from "../sheets";
import { useIsMobile } from "@/hooks/use-mobile";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getDocumentContent, deleteDocument, getDocumentById } from "@/services/documents";
import { exportExecutionToMarkdown, exportExecutionToWord } from "@/services/executions";
import { createSection, updateSectionsOrder } from "@/services/section";
import { addTemplate, getTemplateById } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/table-of-contents";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/edit_document_dialog";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import CreateDocumentLib from "@/components/library/create_document_lib";
import SectionExecution from "./library_section";
import { AddSectionFormSheet } from "@/components/add_section_form_sheet";

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
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
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

// Section Separator Component with hover add button
function SectionSeparator({ 
  onAddSection, 
  index, 
  isLastSection = false,
  isMobile = false
}: { 
  onAddSection: (afterIndex?: number) => void;
  index?: number;
  isLastSection?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div className="group relative flex items-center justify-center my-4 px-4">
      {/* Divider line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 group-hover:border-gray-300 transition-colors duration-200" />
      </div>
      
      {/* Add section button - appears on hover on desktop, always visible on mobile */}
      <div className="relative bg-white px-6">
        <Button
          onClick={() => onAddSection(index)}
          variant="ghost"
          size="sm"
          className={`
            h-8 w-8 p-0 rounded-full 
            ${isMobile 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100'
            }
            transition-all duration-300 ease-in-out
            hover:bg-[#4464f7] hover:text-white
            text-gray-400 hover:cursor-pointer
            border border-gray-200 bg-white
            shadow-sm hover:shadow-lg
            transform hover:scale-110 active:scale-95
          `}
          title={`Add section ${isLastSection ? 'at the end' : index !== undefined && index >= 0 ? `after section ${index + 1}` : 'at the beginning'}`}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AssetContent({ 
  selectedFile, 
  selectedExecutionId, 
  setSelectedExecutionId, 
  refetchDocumentContent,
  setSelectedFile,
  onRefresh,
  currentFolderId,
  onToggleSidebar
}: LibraryContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { selectedOrganizationId } = useOrganization();

  // Mutation for direct section creation
  const addSectionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; document_id: string; prompt: string; dependencies: string[]; order?: number }) => {
      // First create the section
      const { order, ...createData } = sectionData;
      const newSection = await createSection(createData);
      
      // If order is specified, reorder sections
      if (order !== undefined) {
        const existingSections = [...(fullDocument?.sections || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        let sectionsWithOrder: { section_id: string; order: number }[] = [];
        
        if (order === -1) {
          // Insert at beginning
          sectionsWithOrder.push({ section_id: newSection.id, order: 1 });
          existingSections.forEach((s: any, index: number) => {
            sectionsWithOrder.push({ section_id: s.id, order: index + 2 });
          });
        } else if (existingSections.length > 0) {
          // Insert after specific position
          existingSections.forEach((s: any, index: number) => {
            if (index <= order) {
              // Sections before and at the insertion point keep their order
              sectionsWithOrder.push({ section_id: s.id, order: index + 1 });
            } else {
              // Sections after the insertion point are shifted by 1
              sectionsWithOrder.push({ section_id: s.id, order: index + 2 });
            }
          });
          
          // Insert new section at the correct position
          sectionsWithOrder.push({ section_id: newSection.id, order: order + 2 });
        } else {
          // No existing sections, just add the new one
          sectionsWithOrder.push({ section_id: newSection.id, order: 1 });
        }
        
        // Sort by order to ensure correct sequence
        sectionsWithOrder.sort((a, b) => a.order - b.order);
        
        // Update the order
        await updateSectionsOrder(sectionsWithOrder);
      }
      
      return newSection;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      
      setIsDirectSectionDialogOpen(false);
      setSectionInsertPosition(undefined);
      toast.success("Section created successfully");
      
      // Force refetch of document content
      setTimeout(() => {
        refetchDocumentContent();
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + error.message);
    },
  });

  // Mutation for template creation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: { name: string; description?: string }) => {
      return await addTemplate({
        name: templateData.name,
        description: templateData.description,
        organization_id: selectedOrganizationId!
      });
    },
    onSuccess: (template) => {
      setCreatedTemplate(template);
      setIsCreateTemplateSheetOpen(false);
      toast.success("Template created successfully");
      
      // Open template configuration sheet instead of navigating
      setTimeout(() => {
        setIsTemplateConfigSheetOpen(true);
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Error creating template:", error);
      toast.error("Error creating template: " + error.message);
    },
  });

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTocSidebarOpen, setIsTocSidebarOpen] = useState(false);
  const [isExecuteSheetOpen, setIsExecuteSheetOpen] = useState(false);
  const [isSectionSheetOpen, setIsSectionSheetOpen] = useState(false);
  const [isDependenciesSheetOpen, setIsDependenciesSheetOpen] = useState(false);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);
  
  // State for tracking current execution for polling
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  
  // Direct section creation state
  const [isDirectSectionDialogOpen, setIsDirectSectionDialogOpen] = useState(false);
  const [sectionInsertPosition, setSectionInsertPosition] = useState<number | undefined>(undefined);
  
  // Template creation states
  const [isCreateTemplateSheetOpen, setIsCreateTemplateSheetOpen] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [isTemplateConfigSheetOpen, setIsTemplateConfigSheetOpen] = useState(false);
  
  // Clear created template when component unmounts or selectedFile changes
  useEffect(() => {
    if (createdTemplate && selectedFile) {
      setCreatedTemplate(null);
    }
  }, [selectedFile, createdTemplate]);

  // Clear current execution ID when selectedFile changes to prevent showing banner for wrong file
  useEffect(() => {
    setCurrentExecutionId(null);
  }, [selectedFile?.id]);



  // Handle document creation
  const handleDocumentCreated = (createdDocument: { id: string; name: string; type: "document" }) => {
    onRefresh();
    setSelectedFile(createdDocument);
  };



  // Handle add section
  const handleAddSection = () => {
    if (selectedFile && selectedFile.type === 'document') {
      setIsSectionSheetOpen(true);
    }
  };

  // Handle add section at specific position
  const handleAddSectionAtPosition = (afterIndex?: number) => {
    if (selectedFile && selectedFile.type === 'document') {
      console.log(`Adding section after index: ${afterIndex}`);
      setSectionInsertPosition(afterIndex);
      setIsDirectSectionDialogOpen(true);
    }
  };

  // Handle direct section creation submission
  const handleDirectSectionSubmit = (values: { name: string; document_id: string; prompt: string; dependencies: string[] }) => {
    let order: number | undefined = undefined;
    
    // Calculate order based on position
    if (sectionInsertPosition !== undefined) {
      if (sectionInsertPosition === -1) {
        // Insert at beginning (before first section)
        order = -1;
      } else if (sectionInsertPosition >= 0) {
        // Insert after specific index (sectionInsertPosition is 0-based section index)
        order = sectionInsertPosition;
      }
    }
    
    console.log('Creating section with position:', sectionInsertPosition, 'calculated order:', order);
    addSectionMutation.mutate({ ...values, order });
  };

  // Handle create new execution
  const handleCreateExecution = () => {
    if (selectedFile && selectedFile.type === 'document') {
      if (hasExecutionInProcess) {
        toast.error('There\'s already an execution running. Please wait for it to complete before creating a new one.');
        return;
      }
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

  // Fetch full template details for configuration
  const { data: fullTemplate } = useQuery({
    queryKey: ['template', createdTemplate?.id],
    queryFn: () => getTemplateById(createdTemplate!.id),
    enabled: !!createdTemplate?.id,
  });

  // Fetch executions for the document to check for running executions
  const { data: documentExecutions } = useExecutionsByDocumentId(
    selectedFile?.id || '',
    selectedFile?.type === 'document' && !!selectedFile?.id
  );

  // Check if there's any execution in process
  const hasExecutionInProcess = useMemo(() => {
    if (!documentExecutions) return false;
    return documentExecutions.some((execution: any) => 
      ['running', 'queued'].includes(execution.status)
    );
  }, [documentExecutions]);

  // Check if there's a pending execution that can be resumed
  const hasPendingExecution = useMemo(() => {
    if (!documentExecutions) return false;
    return documentExecutions.some((execution: any) => 
      execution.status === 'pending'
    );
  }, [documentExecutions]);

  // Check if there's a new pending execution (never executed)
  const hasNewPendingExecution = useMemo(() => {
    if (!documentExecutions) return false;
    const pendingExecution = documentExecutions.find((execution: any) => 
      execution.status === 'pending'
    );
    if (!pendingExecution) return false;
    // Check if any section has generated content (output)
    return !pendingExecution.sections?.some((section: any) => 
      section.output && section.output.trim().length > 0
    );
  }, [documentExecutions]);

  // Get the active execution ID (running or pending) from document executions
  const activeExecutionId = useMemo(() => {
    if (!documentExecutions) return null;
    const activeExecution = documentExecutions.find((execution: any) => 
      ['running', 'pending'].includes(execution.status)
    );
    return activeExecution?.id || null;
  }, [documentExecutions]);

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

  // Create Template Sheet Component
  const CreateTemplateSheet = () => {
    const [formData, setFormData] = useState({ name: '', description: '' });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.name.trim()) {
        createTemplateMutation.mutate({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        });
      }
    };

    return (
      <Dialog open={isCreateTemplateSheetOpen} onOpenChange={setIsCreateTemplateSheetOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-[#4464f7]" />
              Create New Template
            </DialogTitle>
            <DialogDescription>
              Create a reusable template that can be used to generate documents with predefined sections.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4464f7] focus:border-transparent"
                  placeholder="Enter template name..."
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4464f7] focus:border-transparent"
                  placeholder="Describe what this template is for..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTemplateSheetOpen(false)}
                disabled={createTemplateMutation.isPending}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTemplateMutation.isPending || !formData.name.trim()}
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                {createTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };



  if (!selectedFile) {
    return (
      <>
        <div className="h-full bg-white flex items-center justify-center p-4">
          <Empty>
            <div className="p-8 text-center">
              <EmptyIcon>
                <FileIcon className="h-12 w-12" />
              </EmptyIcon>
              <EmptyTitle>Welcome to Assets</EmptyTitle>
              <EmptyDescription>
                Create your first document or select an existing one to get started with your document workflow.
              </EmptyDescription>
              <EmptyActions>
                <Button
                  onClick={() => setIsCreateTemplateSheetOpen(true)}
                  variant="outline"
                  className="hover:cursor-pointer"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
                <CreateDocumentLib
                  trigger={
                    <Button className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Asset
                    </Button>
                  }
                  folderId={currentFolderId}
                  onDocumentCreated={handleDocumentCreated}
                />
              </EmptyActions>
            </div>
          </Empty>
        </div>

        {/* Template Creation Sheet */}
        <CreateTemplateSheet />
        
        {/* Template Configuration Sheet */}
        <TemplateConfigSheet
          template={fullTemplate}
          isOpen={isTemplateConfigSheetOpen}
          onOpenChange={setIsTemplateConfigSheetOpen}
        />
      </>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Document Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Toggle */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 shadow-sm py-1.5 px-4 z-20 flex-shrink-0" data-mobile-header>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onToggleSidebar}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:cursor-pointer"
                      >
                        <FolderTree className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show file tree</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-medium text-gray-900">
                  {selectedFile ? selectedFile.name : 'Asset'}
                </span>
              </div>
              
              {/* Table of Contents Toggle - Mobile */}
              {selectedFile?.type === 'document' && documentContent?.content && tocItems.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsTocSidebarOpen(!isTocSidebarOpen)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:cursor-pointer"
                      >
                        <List className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isTocSidebarOpen ? "Hide Table of Contents" : "Show Table of Contents"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Mobile Action Buttons - Icon Only */}
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5">
              <ExecuteSheet
                selectedFile={selectedFile}
                fullDocument={fullDocument}
                isOpen={isExecuteSheetOpen}
                onOpenChange={setIsExecuteSheetOpen}
                onSectionSheetOpen={() => setIsSectionSheetOpen(true)}
                onExecutionComplete={() => {
                  // Refresh document content when execution completes
                  queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                  queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                  queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                  
                  // Reset execution ID to load the latest execution automatically
                  setSelectedExecutionId(null);
                  
                  // Refetch document content to get the latest execution
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                  }, 500);
                }}
                onExecutionCreated={(executionId) => {
                  setCurrentExecutionId(executionId);
                  // Invalidate executions query to update the list
                  queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                }}
                isMobile={isMobile}
                disabled={hasExecutionInProcess}
                disabledReason="There's already an execution running. Please wait for it to complete."
              />
              
              <SectionSheet
                selectedFile={selectedFile}
                fullDocument={fullDocument}
                isOpen={isSectionSheetOpen}
                onOpenChange={setIsSectionSheetOpen}
                isMobile={isMobile}
              />
              
              <DependenciesSheet
                selectedFile={selectedFile}
                isOpen={isDependenciesSheetOpen}
                onOpenChange={setIsDependenciesSheetOpen}
                isMobile={isMobile}
              />
              
              <ContextSheet
                selectedFile={selectedFile}
                isOpen={isContextSheetOpen}
                onOpenChange={setIsContextSheetOpen}
                isMobile={isMobile}
              />
              
              {/* Secondary Action Buttons */}
              {/* Execution Dropdown - only show for documents with executions */}
              {selectedFile.type === 'document' && documentContent?.executions?.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full"
                      title="Switch Execution"
                    >
                      <RotateCcw className="h-4 w-4" />
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
                              queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
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
              
              {/* Edit Button */}
              <Button
                onClick={openEditDialog}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                title="Edit Document"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                    title="Export Options"
                  >
                    <Download className="h-4 w-4" />
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
              
              {/* Delete Button */}
              <Button
                onClick={() => setTimeout(() => openDeleteDialog(), 0)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors rounded-full"
                title="Delete Document"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        
        {/* Header Section */}
        {!isMobile && (
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 md:px-7 z-10 flex-shrink-0" data-desktop-header>
          <div className="space-y-3 md:space-y-4">
            {/* Title and Type Section */}
            {!isMobile && (
              <div className="flex items-start md:items-center gap-3 md:gap-4 flex-col md:flex-row">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 break-words min-w-0 flex-1">{selectedFile.name}</h1>
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
            )}
            
            
            {/* Action Buttons Section */}
            <div className="flex items-start gap-2 flex-wrap">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
              <ExecuteSheet
                selectedFile={selectedFile}
                fullDocument={fullDocument}
                isOpen={isExecuteSheetOpen}
                onOpenChange={setIsExecuteSheetOpen}
                onSectionSheetOpen={() => setIsSectionSheetOpen(true)}
                onExecutionComplete={() => {
                  // Refresh document content when execution completes
                  queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                  queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                  queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                  
                  // Reset execution ID to load the latest execution automatically
                  setSelectedExecutionId(null);
                  
                  // Refetch document content to get the latest execution
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                  }, 500);
                }}
                onExecutionCreated={(executionId) => {
                  setCurrentExecutionId(executionId);
                  // Invalidate executions query to update the list
                  queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                }}
                disabled={hasExecutionInProcess}
                disabledReason="There's already an execution running. Please wait for it to complete."
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
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
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
                                queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
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
                
                {/* Table of Contents Toggle */}
                {selectedFile.type === 'document' && documentContent?.content && tocItems.length > 0 && (
                  <Button
                    onClick={() => setIsTocSidebarOpen(!isTocSidebarOpen)}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                    title={isTocSidebarOpen ? "Hide Table of Contents" : "Show Table of Contents"}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            
          </div>
        </div>
        )}

        {/* Content Section - Now with its own scroll */}
        <div className="flex-1 bg-white min-w-0 overflow-auto" style={{ scrollPaddingTop: '100px' }}>
          <div className="py-4 md:py-5 px-4 md:px-6">
            {selectedFile.type === 'document' ? (
              <>
                {/* Execution Status Banner - Show for active executions */}
                <ExecutionStatusBanner
                  executionId={currentExecutionId || activeExecutionId}
                  onExecutionComplete={() => {
                    // Clear the current execution ID and refresh content
                    setCurrentExecutionId(null);
                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                    queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                  }}
                  className="mb-4"
                />
                
                {isLoadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading document content...</span>
                  </div>
                ) : (!documentContent?.executions || documentContent.executions.length === 0) || (!documentContent?.content) ? (
                  // Show Empty when document has no executions
                  <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
                    <Empty className="max-w-2xl">
                      <div className="p-8 text-center">
                        <EmptyIcon>
                          <Zap className="h-12 w-12" />
                        </EmptyIcon>
                        <EmptyTitle>Setup {selectedFile.name}</EmptyTitle>
                        <EmptyDescription>
                          {fullDocument?.sections?.length > 0 
                            ? "Your document is ready! You can now generate content with AI, add more sections, or configure dependencies."
                            : "Start building your document by adding sections. Sections help structure your content and guide the AI generation process."
                          }
                        </EmptyDescription>
                        <EmptyActions>
                          {fullDocument?.sections?.length === 0 ? (
                            <Button
                              onClick={() => setIsSectionSheetOpen(true)}
                              className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Sections
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => setIsExecuteSheetOpen(true)}
                                disabled={hasExecutionInProcess}
                                className={hasExecutionInProcess 
                                  ? "hover:cursor-not-allowed bg-gray-300 text-gray-500" 
                                  : "hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                                }
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                {hasNewPendingExecution ? "Start Execution" : hasPendingExecution ? "Continue Execution" : "Generate Content"}
                              </Button>
                              <Button
                                onClick={() => setIsSectionSheetOpen(true)}
                                variant="outline"
                                className="hover:cursor-pointer"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add More Sections
                              </Button>
                            </>
                          )}
                        </EmptyActions>
                      </div>
                    </Empty>
                  </div>
                ) : documentContent?.content ? (
                  <div className="prose prose-gray max-w-full prose-sm md:prose-base">
                    {Array.isArray(documentContent.content) ? (
                      // New format: array of sections with separators
                      <>
                        {/* Add section button at the beginning */}
                        <SectionSeparator 
                          onAddSection={() => handleAddSectionAtPosition(-1)} 
                          index={-1}
                          isMobile={isMobile}
                        />
                        
                        {documentContent.content.map((section: ContentSection, index: number) => (
                          <div key={section.id}>
                            <div id={`section-${index}`}>
                              <SectionExecution 
                                sectionExecution={{
                                  id: section.id,
                                  output: section.content
                                }}
                                onUpdate={() => {
                                  // Refresh document content when section is updated
                                  queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                                }}
                                readyToEdit={true}
                                sectionIndex={index}
                              />
                            </div>
                            
                            {/* Add separator after each section */}
                            <SectionSeparator 
                              onAddSection={handleAddSectionAtPosition} 
                              index={index}
                              isLastSection={index === documentContent.content.length - 1}
                              isMobile={isMobile}
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
          showToggleButton={!isMobile} // Only show internal button on mobile
          customToggleIcon={<List className="h-4 w-4" />}
          customToggleIconMobile={<List className="h-5 w-5" />}
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

      {/* Direct Section Creation Dialog */}
      <Dialog open={isDirectSectionDialogOpen} onOpenChange={setIsDirectSectionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#4464f7]" />
              Add New Section
            </DialogTitle>
            <DialogDescription>
              {sectionInsertPosition === -1 
                ? "Create a new section at the beginning of the document."
                : sectionInsertPosition !== undefined && sectionInsertPosition >= 0
                ? `Create a new section after section ${sectionInsertPosition + 1}.`
                : "Create a new section for your document."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6">
            <AddSectionFormSheet
              documentId={selectedFile?.id || ''}
              onSubmit={handleDirectSectionSubmit}
              isPending={addSectionMutation.isPending}
              existingSections={fullDocument?.sections || []}
            />
          </div>
          
          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDirectSectionDialogOpen(false)}
              disabled={addSectionMutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-section-form"
              disabled={addSectionMutation.isPending}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {addSectionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Section
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

