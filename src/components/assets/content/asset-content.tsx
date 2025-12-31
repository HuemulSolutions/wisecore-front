import { useMemo, useEffect, useState } from "react";
import { File, Loader2, Download, Trash2, FileText, FileCode, Plus, Play, List, Edit3, FolderTree, PlusCircle, FileIcon, Zap, Check, X, CheckCircle, Clock, Eye, Copy, FileX } from "lucide-react";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { createSectionExecution } from "@/services/section_execution";
import { AddSectionExecutionForm } from "@/components/add-section-execution-form";
import { ExecutionStatusBanner } from "@/components/execution-status-banner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chatbot from "@/components/chatbot/chatbot";
import { SectionSheet, DependenciesSheet, ContextSheet, TemplateConfigSheet } from "@/components/sheets";
import { ExecuteSheet } from "@/components/sheets/ExecuteSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { DocumentAccessControl, DocumentActionButton } from "@/components/document-access-control";

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
import { exportExecutionToMarkdown, exportExecutionToWord, executeDocument, approveExecution, disapproveExecution, cloneExecution, deleteExecution } from "@/services/executions";
import { getDefaultLLM } from "@/services/llms";
import { createSection, updateSectionsOrder } from "@/services/section";
import { addTemplate, getTemplateById } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/table-of-contents";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/edit_document_dialog";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { CreateAssetDialog } from "@/components/create-asset-dialog";
import SectionExecution from "./library-section";
import { AddSectionFormSheet } from "@/components/add_section_form_sheet";
import { formatApiDateTime, parseApiDate } from "@/lib/utils";

// API response interface
interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
  document_type?: {
    id: string;
    name: string;
    color: string;
  };
  access_levels?: string[];
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
  isMobile = false,
  accessLevels
}: { 
  onAddSection: (afterIndex?: number) => void;
  index?: number;
  isLastSection?: boolean;
  isMobile?: boolean;
  selectedFile?: { id: string; name: string; type: "folder" | "document"; access_levels?: string[] } | null;
  accessLevels?: string[];
}) {
  return (
    <div className="group relative flex items-center justify-center my-4 px-4">
      {/* Divider line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 group-hover:border-gray-300 transition-colors duration-200" />
      </div>
      
      {/* Add section button - appears on hover on desktop, always visible on mobile */}
      <div className="relative bg-white px-6">
        <DocumentActionButton
          accessLevels={accessLevels}
          requiredAccess={["edit", "create"]}
          requireAll={false}
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
        </DocumentActionButton>
      </div>
    </div>
  );
}

export function AssetContent({ 
  selectedFile, 
  selectedExecutionId, 
  setSelectedExecutionId, 
  setSelectedFile,
  onRefresh,
  currentFolderId,
  onToggleSidebar
}: LibraryContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { selectedOrganizationId } = useOrganization();
  const { canCreate, canAccessTemplates, canAccessAssets } = useUserPermissions();
  
  // States to control on-demand loading
  const [needsFullDocument, setNeedsFullDocument] = useState(false);
  const [needsDefaultLLM, setNeedsDefaultLLM] = useState(false);
  
  // Removed debug logging to improve performance

  // Si no hay organización seleccionada, no renderizar nada
  if (!selectedOrganizationId) {
    return null;
  }

  // Mutation for direct section creation
  const addSectionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; document_id: string; prompt: string; dependencies: string[]; order?: number }) => {
      // First create the section
      const { order, ...createData } = sectionData;
      const newSection = await createSection(createData, selectedOrganizationId!);
      
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
        await updateSectionsOrder(sectionsWithOrder, selectedOrganizationId!);
      }
      
      return newSection;
    },
    onSuccess: () => {
      // Only invalidate necessary queries - no need for refetch since invalidation will trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      
      setIsDirectSectionDialogOpen(false);
      setSectionInsertPosition(undefined);
      setIsDirectSectionFormValid(false);
      toast.success("Section created successfully");
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
      
      // Invalidate templates query to refresh the template list in CreateAssetDialog
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      
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

  // Mutation for section execution creation
  const createSectionExecutionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; output: string; after_from?: string }) => {
      if (!selectedExecutionId) {
        throw new Error('No execution ID available');
      }
      return await createSectionExecution(selectedExecutionId, sectionData);
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      
      setIsSectionExecutionDialogOpen(false);
      setAfterFromSectionId(null);
      setIsSectionExecutionFormValid(false);
      toast.success("Section added successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating section execution:", error);
      toast.error("Error creating section: " + error.message);
    },
  });

  // Mutation para ejecutar documento directamente
  const executeDocumentMutation = useMutation({
    mutationFn: async ({ documentId, instructions }: { documentId: string; instructions?: string }) => {
      if (!defaultLLM?.id) {
        throw new Error('No default LLM available');
      }
      return await executeDocument({
        documentId,
        llmId: defaultLLM.id,
        instructions: instructions || "",
        organizationId: selectedOrganizationId!
      });
    },
    onSuccess: (executionData) => {
      toast.success("Document execution started successfully");
      setCurrentExecutionId(executionData.id);
      
      // Update selected execution to show the new one
      setSelectedExecutionId(executionData.id);
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: (error: Error) => {
      console.error("Error executing document:", error);
      toast.error("Error executing document: " + error.message);
    },
  });

  // Mutation for approve execution
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return approveExecution(selectedExecutionId, selectedOrganizationId);
    },
    onSuccess: () => {
      toast.success('Execution approved successfully!');
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: (error: Error) => {
      console.error('Error approving execution:', error);
      toast.error('Failed to approve execution. Please try again.');
    },
  });

  // Mutation for disapprove execution
  const disapproveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return disapproveExecution(selectedExecutionId, selectedOrganizationId);
    },
    onSuccess: () => {
      toast.success('Execution disapproved successfully!');
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: (error: Error) => {
      console.error('Error disapproving execution:', error);
      toast.error('Failed to disapprove execution. Please try again.');
    },
  });

  // Mutation for deleting execution
  const deleteExecutionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return deleteExecution(selectedExecutionId, selectedOrganizationId);
    },
    onSuccess: () => {
      toast.success('Execution deleted successfully!');
      
      // Clear selected execution and switch to most recent remaining execution
      const executions = documentContent?.executions || documentExecutions;
      const remainingExecutions = executions?.filter((exec: any) => exec.id !== selectedExecutionId);
      if (remainingExecutions && remainingExecutions.length > 0) {
        setSelectedExecutionId(remainingExecutions[0].id);
      } else {
        setSelectedExecutionId(null);
      }
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: (error: Error) => {
      console.error('Error deleting execution:', error);
      toast.error('Failed to delete execution. Please try again.');
    },
  });

  // Mutation for clone execution
  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return cloneExecution(selectedExecutionId, selectedOrganizationId);
    },
    onSuccess: (clonedExecution) => {
      toast.success('Execution cloned successfully!');
      // Switch to the new cloned execution
      setSelectedExecutionId(clonedExecution.id);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: (error: Error) => {
      console.error('Error cloning execution:', error);
      toast.error('Failed to clone execution. Please try again.');
    },
  });

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'document' | 'execution' | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);
  const [isTocSidebarOpen, setIsTocSidebarOpen] = useState(true);
  const [isSectionSheetOpen, setIsSectionSheetOpen] = useState(false);
  const [isDependenciesSheetOpen, setIsDependenciesSheetOpen] = useState(false);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);
  
  // Effects to trigger on-demand loading
  useEffect(() => {
    // Load full document when section sheet is opened
    if (isSectionSheetOpen && selectedFile?.type === 'document') {
      setNeedsFullDocument(true);
    }
  }, [isSectionSheetOpen, selectedFile?.type]);

  // Reset states when file changes
  useEffect(() => {
    setNeedsFullDocument(false);
    setNeedsDefaultLLM(false);
  }, [selectedFile?.id]);
  
  // State for tracking current execution for polling
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  
  // Estado para tracking de ejecuciones de secciones individuales
  const [sectionExecutionId, setSectionExecutionId] = useState<string | null>(null);
  
  // Direct section creation state
  const [isDirectSectionDialogOpen, setIsDirectSectionDialogOpen] = useState(false);
  const [sectionInsertPosition, setSectionInsertPosition] = useState<number | undefined>(undefined);
  const [isDirectSectionFormValid, setIsDirectSectionFormValid] = useState(false);
  
  // Section execution creation state
  const [isSectionExecutionDialogOpen, setIsSectionExecutionDialogOpen] = useState(false);
  const [afterFromSectionId, setAfterFromSectionId] = useState<string | null>(null);
  const [isSectionExecutionFormValid, setIsSectionExecutionFormValid] = useState(false);
  
  // Template creation states
  const [isCreateTemplateSheetOpen, setIsCreateTemplateSheetOpen] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [isTemplateConfigSheetOpen, setIsTemplateConfigSheetOpen] = useState(false);
  
  // Asset creation state
  const [isCreateAssetDialogOpen, setIsCreateAssetDialogOpen] = useState(false);
  
  // Execute sheet state
  const [isExecuteSheetOpen, setIsExecuteSheetOpen] = useState(false);
  
  // Clear created template when component unmounts or selectedFile changes
  useEffect(() => {
    if (createdTemplate && selectedFile) {
      setCreatedTemplate(null);
    }
  }, [selectedFile, createdTemplate]);

  // Clear current execution ID when selectedFile changes to prevent showing banner for wrong file
  useEffect(() => {
    setCurrentExecutionId(null);
    setSectionExecutionId(null);
  }, [selectedFile?.id]);



  // Handle document creation
  const handleDocumentCreated = (createdDocument: { id: string; name: string; type: "document" }) => {
    onRefresh();
    setSelectedFile(createdDocument);
  };

  // Handle execution created from Execute Sheet
  const handleExecutionCreated = (executionId: string) => {
    setSelectedExecutionId(executionId);
    setCurrentExecutionId(executionId);
    
    // Invalidate queries to refresh execution data (automatic refetch will occur)
    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
  };

  // Handle execution complete from Execute Sheet
  const handleExecutionComplete = () => {
    // Refresh document content and executions (automatic refetch will occur)
    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
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
      // Si hay contenido de documento (execution exists), crear section_execution
      if (documentContent?.content && Array.isArray(documentContent.content) && selectedExecutionId) {
        console.log(`Adding section execution after index: ${afterIndex}`);
        
        // Determinar el after_from ID basado en el índice
        let afterFromId: string | null = null;
        if (afterIndex === -1) {
          // Insert at beginning - no pasar after_from para que se agregue al principio
          afterFromId = null;
        } else if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < documentContent.content.length) {
          // Insert after specific section
          afterFromId = documentContent.content[afterIndex].id;
        } else {
          // Default to last section
          afterFromId = documentContent.content[documentContent.content.length - 1]?.id || null;
        }
        
        setAfterFromSectionId(afterFromId);
        setIsSectionExecutionDialogOpen(true);
        setIsSectionExecutionFormValid(false);
      } else {
        // Si no hay execution, crear sección normal
        console.log(`Adding section after index: ${afterIndex}`);
        setSectionInsertPosition(afterIndex);
        setIsDirectSectionDialogOpen(true);
        setIsDirectSectionFormValid(false);
      }
    }
  };

  // Handle direct section creation submission
  const handleDirectSectionSubmit = (values: { name: string; prompt: string; dependencies: string[]; document_id?: string; template_id?: string; type?: string }) => {
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
    // Ensure we have the required fields for document sections
    const sectionData = {
      name: values.name,
      document_id: values.document_id || selectedFile?.id || '',
      prompt: values.prompt,
      dependencies: values.dependencies,
      order
    };
    addSectionMutation.mutate(sectionData);
  };

  // Handle section execution creation submission
  const handleSectionExecutionSubmit = (values: { name: string; output: string; after_from?: string }) => {
    createSectionExecutionMutation.mutate(values);
  };

  // Handle create new execution - abrir Execute Sheet
  const handleCreateExecution = () => {
    if (selectedFile && selectedFile.type === 'document') {
      // Load necessary data for execution
      setNeedsFullDocument(true);
      setNeedsDefaultLLM(true);
      setIsExecuteSheetOpen(true);
    }
  };

  // Fetch document content when a document is selected
  const { data: documentContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['document-content', selectedFile?.id, selectedExecutionId],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedOrganizationId!, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
    // Remove automatic polling - let the ExecutionStatusBanner handle status updates
    // and trigger refresh through query invalidation
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch full document details only when needed (sections management, sheet operations)
  const { data: fullDocument } = useQuery({
    queryKey: ['document', selectedFile?.id],
    queryFn: () => getDocumentById(selectedFile!.id, selectedOrganizationId!),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId && needsFullDocument,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Fetch full template details for configuration
  const { data: fullTemplate } = useQuery({
    queryKey: ['template', createdTemplate?.id],
    queryFn: () => getTemplateById(createdTemplate!.id, selectedOrganizationId!),
    enabled: !!createdTemplate?.id && !!selectedOrganizationId,
  });

  // Query para obtener LLM por defecto (solo cuando se vaya a ejecutar)
  const { data: defaultLLM } = useQuery({
    queryKey: ["default-llm"],
    queryFn: getDefaultLLM,
    enabled: !!selectedOrganizationId && needsDefaultLLM, // Solo cargar cuando se necesite ejecutar
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch executions for the document to check for running executions
  // Optimización: Solo usar este endpoint si no tenemos datos de executions en documentContent
  const shouldFetchExecutions = useMemo(() => {
    // Si no hay documento seleccionado, no fetch
    if (!selectedFile?.id || selectedFile.type !== 'document') return false;
    
    // Si ya tenemos executions data en documentContent, no necesitamos el endpoint separado
    if (documentContent?.executions && Array.isArray(documentContent.executions)) {
      return false;
    }
    
    return true;
  }, [selectedFile?.id, selectedFile?.type, documentContent?.executions]);

  const { data: documentExecutions } = useExecutionsByDocumentId(
    selectedFile?.id || '',
    selectedOrganizationId || '',
    shouldFetchExecutions && !!selectedOrganizationId
  );

  // Check if there's any execution in process - optimized with memoization
  const hasExecutionInProcess = useMemo(() => {
    // Use executions from documentContent first (preferred), then fallback to separate query
    const executions = documentContent?.executions || documentExecutions;
    if (!executions) return false;
    return executions.some((execution: any) => 
      ['running', 'queued', 'pending', 'processing'].includes(execution.status)
    );
  }, [documentContent?.executions, documentExecutions]);

  // Check if there's a pending execution that can be resumed
  const hasPendingExecution = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    if (!executions) return false;
    return executions.some((execution: any) => 
      execution.status === 'pending'
    );
  }, [documentContent?.executions, documentExecutions]);

  // Check if there's a new pending execution (never executed)
  const hasNewPendingExecution = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    if (!executions) return false;
    const pendingExecution = executions.find((execution: any) => 
      execution.status === 'pending'
    );
    if (!pendingExecution) return false;
    // Check if any section has generated content (output)
    return !pendingExecution.sections?.some((section: any) => 
      section.output && section.output.trim().length > 0
    );
  }, [documentContent?.executions, documentExecutions]);

  // Get the active execution ID (running, pending, or failed) from document executions
  const activeExecutionId = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    if (!executions) return null;
    const activeExecution = executions.find((execution: any) => 
      ['running', 'pending', 'failed'].includes(execution.status)
    );
    return activeExecution?.id || null;
  }, [documentContent?.executions, documentExecutions]);

  // Get the correct access levels - use documentContent first (authoritative), fallback to selectedFile
  const accessLevels = useMemo(() => {
    return documentContent?.access_levels || selectedFile?.access_levels || [];
  }, [documentContent?.access_levels, selectedFile?.access_levels]);

  // Get selected execution details for displaying version info (optimized)
  const selectedExecutionInfo = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    
    if (!executions) {
      return null;
    }
    
    let selectedExecution;
    
    if (selectedExecutionId) {
      // User has manually selected a specific execution
      selectedExecution = executions.find((execution: any) => 
        execution.id === selectedExecutionId
      );
    } else {
      // No specific execution selected, use the current execution from documentContent
      selectedExecution = documentContent?.execution_id 
        ? executions.find((execution: any) => execution.id === documentContent.execution_id)
        : executions.find((execution: any) => execution.status === 'approved') || executions[0];
    }
    
    if (!selectedExecution) {
      return null;
    }
    
    const formattedDate = formatApiDateTime(selectedExecution.created_at);
    
    return {
      ...selectedExecution,
      formattedDate,
      isLatest: executions[0]?.id === selectedExecution.id
    };
  }, [documentContent?.executions, documentContent?.execution_id, documentExecutions, selectedExecutionId]);

  // Initialize selected execution ID when a document is selected (optimized to prevent unnecessary calls)
  useEffect(() => {
    // Only reset selectedExecutionId when switching to a different document or to non-document
    if (selectedFile?.type !== 'document') {
      if (selectedExecutionId) {
        setSelectedExecutionId(null);
      }
      return;
    }

    // Reset selectedExecutionId when switching to a different document
    // This allows the default call (without execution_id) to return the approved execution
    if (selectedExecutionId) {
      setSelectedExecutionId(null);
    }
  }, [selectedFile?.id]);

  // Auto-initialize selectedExecutionId with documentContent.execution_id when loading for first time
  useEffect(() => {
    if (selectedFile?.type === 'document' && 
        documentContent?.execution_id && 
        !selectedExecutionId && 
        !isLoadingContent) {
      // Initialize selectedExecutionId with the current execution from API response
      setSelectedExecutionId(documentContent.execution_id);
    }
  }, [documentContent?.execution_id, selectedExecutionId, selectedFile?.type, isLoadingContent]);
  
  // Removed invalidation useEffect - React Query automatically handles query key changes

  // Auto-update to latest execution when returning to a document with completed executions
  // This is disabled to avoid interfering with manual user selections
  // Users can manually select any version they want from the dropdown
  /* useEffect(() => {
    if (selectedFile?.type === 'document' && 
        documentContent?.executions?.length > 0 && 
        documentExecutions?.length > 0 && 
        selectedExecutionId) {
      
      // Check if currently selected execution exists and get its status
      const currentSelectedExecution = documentExecutions.find((exec: any) => exec.id === selectedExecutionId);
      const mostRecentExecution = documentExecutions[0]; // Executions are ordered by creation date desc
      
      // If we have a more recent execution than the currently selected one, auto-switch to it
      // This handles the case when user navigates away during execution and comes back after it's completed
      if (mostRecentExecution && 
          selectedExecutionId !== mostRecentExecution.id && 
          currentSelectedExecution && 
          ['completed', 'approved', 'failed'].includes(mostRecentExecution.status) &&
          parseApiDate(mostRecentExecution.created_at) > parseApiDate(currentSelectedExecution.created_at)) {
        
        console.log(`Auto-switching to latest completed execution: ${mostRecentExecution.id}`);
        setSelectedExecutionId(mostRecentExecution.id);
        
        // Force refresh of document content with the new execution
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, mostRecentExecution.id] });
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        }, 100);
      }
    }
  }, [selectedFile, documentContent, documentExecutions, selectedExecutionId, setSelectedExecutionId, queryClient]); */



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
        await exportExecutionToMarkdown(documentContent.execution_id, selectedOrganizationId!);
      } catch (error) {
        console.error('Error exporting to markdown:', error);
      }
    }
  };

  // Handle export to word
  const handleExportWord = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToWord(documentContent.execution_id, selectedOrganizationId!);
      } catch (error) {
        console.error('Error exporting to word:', error);
      }
    }
  };

  function openDeleteDialog(type: 'document' | 'execution') {
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setIsDeleteDialogOpen(false);
    setDeleteType(null);
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      closeDeleteDialog();
    }
  };

  function openCloneDialog() {
    setIsCloneDialogOpen(true);
  }

  function closeCloneDialog() {
    setIsCloneDialogOpen(false);
  }

  const handleCloneDialogChange = (open: boolean) => {
    if (open) {
      openCloneDialog();
    } else {
      closeCloneDialog();
    }
  };

  function openApproveDialog() {
    setIsApproveDialogOpen(true);
  }

  function closeApproveDialog() {
    setIsApproveDialogOpen(false);
  }

  const handleApproveDialogChange = (open: boolean) => {
    if (open) {
      openApproveDialog();
    } else {
      closeApproveDialog();
    }
  };

  function openDisapproveDialog() {
    setIsDisapproveDialogOpen(true);
  }

  function closeDisapproveDialog() {
    setIsDisapproveDialogOpen(false);
  }

  const handleDisapproveDialogChange = (open: boolean) => {
    if (open) {
      openDisapproveDialog();
    } else {
      closeDisapproveDialog();
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteType === 'document') {
      handleDeleteDocument();
    } else if (deleteType === 'execution') {
      deleteExecutionMutation.mutate();
    }
    closeDeleteDialog();
  };

  const handleDeleteDocument = async () => {
    if (selectedFile) {
      try {
        await deleteDocument(selectedFile.id, selectedOrganizationId!);
        console.log('Document deleted successfully:', selectedFile.id);
        toast.success(`Document "${selectedFile.name}" deleted successfully`);
        
        // Clear selected file
        setSelectedFile(null);
        
        // Refresh library content to update sidebar
        onRefresh();
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['library'] });
        queryClient.invalidateQueries({ queryKey: ['document-content'] });
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again.');
      }
    }
  };

  // Handle clone confirmation
  const handleCloneConfirm = () => {
    cloneMutation.mutate();
    closeCloneDialog();
  };

  // Handle approve confirmation
  const handleApproveConfirm = () => {
    approveMutation.mutate();
    closeApproveDialog();
  };

  // Handle disapprove confirmation
  const handleDisapproveConfirm = () => {
    disapproveMutation.mutate();
    closeDisapproveDialog();
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
      <Dialog open={isCreateTemplateSheetOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateTemplateSheetOpen(false)
        }
      }}>
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
                {(canAccessTemplates && canCreate('template')) || (canAccessAssets && canCreate('assets'))
                  ? "Create your first document or select an existing one to get started with your document workflow."
                  : "Select an existing asset to get started or contact your administrator for permissions to create new assets."
                }
              </EmptyDescription>
              <EmptyActions>
                {canAccessTemplates && canCreate('template') && (
                  <Button
                    onClick={() => setIsCreateTemplateSheetOpen(true)}
                    variant="outline"
                    className="hover:cursor-pointer"
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
                {canAccessAssets && canCreate('assets') && (
                  <Button 
                    onClick={() => setIsCreateAssetDialogOpen(true)}
                    className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Asset
                  </Button>
                )}
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
        
        {/* Create Asset Dialog */}
        <CreateAssetDialog
          open={isCreateAssetDialogOpen}
          onOpenChange={setIsCreateAssetDialogOpen}
          folderId={currentFolderId}
          onAssetCreated={handleDocumentCreated}
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
          <div className="bg-white border-b border-gray-200 shadow-sm py-2 px-4 z-20 flex-shrink-0" data-mobile-header>
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
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {selectedFile ? selectedFile.name : 'Asset'}
                  </span>
                  {selectedExecutionInfo && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="font-medium text-xs text-gray-900">{selectedExecutionInfo.name}</span>
                      <span>•</span>
                      <span className="text-xs">{selectedExecutionInfo.formattedDate}</span>
                      {selectedExecutionInfo.isLatest && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                          Latest
                        </span>
                      )}
                    </div>
                  )}
                  {/* Document Type and Template badges for mobile */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {documentContent?.document_type && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                        <div 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: documentContent.document_type.color }}
                        />
                        {documentContent.document_type.name}
                      </div>
                    )}
                    {fullDocument?.template_name && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700 border border-blue-200">
                        <FileCode className="w-1.5 h-1.5" />
                        {fullDocument.template_name}
                      </div>
                    )}
                  </div>
                </div>
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
              <DocumentActionButton
                accessLevels={accessLevels}
                requiredAccess={["create"]}
                requireAll={false}
                size="sm"
                onClick={handleCreateExecution}
                disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                className={executeDocumentMutation.isPending || hasExecutionInProcess
                  ? "h-8 w-8 p-0 bg-gray-300 text-gray-500 border-none cursor-not-allowed shadow-sm rounded-full" 
                  : "h-8 w-8 p-0 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer shadow-sm rounded-full"
                }
                title={executeDocumentMutation.isPending || hasExecutionInProcess 
                  ? "Cannot execute document" 
                  : "Execute Document"
                }
              >
                {executeDocumentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </DocumentActionButton>
              
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess={["edit", "create"]}
                requireAll={false}
              >
                <SectionSheet
                  selectedFile={selectedFile}
                  fullDocument={fullDocument}
                  isOpen={isSectionSheetOpen}
                  onOpenChange={setIsSectionSheetOpen}
                  isMobile={isMobile}
                  accessLevels={accessLevels}
                />
              </DocumentAccessControl>
              
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess={["edit", "create"]}
                requireAll={false}
              >
                <DependenciesSheet
                  selectedFile={selectedFile}
                  isOpen={isDependenciesSheetOpen}
                  onOpenChange={setIsDependenciesSheetOpen}
                  isMobile={isMobile}
                  accessLevels={accessLevels}
                />
              </DocumentAccessControl>
              
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess={["edit", "create"]}
                requireAll={false}
              >
                <ContextSheet
                  selectedFile={selectedFile}
                  isOpen={isContextSheetOpen}
                  onOpenChange={setIsContextSheetOpen}
                  isMobile={isMobile}
                  accessLevels={accessLevels}
                />
              </DocumentAccessControl>
              
              {/* Secondary Action Buttons */}
              {/* Execution Dropdown - only show for documents with executions */}
              {selectedFile.type === 'document' && documentExecutions?.length > 0 && (
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess="read"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="read"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors text-xs"
                        title="Switch Version"
                      >
                        <span className="font-medium">
                          {(() => {
                            if (!documentExecutions) return 'v1';
                            // Use selectedExecutionId if available, otherwise use documentContent.execution_id (the default loaded execution)
                            const targetId = selectedExecutionId || documentContent?.execution_id;
                            const selectedExecution = documentExecutions.find((exec: any) => exec.id === targetId);
                            if (selectedExecution?.name) {
                              return selectedExecution.name.length > 15 ? `${selectedExecution.name.substring(0, 15)}...` : selectedExecution.name;
                            }
                            // Fallback to version number if no name
                            const sortedExecutions = [...documentExecutions].sort((a: { created_at: string }, b: { created_at: string }) => 
                              parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                            );
                            const index = sortedExecutions.findIndex((exec: any) => exec.id === targetId);
                            return index !== -1 ? `v${sortedExecutions.length - index}` : 'v1';
                          })()
                          }
                        </span>
                      </DocumentActionButton>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900">Document Versions</p>
                      <p className="text-xs text-gray-500">Select a version to view</p>
                    </div>
                    {documentExecutions
                      .sort((a: { created_at: string }, b: { created_at: string }) => 
                        parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                      )
                      .map((execution: { id: string; created_at: string; name: string; status: string }, index: number) => {
                        const isSelected = selectedExecutionInfo ? 
                          selectedExecutionId === execution.id :
                          (execution.status === 'approved' || (index === 0 && !documentExecutions.find((e: any) => e.status === 'approved')));
                        const isApproved = execution.status === 'approved';
                        const isLatest = index === 0;
                        
                        return (
                          <DropdownMenuItem 
                            key={execution.id} 
                            className={`hover:cursor-pointer p-2 transition-colors ${
                              isSelected ? 'bg-blue-50 border-l-2 border-[#4464f7]' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedExecutionId(execution.id);
                              // Invalidate all document-content queries and refetch with new execution ID
                              queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                              queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, execution.id] });
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  isSelected ? 'text-[#4464f7]' : 'text-gray-900'
                                }`}>
                                  {execution.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isLatest && (
                                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    <span>Latest</span>
                                  </div>
                                )}
                                {isApproved && (
                                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approved</span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="flex items-center gap-1 text-[#4464f7] text-xs font-medium">
                                    <Eye className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
                </DocumentAccessControl>
              )}
              
              {/* Edit Button */}
              <DocumentActionButton
                accessLevels={accessLevels}
                requiredAccess="edit"
                onClick={openEditDialog}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                title="Edit Document"
              >
                <Edit3 className="h-4 w-4" />
              </DocumentActionButton>

              {/* Clone Button - only show if there's an execution to clone */}
              {selectedExecutionId && (
                <DocumentActionButton
                  accessLevels={accessLevels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  onClick={() => setTimeout(() => openCloneDialog(), 0)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                  title="Clone Execution"
                >
                  <Copy className="h-4 w-4" />
                </DocumentActionButton>
              )}
              
              {/* Export Dropdown */}
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess="read"
              >
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
              </DocumentAccessControl>
              
              {/* Delete Options */}
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess="delete"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors rounded-full"
                      title="Delete Options"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {selectedExecutionId && (
                      <DropdownMenuItem
                        onClick={() => setTimeout(() => openDeleteDialog('execution'), 0)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Version
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setTimeout(() => openDeleteDialog('document'), 0)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                    >
                      <FileX className="mr-2 h-4 w-4" />
                      Delete Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DocumentAccessControl>

              {/* Approve/Disapprove Buttons - show conditionally based on execution status */}
              {(() => {
                if (!selectedExecutionId) return null;
                
                // Check execution status from multiple sources to ensure reliability
                const currentExecution = documentExecutions?.find((e: { id: string; }) => e.id === selectedExecutionId);
                const statusFromExecutionInfo = selectedExecutionInfo?.status;
                const statusFromDocumentExecutions = currentExecution?.status;
                const actualStatus = statusFromExecutionInfo || statusFromDocumentExecutions;
                
                // Show Approve button when status is 'completed'
                if (actualStatus === 'completed') {
                  return (
                    <DocumentActionButton
                      accessLevels={accessLevels}
                      requiredAccess="approve"
                      onClick={() => setTimeout(() => openApproveDialog(), 0)}
                      size="sm"
                      variant="ghost"
                      disabled={approveMutation.isPending}
                      className={`h-8 w-8 p-0 transition-colors rounded-full ${
                        approveMutation.isPending 
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-green-600 hover:bg-green-50 hover:text-green-700 hover:cursor-pointer'
                      }`}
                      title={approveMutation.isPending ? "Approving..." : "Approve Execution"}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </DocumentActionButton>
                  );
                }
                
                // Show Disapprove button when status is 'approved'
                if (actualStatus === 'approved') {
                  return (
                    <DocumentActionButton
                      accessLevels={accessLevels}
                      requiredAccess="approve"
                      onClick={() => setTimeout(() => openDisapproveDialog(), 0)}
                      size="sm"
                      variant="ghost"
                      disabled={disapproveMutation.isPending}
                      className={`h-8 w-8 p-0 transition-colors rounded-full ${
                        disapproveMutation.isPending 
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer'
                      }`}
                      title={disapproveMutation.isPending ? "Converting to Draft..." : "Convert to Draft"}
                    >
                      {disapproveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </DocumentActionButton>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        )}
        
        
        {/* Header Section */}
        {!isMobile && (
        <div className="bg-white border-b border-gray-200 shadow-sm py-4 px-5 md:px-6 z-10 flex-shrink-0" data-desktop-header>
          <div className="space-y-3 md:space-y-4">
            {/* Title and Type Section */}
            {!isMobile && (
              <div className="flex items-start md:items-center gap-3 md:gap-4 flex-col md:flex-row">
                <div className="flex flex-col gap-2 flex-1">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 break-words min-w-0">{selectedFile.name}</h1>
                  {selectedExecutionInfo && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="font-medium text-gray-900">
                        {selectedExecutionInfo.name || `Version ${selectedExecutionInfo.status}`}
                      </span>
                      <span>•</span>
                      <span>{selectedExecutionInfo.formattedDate}</span>
                      {selectedExecutionInfo.isLatest && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Latest
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {documentContent?.document_type && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: documentContent.document_type.color }}
                      />
                      {documentContent.document_type.name}
                    </div>
                  )}
                  {fullDocument?.template_name && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-xs font-medium text-blue-700 border border-blue-200">
                      <FileCode className="w-2 h-2" />
                      {fullDocument.template_name}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            
            {/* Action Buttons Section */}
            <div className="flex items-start gap-2 flex-wrap">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg flex-wrap min-w-0">
              <DocumentActionButton
                accessLevels={accessLevels}
                requiredAccess={["create"]}
                requireAll={false}
                size="sm"
                onClick={handleCreateExecution}
                disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                className={executeDocumentMutation.isPending || hasExecutionInProcess
                  ? "h-8 px-3 bg-gray-300 text-gray-500 border-none cursor-not-allowed shadow-sm text-xs"
                  : "h-8 px-3 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer shadow-sm text-xs"
                }
                title={executeDocumentMutation.isPending || hasExecutionInProcess 
                  ? "Cannot execute document" 
                  : "Execute Document"
                }
              >
                {executeDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Execute
                  </>
                )}
              </DocumentActionButton>
                
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                >
                  <SectionSheet
                    selectedFile={selectedFile}
                    fullDocument={fullDocument}
                    isOpen={isSectionSheetOpen}
                    onOpenChange={setIsSectionSheetOpen}
                    accessLevels={accessLevels}
                  />
                </DocumentAccessControl>
                
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                >
                  <DependenciesSheet
                    selectedFile={selectedFile}
                    isOpen={isDependenciesSheetOpen}
                    onOpenChange={setIsDependenciesSheetOpen}
                    accessLevels={accessLevels}
                  />
                </DocumentAccessControl>
                
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                >
                  <ContextSheet
                    selectedFile={selectedFile}
                    isOpen={isContextSheetOpen}
                    onOpenChange={setIsContextSheetOpen}
                    accessLevels={accessLevels}
                  />
                </DocumentAccessControl>
              </div>
              
              {/* Secondary Actions Group */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg flex-wrap min-w-0">
                {/* Execution Dropdown - only show for documents with executions */}
                {selectedFile.type === 'document' && documentExecutions?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors text-xs"
                        title="Switch Version"
                      >
                        <span className="font-medium">
                          {(() => {
                            if (!documentExecutions) return 'v1';
                            // Use selectedExecutionId if available, otherwise use documentContent.execution_id (the default loaded execution)
                            const targetId = selectedExecutionId || documentContent?.execution_id;
                            const selectedExecution = documentExecutions.find((exec: any) => exec.id === targetId);
                            if (selectedExecution?.name) {
                              return selectedExecution.name.length > 20 ? `${selectedExecution.name.substring(0, 20)}...` : selectedExecution.name;
                            }
                            // Fallback to version number if no name
                            const sortedExecutions = [...documentExecutions].sort((a: { created_at: string }, b: { created_at: string }) => 
                              parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                            );
                            const index = sortedExecutions.findIndex((exec: any) => exec.id === targetId);
                            return index !== -1 ? `v${sortedExecutions.length - index}` : 'v1';
                          })()} 
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-900">Document Versions</p>
                        <p className="text-xs text-gray-500">Select a version to view</p>
                      </div>
                      {documentExecutions
                        .sort((a: { created_at: string }, b: { created_at: string }) => 
                          parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                        )
                        .map((execution: { id: string; created_at: string; name: string; status: string }, index: number) => {
                          const isSelected = selectedExecutionId === execution.id;
                          const isApproved = execution.status === 'approved';
                          const isLatest = index === 0;
                          
                          return (
                            <DropdownMenuItem 
                              key={execution.id} 
                              className={`hover:cursor-pointer p-2 transition-colors ${
                                isSelected ? 'bg-blue-50 border-l-2 border-[#4464f7]' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setSelectedExecutionId(execution.id);
                                // Invalidate all document-content queries and refetch with new execution ID
                                queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                                queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, execution.id] });
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    isSelected ? 'text-[#4464f7]' : 'text-gray-900'
                                  }`}>
                                    {execution.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {isLatest && (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                      <Clock className="w-3 h-3" />
                                      <span>Latest</span>
                                    </div>
                                  )}
                                  {isApproved && (
                                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Approved</span>
                                    </div>
                                  )}
                                  {isSelected && (
                                    <div className="flex items-center gap-1 text-[#4464f7] text-xs font-medium">
                                      <Eye className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Approve/Disapprove Buttons - Desktop Version - show conditionally based on execution status */}
                {(() => {
                  if (!selectedExecutionId) return null;
                  
                  const currentExecution = documentExecutions?.find((e: { id: string; }) => e.id === selectedExecutionId);
                  const statusFromExecutionInfo = selectedExecutionInfo?.status;
                  const statusFromDocumentExecutions = currentExecution?.status;
                  const actualStatus = statusFromExecutionInfo || statusFromDocumentExecutions;
                  
                  // Show Approve button when status is 'completed'
                  if (actualStatus === 'completed') {
                    return (
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="approve"
                        onClick={() => setTimeout(() => openApproveDialog(), 0)}
                        size="sm"
                        variant="ghost"
                        disabled={approveMutation.isPending}
                        className={`h-8 px-2.5 transition-colors ${
                          approveMutation.isPending 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                            : 'text-green-600 hover:bg-green-50 hover:text-green-700 hover:cursor-pointer'
                        }`}
                        title={approveMutation.isPending ? "Approving..." : "Approve Execution"}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </DocumentActionButton>
                    );
                  }
                  
                  // Show Disapprove button when status is 'approved'
                  if (actualStatus === 'approved') {
                    return (
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="approve"
                        onClick={() => setTimeout(() => openDisapproveDialog(), 0)}
                        size="sm"
                        variant="ghost"
                        disabled={disapproveMutation.isPending}
                        className={`h-8 px-2.5 transition-colors ${
                          disapproveMutation.isPending 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer'
                        }`}
                        title={disapproveMutation.isPending ? "Converting to Draft..." : "Convert to Draft"}
                      >
                        {disapproveMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </DocumentActionButton>
                    );
                  }
                  
                  return null;
                })()}

                {/* Execution Actions Group */}
                {/* Clone Button - Desktop - only show if there's an execution to clone */}
                {selectedExecutionId && (
                  <DocumentActionButton
                    accessLevels={accessLevels}
                    requiredAccess={["edit", "create"]}
                    requireAll={false}
                    onClick={() => setTimeout(() => openCloneDialog(), 0)}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                    title="Clone Execution"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </DocumentActionButton>
                )}
                
                

                {/* Separator between execution and document actions */}
                {selectedExecutionId && (
                  <div className="h-6 w-px bg-gray-200 mx-2"></div>
                )}

                {/* Document Actions Group */}
                <DocumentActionButton
                  accessLevels={accessLevels}
                  requiredAccess="edit"
                  onClick={openEditDialog}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                  title="Edit Document"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </DocumentActionButton>
                
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess="read"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
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
                </DocumentAccessControl>
                
                {/* Delete Options */}
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess="delete"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors"
                        title="Delete Options"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {selectedExecutionId && (
                        <DropdownMenuItem
                          onClick={() => setTimeout(() => openDeleteDialog('execution'), 0)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Version
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setTimeout(() => openDeleteDialog('document'), 0)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                      >
                        <FileX className="mr-2 h-4 w-4" />
                        Delete Document
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DocumentAccessControl>
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
                {/* Execution Status Banner - Show for any active execution */}
                {(() => {
                  // Show banner if user just started a new execution
                  if (currentExecutionId) {
                    return (
                      <ExecutionStatusBanner
                        executionId={currentExecutionId}
                        onExecutionComplete={(completedExecutionId) => {
                          console.log('🔄 Execution completed, updating to show new content...', completedExecutionId);
                          
                          // Clear the current execution ID since it's no longer running
                          setCurrentExecutionId(null);
                          
                          // Update selectedExecutionId to the completed execution so user sees the new content
                          if (completedExecutionId) {
                            console.log('🎯 Switching to completed execution:', completedExecutionId);
                            setSelectedExecutionId(completedExecutionId);
                          }
                          
                          // Remove all cached queries aggressively
                          queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                          queryClient.removeQueries({ queryKey: ['document', selectedFile?.id] });
                          queryClient.removeQueries({ queryKey: ['executions', selectedFile?.id] });
                          
                          // Invalidate queries once - they will refetch automatically
                          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                          queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                        }}
                        className="mb-4"
                      />
                    );
                  }
                  
                  // Show banner for any active execution (not just selected one)
                  const executions = documentContent?.executions || documentExecutions;
                  if (executions && Array.isArray(executions)) {
                    // Find any execution in active state (prioritize running > pending > queued)
                    const runningExecution = executions.find((exec: any) => exec.status === 'running');
                    const pendingExecution = executions.find((exec: any) => exec.status === 'pending');
                    const queuedExecution = executions.find((exec: any) => exec.status === 'queued');
                    const failedExecution = executions.find((exec: any) => exec.status === 'failed');
                    
                    const activeExecution = runningExecution || pendingExecution || queuedExecution || failedExecution;
                    
                    if (activeExecution && activeExecution.id !== currentExecutionId) {
                      return (
                        <ExecutionStatusBanner
                          executionId={activeExecution.id}
                          onExecutionComplete={(completedExecutionId) => {
                            console.log('🔄 Active execution completed, ensuring content refresh...', completedExecutionId);
                            
                            // Si la ejecución completada es diferente a la seleccionada, cambiar a la completada
                            if (completedExecutionId && completedExecutionId !== selectedExecutionId) {
                              console.log('🎯 Switching to completed execution:', completedExecutionId);
                              setSelectedExecutionId(completedExecutionId);
                            }
                            
                            // Remove all cached queries aggressively
                            queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                            queryClient.removeQueries({ queryKey: ['document', selectedFile?.id] });
                            queryClient.removeQueries({ queryKey: ['executions', selectedFile?.id] });
                            
                            // Force multiple waves of refresh to ensure content updates
                            // Invalidate queries once - they will refetch automatically
                            queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                            queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                          }}
                          className="mb-4"
                        />
                      );
                    }
                  }
                  
                  return null;
                })()}
                
                {/* Section Execution Status Banner - for individual section executions */}
                {sectionExecutionId && sectionExecutionId !== (currentExecutionId || activeExecutionId) && (
                  <ExecutionStatusBanner
                    executionId={sectionExecutionId}
                    onExecutionComplete={() => {
                      setSectionExecutionId(null);
                      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                    }}
                    className="mb-4"
                  />
                )}
                
                {isLoadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading document content...</span>
                  </div>
                ) : (
                  // Lógica mejorada para manejar diferentes estados de ejecución
                  (() => {
                    const executions = documentContent?.executions || documentExecutions;
                    const currentExecution = executions?.find((exec: any) => exec.id === selectedExecutionId);
                    
                    // PRIORIDAD: Si hay una ejecución seleccionada que está pending/running, mostrar estado apropiado
                    // independientemente de si hay contenido de otras ejecuciones
                    if (currentExecution && ['pending', 'running'].includes(currentExecution.status)) {
                      return (
                        <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
                          <Empty className="max-w-2xl">
                            <div className="p-8 text-center">
                              <EmptyIcon>
                                {currentExecution.status === 'running' ? (
                                  <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                ) : (
                                  <Clock className="h-12 w-12 text-amber-500" />
                                )}
                              </EmptyIcon>
                              <EmptyTitle>
                                {currentExecution.status === 'running' 
                                  ? 'Content is being generated' 
                                  : 'Execution is pending'
                                }
                              </EmptyTitle>
                              <EmptyDescription>
                                {currentExecution.status === 'running'
                                  ? 'Please wait while the document content is being generated. This may take a few minutes.'
                                  : 'This execution is waiting to start. Content will be available once the execution begins.'
                                }
                              </EmptyDescription>
                            </div>
                          </Empty>
                        </div>
                      );
                    }
                    
                    // Si no hay ejecuciones o no hay contenido (solo para casos sin execuciones activas)
                    if ((!documentExecutions || documentExecutions.length === 0) || (!documentContent?.content)) {
                      return (
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
                                  <DocumentActionButton
                                    accessLevels={accessLevels}
                                    requiredAccess={["edit", "create"]}
                                    requireAll={false}
                                    onClick={() => setIsSectionSheetOpen(true)}
                                    className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Sections
                                  </DocumentActionButton>
                                ) : (
                                  <>
                                    <Button
                                      onClick={handleCreateExecution}
                                      disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                                      className={executeDocumentMutation.isPending || hasExecutionInProcess
                                        ? "hover:cursor-not-allowed bg-gray-300 text-gray-500" 
                                        : "hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                                      }
                                    >
                                      {executeDocumentMutation.isPending ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Executing...
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="h-4 w-4 mr-2" />
                                          {hasNewPendingExecution ? "Start Execution" : hasPendingExecution ? "Continue Execution" : "Generate Content"}
                                        </>
                                      )}
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
                      );
                    }
                    
                    // Si hay contenido disponible, renderizar el contenido
                    if (documentContent?.content) {
                      return (
                        <div className="prose prose-gray max-w-full prose-sm md:prose-base">
                          {Array.isArray(documentContent.content) ? (
                            // New format: array of sections with separators
                            <>
                              {/* Add section button at the beginning */}
                              <SectionSeparator 
                                onAddSection={() => handleAddSectionAtPosition(-1)} 
                                index={-1}
                                isMobile={isMobile}
                                selectedFile={selectedFile}
                                accessLevels={accessLevels}
                              />
                              
                              {documentContent.content.map((section: ContentSection, index: number) => {
                          // Find the corresponding section in fullDocument to get the real section_id
                          // Using index-based mapping as sections should be in the same order
                          const correspondingSection = fullDocument?.sections?.[index];
                          const realSectionId = correspondingSection?.id;
                          
                          // Removed debug logging for performance
                          
                          return (
                            <div key={section.id}>
                              <div id={`section-${index}`}>
                                <SectionExecution 
                                  sectionExecution={{
                                    id: section.id, // This is the section_execution_id
                                    output: section.content,
                                    section_id: realSectionId // This is the real section_id from the document structure
                                  }}
                                  onUpdate={() => {
                                    // Refresh document content when section is updated
                                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                                  }}
                                  readyToEdit={true}
                                  sectionIndex={index}
                                  documentId={selectedFile?.id}
                                  executionId={selectedExecutionId || undefined}
                                  executionStatus={selectedExecutionInfo?.status}
                                  accessLevels={accessLevels}
                                  onExecutionStart={(executionIdForSection) => {
                                    // Set section execution for polling banner
                                    if (executionIdForSection) {
                                      setSectionExecutionId(executionIdForSection);
                                      console.log('Section execution started:', executionIdForSection);
                                    }
                                  }}
                                />
                              </div>
                              
                              {/* Add separator after each section */}
                              <SectionSeparator 
                                onAddSection={handleAddSectionAtPosition} 
                                index={index}
                                isLastSection={index === documentContent.content.length - 1}
                                isMobile={isMobile}
                                selectedFile={selectedFile}
                                accessLevels={accessLevels}
                              />
                            </div>
                          );
                              })}
                            </>
                          ) : (
                            // Legacy format: single string content
                            <Markdown>{documentContent.content}</Markdown>
                          )}
                        </div>
                      );
                    }
                    
                    // Si no hay contenido disponible, mostrar mensaje
                    return (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center">
                          <File className="h-16 w-16 mx-auto mb-4 opacity-40" style={{ color: '#4464f7' }} />
                          <p className="text-lg font-medium text-gray-500">No content available</p>
                          <p className="text-sm text-gray-400 mt-1 mb-6">This document doesn't have any content yet</p>
                          
                          <div className="flex gap-3 justify-center">
                            <DocumentActionButton
                              accessLevels={accessLevels}
                              requiredAccess={["edit", "create"]}
                              requireAll={false}
                              variant="outline" 
                              onClick={handleAddSection}
                              className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Section
                            </DocumentActionButton>
                            
                            <DocumentActionButton
                              accessLevels={accessLevels}
                              requiredAccess={["edit", "create"]}
                              requireAll={false}
                              variant="outline" 
                              onClick={handleCreateExecution}
                              disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                              className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {executeDocumentMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Execute Document
                                </>
                              )}
                            </DocumentActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  })()
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
      <Dialog open={isDirectSectionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDirectSectionDialogOpen(false)
        }
      }}>
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
              onValidationChange={setIsDirectSectionFormValid}
            />
          </div>
          
          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDirectSectionDialogOpen(false);
                setIsDirectSectionFormValid(false);
              }}
              disabled={addSectionMutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-section-form"
              disabled={addSectionMutation.isPending || !isDirectSectionFormValid}
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

      {/* Section Execution Creation Dialog */}
      <Dialog open={isSectionExecutionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsSectionExecutionDialogOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#4464f7]" />
              Add Section Content
            </DialogTitle>
            <DialogDescription>
              {afterFromSectionId 
                ? "Add new content after the selected section in this execution."
                : "Add new content at the beginning of this execution."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6">
            <AddSectionExecutionForm
              afterFromId={afterFromSectionId || undefined}
              onSubmit={handleSectionExecutionSubmit}
              isPending={createSectionExecutionMutation.isPending}
              onValidationChange={setIsSectionExecutionFormValid}
            />
          </div>
          
          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSectionExecutionDialogOpen(false);
                setAfterFromSectionId(null);
                setIsSectionExecutionFormValid(false);
              }}
              disabled={createSectionExecutionMutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-section-execution-form"
              disabled={createSectionExecutionMutation.isPending || !isSectionExecutionFormValid}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {createSectionExecutionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Section
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
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteType === 'execution' ? (
                <>
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Delete Version
                </>
              ) : (
                <>
                  <FileX className="h-5 w-5 text-red-600" />
                  Delete Document
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'execution' ? (
                selectedExecutionInfo ? (
                  <>
                    Are you sure you want to delete the execution from {selectedExecutionInfo.formattedDate}?
                    <br />
                    This action cannot be undone.
                  </>
                ) : (
                  "Are you sure you want to delete this execution? This action cannot be undone."
                )
              ) : (
                `Are you sure you want to delete "${selectedFile?.name}"? This will delete the document and all its executions. This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="hover:cursor-pointer"
              disabled={deleteExecutionMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteConfirm}
              disabled={deleteExecutionMutation.isPending}
            >
              {deleteExecutionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  {deleteType === 'execution' ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Version
                    </>
                  ) : (
                    <>
                      <FileX className="mr-2 h-4 w-4" />
                      Delete Document
                    </>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Confirmation AlertDialog */}
      <AlertDialog open={isCloneDialogOpen} onOpenChange={handleCloneDialogChange}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-[#4464f7]" />
              Clone Execution
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedExecutionInfo ? (
                <>
                  Are you sure you want to clone the execution <strong>{selectedExecutionInfo.name}</strong>?
                  <br />
                  This will create a new version that you can modify independently.
                </>
              ) : (
                "Are you sure you want to clone this execution? This will create a new version that you can modify independently."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="hover:cursor-pointer"
              disabled={cloneMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-[#4464f7] text-white hover:bg-[#3451e6]"
              onClick={handleCloneConfirm}
              disabled={cloneMutation.isPending}
            >
              {cloneMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Execution
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation AlertDialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={handleApproveDialogChange}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Approve Execution
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedExecutionInfo ? (
                <>
                  Are you sure you want to approve the execution <strong>{selectedExecutionInfo.name}</strong>?
                  <br />
                  This will mark the execution as approved and ready for production use.
                </>
              ) : (
                "Are you sure you want to approve this execution? This will mark it as approved and ready for production use."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="hover:cursor-pointer"
              disabled={approveMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-green-600 text-white hover:bg-green-700"
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve Execution
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disapprove Confirmation AlertDialog */}
      <AlertDialog open={isDisapproveDialogOpen} onOpenChange={handleDisapproveDialogChange}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              Draft execution
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedExecutionInfo ? (
                <>
                  Are you sure you want to convert the execution to draft <strong>{selectedExecutionInfo.name}</strong>?
                  <br />
                  This will mark the execution as draft and remove it from production use.
                </>
              ) : (
                "Are you sure you want to convert the execution to draft this execution? This will mark it as draft and remove it from production use."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="hover:cursor-pointer"
              disabled={disapproveMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
              onClick={handleDisapproveConfirm}
              disabled={disapproveMutation.isPending}
            >
              {disapproveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Draft execution
                </>
              )}
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
      
      {/* Execute Sheet */}
      <ExecuteSheet
        selectedFile={selectedFile}
        fullDocument={fullDocument}
        isOpen={isExecuteSheetOpen}
        onOpenChange={setIsExecuteSheetOpen}
        onSectionSheetOpen={() => setIsSectionSheetOpen(true)}
        onExecutionCreated={handleExecutionCreated}
        onExecutionComplete={handleExecutionComplete}
        isMobile={isMobile}
        selectedExecutionId={selectedExecutionId}
        disabled={hasExecutionInProcess || !fullDocument?.sections || fullDocument.sections.length === 0 || !defaultLLM?.id}
        disabledReason={
          hasExecutionInProcess 
            ? "There's already an execution running" 
            : !fullDocument?.sections || fullDocument.sections.length === 0 
              ? "This document needs sections before it can be executed" 
              : !defaultLLM?.id 
                ? "No default LLM available" 
                : undefined
        }
      />

      {/* Create Asset Dialog */}
      <CreateAssetDialog
        open={isCreateAssetDialogOpen}
        onOpenChange={setIsCreateAssetDialogOpen}
        folderId={currentFolderId}
        onAssetCreated={handleDocumentCreated}
      />
    </div>
  );
}

