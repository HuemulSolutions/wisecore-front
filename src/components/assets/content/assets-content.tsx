import { useMemo, useEffect, useState, useRef } from "react";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
// Import necesario para el icono Plus
import { File, Loader2, Download, Trash2, FileText, FileCode, Plus, Play, List, Edit3, FolderTree, FileIcon, Zap, Check, X, CheckCircle, Clock, Eye, Copy, FileX, BetweenHorizontalStart, AlertCircle, RefreshCw } from "lucide-react";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { createSectionExecution, type AddSectionExecutionRequest } from "@/services/section_execution";
import { OtherVersionExecutionBanner } from "@/components/execution/other-version-execution-banner";
import { ExecutionStatusBanner } from "@/components/execution/execution-status-banner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chatbot from "@/components/chatbot/chatbot";
import { DependenciesSheet, ContextSheet, TemplateConfigSheet, ExecuteSheet, SectionSheet } from "@/components/assets/content";
import { useIsMobile } from "@/hooks/use-mobile";
import { DocumentAccessControl, DocumentActionButton } from "@/components/assets/content/assets-access-control";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getDocumentContent, deleteDocument, getDocumentById } from "@/services/assets";
import { exportExecutionToMarkdown, exportExecutionToWord, executeDocument, approveExecution, disapproveExecution, cloneExecution, deleteExecution } from "@/services/executions";
import { getDefaultLLM } from "@/services/llms";
import { createSection, updateSectionsOrder } from "@/services/section";
import { getTemplateById } from "@/services/templates";
import { getCustomFieldDocumentsByDocument, createCustomFieldDocument, updateCustomFieldDocument, deleteCustomFieldDocument } from "@/services/custom-fieldds-documents";
import type { CustomFieldDocument } from "@/types/custom-fields-documents";
import { AddCustomFieldDocumentDialog } from "@/components/assets-custom-fields/assets-add-custom-field-dialog";
import { EditCustomFieldAssetDialog } from "@/components/assets-custom-fields/assets-edit-custom-field-dialog";
import { AddSectionDialog } from "@/components/assets/dialogs/assets-add-section-dialog";
import { AddSectionExecutionDialog } from "@/components/assets/dialogs/assets-add-section-execution-dialog";
import { CreateTemplateDialog } from "@/components/templates/templates-create-dialog";
import { CreateTemplateFromDocumentDialog } from "@/components/assets/dialogs/assets-create-template-from-document-dialog";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/assets/content/assets-table-of-contents";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import SectionExecution from "./assets-section";
import { formatApiDateTime, parseApiDate } from "@/lib/utils";
import { CustomWordExportDialog } from "@/components/assets/dialogs/assets-export-custom.word-dialog";
import { useNavKnowledgeActions } from "@/components/layout/nav-knowledge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import type { ContentSection, LibraryContentProps } from '@/types/assets';
import { CustomFieldsList } from './assets-custom-fields-list';

// Utilities and hooks
import { extractHeadingsFromSections, extractHeadings } from './utils/heading-utils';
import { SectionSeparator } from './components/SectionSeparator';
import { ContentErrorState } from './content-error-state';
// TODO: Integrate these hooks gradually to replace inline mutations
// import { useDocumentMutations } from './hooks/useDocumentMutations';
// import { useCustomFieldMutations } from './hooks/useCustomFieldMutations';
// import { useExecutionState } from './hooks/useExecutionState';



/**
 * AssetContent Component
 * 
 * Main component for displaying and managing document/template content.
 * Handles content rendering, version management, executions, and user interactions.
 */
export function AssetContent({ 
  selectedFile, 
  selectedExecutionId, 
  setSelectedExecutionId, 
  setSelectedFile,
  onRefresh,
  currentFolderId,
  onToggleSidebar,
  onPreserveScroll
}: LibraryContentProps) {
  // ============================================================================
  // HOOKS AND CONTEXT
  // ============================================================================
  const queryClient = useQueryClient();
  const navigate = useOrgNavigate();
  const isMobile = useIsMobile();
  const { selectedOrganizationId } = useOrganization();
  const { canCreate, canAccessTemplates, canAccessAssets } = useUserPermissions();
  const { handleCreateAsset: openCreateAssetDialog } = useNavKnowledgeActions();
  
  // Scroll restoration hook - maintains scroll position across re-renders
  const scrollRestoration = useScrollRestoration(
    selectedFile?.id ? `asset-content-${selectedFile.id}` : 'asset-content-default'
  );
  
  // ============================================================================
  // STATE - ON-DEMAND LOADING
  // ============================================================================
  const [needsFullDocument, setNeedsFullDocument] = useState(false);
  const [needsDefaultLLM, setNeedsDefaultLLM] = useState(false);
  
  // Ref to track if we've already synced selectedExecutionId for this document
  const hasInitializedExecutionRef = useRef<string | null>(null);
  
  // Ref to track if we're currently creating a new execution (to prevent premature state reset)
  const isCreatingExecutionRef = useRef<boolean>(false);
  
  // Removed debug logging to improve performance

  // Si no hay organización seleccionada, no renderizar nada
  if (!selectedOrganizationId) {
    return null;
  }

  // Mutation for direct section creation
  const addSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      // Preserve scroll position before mutation
      preserveScrollPosition();
      
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
      toast.success("Section created successfully");
    },
  });

  // Mutation for section execution creation
  const createSectionExecutionMutation = useMutation({
    mutationFn: async (sectionData: AddSectionExecutionRequest) => {
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
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
      
      setIsSectionExecutionDialogOpen(false);
      setAfterFromSectionId(null);
      toast.success("Section added successfully");
    },
  });

  // Mutation para ejecutar documento directamente
  const executeDocumentMutation = useMutation({
    mutationFn: async ({ documentId, instructions }: { documentId: string; instructions?: string }) => {
      // Preserve scroll position before execution
      preserveScrollPosition();
      
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
  });

  // Mutation for approve execution
  const approveMutation = useMutation({
    mutationFn: async () => {
      // Preserve scroll position before approval
      preserveScrollPosition();
      
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return approveExecution(selectedExecutionId, selectedOrganizationId);
    },
    onSuccess: () => {
      // Set the execution as approving to start polling
      if (selectedExecutionId) {
        setApprovingExecutionId(selectedExecutionId);
      }
      
      // Don't show success toast yet - wait for 'approved' status
      // Invalidate queries to fetch updated status
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    onError: () => {
      setApprovingExecutionId(null);
    },
  });

  // Mutation for disapprove execution
  const disapproveMutation = useMutation({
    mutationFn: async () => {
      // Preserve scroll position before disapproval
      preserveScrollPosition();
      
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
  });

  // Mutation for deleting execution
  const deleteExecutionMutation = useMutation({
    mutationFn: async () => {
      // Preserve scroll position before deletion
      preserveScrollPosition();
      
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
  });

  // Mutation for clone execution
  const cloneMutation = useMutation({
    mutationFn: async () => {
      // Preserve scroll position before cloning
      preserveScrollPosition();
      
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
  });

  // Mutation for creating custom field document
  const createCustomFieldDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      return createCustomFieldDocument(data);
    },
    onSuccess: (createdField) => {
      // Don't close dialog or show success yet - wait for image upload if needed
      // Refresh will happen after image upload completes
      if (createdField.data_type !== 'image') {
        queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFile?.id] });
        setIsAddCustomFieldDocumentDialogOpen(false);
        toast.success('Custom field document created successfully!');
      }
    },
  });

  // Mutation for updating custom field document
  const updateCustomFieldDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return updateCustomFieldDocument(id, data);
    },
    onSuccess: () => {
      // Refresh custom fields data
      queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFile?.id] });
      setIsEditCustomFieldDocumentDialogOpen(false);
      setSelectedCustomFieldDocument(null);
      toast.success('Custom field document updated successfully!');
    },
  });

  // Mutation for deleting custom field document
  const deleteCustomFieldDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteCustomFieldDocument(id);
    },
    onSuccess: () => {
      // Refresh custom fields data
      queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFile?.id] });
      setIsDeleteCustomFieldDocumentDialogOpen(false);
      setCustomFieldDocumentToDelete(null);
      toast.success('Custom field document deleted successfully!');
    },
  });

  // Helper function to preserve scroll position
  const preserveScrollPosition = () => {
    scrollRestoration.saveScrollPosition();
  };

  // ============================================================================
  // STATE - DIALOG AND SHEET VISIBILITY
  // ============================================================================
  // Confirmation dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'document' | 'execution' | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);

  // Sidebar and sheets
  const [activeTab, setActiveTab] = useState<'toc' | 'custom-fields'>('toc');
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
  
  // ============================================================================
  // STATE - EXECUTION TRACKING
  // ============================================================================
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [currentExecutionMode, setCurrentExecutionMode] = useState<'full' | 'single' | 'from' | 'full-single'>('full');
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | undefined>(undefined);
  const [dismissedExecutionBanners, setDismissedExecutionBanners] = useState<Set<string>>(new Set());
  const [, setSectionExecutionId] = useState<string | null>(null);
  const [approvingExecutionId, setApprovingExecutionId] = useState<string | null>(null);
  
  // ============================================================================
  // STATE - SECTION MANAGEMENT
  // ============================================================================
  const [isDirectSectionDialogOpen, setIsDirectSectionDialogOpen] = useState(false);
  const [sectionInsertPosition, setSectionInsertPosition] = useState<number | undefined>(undefined);
  const [isSectionExecutionDialogOpen, setIsSectionExecutionDialogOpen] = useState(false);
  const [afterFromSectionId, setAfterFromSectionId] = useState<string | null>(null);
  
  // ============================================================================
  // STATE - TEMPLATE MANAGEMENT
  // ============================================================================
  const [isCreateTemplateSheetOpen, setIsCreateTemplateSheetOpen] = useState(false);
  const [isCreateTemplateFromDocumentDialogOpen, setIsCreateTemplateFromDocumentDialogOpen] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [isTemplateConfigSheetOpen, setIsTemplateConfigSheetOpen] = useState(false);
  
  // ============================================================================
  // STATE - EXECUTION SHEET
  // ============================================================================
  const [isExecuteSheetOpen, setIsExecuteSheetOpen] = useState(false);
  const [executionContext, setExecutionContext] = useState<{ 
    type: 'header' | 'section'; 
    sectionIndex?: number; 
    sectionId?: string;
  } | null>(null);
  
  // ============================================================================
  // STATE - EXPORT
  // ============================================================================
  const [isCustomWordExportDialogOpen, setIsCustomWordExportDialogOpen] = useState(false);
  
  // ============================================================================
  // STATE - CUSTOM FIELDS
  // ============================================================================
  const [isAddCustomFieldDocumentDialogOpen, setIsAddCustomFieldDocumentDialogOpen] = useState(false);
  const [isEditCustomFieldDocumentDialogOpen, setIsEditCustomFieldDocumentDialogOpen] = useState(false);
  const [customFieldEditMode, setCustomFieldEditMode] = useState<"content" | "configuration">("configuration");
  const [selectedCustomFieldDocument, setSelectedCustomFieldDocument] = useState<CustomFieldDocument | null>(null);
  const [isDeleteCustomFieldDocumentDialogOpen, setIsDeleteCustomFieldDocumentDialogOpen] = useState(false);
  const [customFieldDocumentToDelete, setCustomFieldDocumentToDelete] = useState<CustomFieldDocument | null>(null);
  const [isDeletingCustomFieldDocument, setIsDeletingCustomFieldDocument] = useState(false);
  const [uploadingImageFieldId, setUploadingImageFieldId] = useState<string | null>(null);
  const [isRefreshingCustomFields, setIsRefreshingCustomFields] = useState(false);
  
  // Clear created template when component unmounts or selectedFile changes
  useEffect(() => {
    if (createdTemplate && selectedFile) {
      setCreatedTemplate(null);
    }
  }, [selectedFile, createdTemplate]);

  // Clear current execution ID when selectedFile or selectedExecutionId changes to prevent showing banner for wrong file/version
  // BUT: Don't reset if we're in the middle of creating a new execution
  useEffect(() => {
    if (!isCreatingExecutionRef.current) {
      setCurrentExecutionId(null);
      setCurrentExecutionMode('full');
      setCurrentSectionIndex(undefined);
      setSectionExecutionId(null);
      setDismissedExecutionBanners(new Set());
      setExecutionContext(null);
    }
  }, [selectedFile?.id, selectedExecutionId]);



  // Handle execution created from Execute Sheet
  const handleExecutionCreated = (executionId: string, mode: 'full' | 'single' | 'from' | 'full-single', sectionIndex?: number) => {
    // Preserve scroll position before any changes
    preserveScrollPosition();
    
    console.log('📥 Asset Content - Execution created received:', {
      executionId,
      mode,
      sectionIndex,
      willShowSectionFeedback: mode === 'single' || mode === 'from'
    });
    
    // CRITICAL: Set tracking variables FIRST, before any query operations
    // Mark that we're done creating the execution
    isCreatingExecutionRef.current = false;
    
    setCurrentExecutionId(executionId);
    setCurrentExecutionMode(mode);
    setCurrentSectionIndex(sectionIndex);
    
    // Force reset of execution status queries to ensure fresh data for new execution
    // resetQueries will refetch immediately for any mounted components with these queries
    queryClient.resetQueries({ queryKey: ['execution-status', executionId] });
    queryClient.resetQueries({ queryKey: ['execution-sections-status', executionId] });
    
    // Determine behavior based on execution mode:
    // - full/full-single: Creates NEW version, user stays on current version
    // - single/from: Modifies EXISTING version, user stays to see the changes
    if (mode === 'full' || mode === 'full-single') {
      // NEW VERSION: Don't automatically switch to the new execution
      // The user decides if they want to switch to the new version
      console.log('New version created:', executionId, 'User stays on current version:', selectedExecutionId);
      
      // Just invalidate queries to refresh execution list and show banners
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
    } else if (mode === 'single' || mode === 'from') {
      // EDIT EXISTING: Stay on the same version but refresh its content
      console.log('Existing version modified:', executionId, 'Refreshing current version:', selectedExecutionId);
      
      // Invalidate all related queries to refresh content
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    }
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
      preserveScrollPosition();
      setIsSectionSheetOpen(true);
    }
  };

  // Handle add section at specific position
  const handleAddSectionAtPosition = (afterIndex?: number) => {
    if (selectedFile && selectedFile.type === 'document') {
      // Si hay contenido de documento (execution exists), crear section_execution
      if (documentContent?.content && Array.isArray(documentContent.content) && selectedExecutionId) {
        console.log(`Adding section execution after index: ${afterIndex}`);
        setNeedsFullDocument(true);
        
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
      } else {
        // Si no hay execution, crear sección normal
        console.log(`Adding section after index: ${afterIndex}`);
        setSectionInsertPosition(afterIndex);
        setIsDirectSectionDialogOpen(true);
      }
    }
  };

  // Handle direct section creation submission
  const handleDirectSectionSubmit = (values: any) => {
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
      ...values,
      document_id: values.document_id || selectedFile?.id || '',
      order
    };
    addSectionMutation.mutate(sectionData);
  };

  // Handle section execution creation submission
  const handleSectionExecutionSubmit = (values: AddSectionExecutionRequest) => {
    createSectionExecutionMutation.mutate(values);
  };

  // Handle create new execution - abrir Execute Sheet
  const handleCreateExecution = (context?: { type: 'header' | 'section', sectionIndex?: number, sectionId?: string }) => {
    // Mark that we're starting to create an execution
    isCreatingExecutionRef.current = true;
    if (selectedFile && selectedFile.type === 'document') {
      preserveScrollPosition();
      setNeedsFullDocument(true);
      setNeedsDefaultLLM(true);

      // Si se ejecuta desde una sección, asegurar que el índice y modo estén bien definidos para el feedback
      if (context?.type === 'section' && typeof context.sectionIndex === 'number') {
        setCurrentSectionIndex(context.sectionIndex);
        setCurrentExecutionMode('single'); // O 'from' si aplica, según la acción
        // setExecutionContext y setIsExecuteSheetOpen deben ejecutarse después para asegurar el render correcto
        setTimeout(() => {
          setExecutionContext(context);
          setIsExecuteSheetOpen(true);
        }, 0);
      } else {
        setExecutionContext(context || { type: 'header' });
        setIsExecuteSheetOpen(true);
      }
    }
  };

  // Wrapper functions for different contexts
  const handleCreateExecutionFromHeader = () => handleCreateExecution({ type: 'header' });
  const handleCreateExecutionFromSection = (sectionIndex: number, sectionId?: string) => 
    () => handleCreateExecution({ type: 'section', sectionIndex, sectionId });

  // Fetch document content when a document is selected
  // Note: The backend automatically returns the approved execution or the latest one if none is approved
  // When selectedExecutionId is provided, it fetches that specific historical version
  const { 
    data: documentContent, 
    isLoading: isLoadingContent,
    isError: isContentError,
    error: contentError,
    refetch: refetchContent
  } = useQuery({
    queryKey: selectedExecutionId 
      ? ['document-content', selectedFile?.id, selectedExecutionId] 
      : ['document-content', selectedFile?.id],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedOrganizationId!, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
    // Remove automatic polling - let the ExecutionStatusBanner handle status updates
    // and trigger refresh through query invalidation
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch full document details only when needed (sections management, sheet operations)
  const { data: fullDocument, isLoading: isLoadingFullDocument } = useQuery({
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

  // Fetch custom fields for the document
  const { data: customFieldsData, isLoading: isLoadingCustomFields } = useQuery({
    queryKey: ['custom-field-documents', selectedFile?.id],
    queryFn: () => getCustomFieldDocumentsByDocument({
      document_id: selectedFile!.id,
      page: 1,
      page_size: 100
    }),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId && activeTab === 'custom-fields',
    staleTime: 60000, // Cache for 1 minute
  });

  // Poll current execution status for 'single' and 'from' modes to detect completion
  const { data: currentExecutionStatus } = useQuery({
    queryKey: ['execution-status', currentExecutionId],
    queryFn: async () => {
      const { getExecutionStatus } = await import('@/services/executions');
      return getExecutionStatus(currentExecutionId!, selectedOrganizationId!);
    },
    enabled: !!currentExecutionId && !!selectedOrganizationId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'),
    refetchInterval: (query) => {
      // Stop polling if execution is in a terminal state
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchOnWindowFocus: false,
  });

  // Poll approving execution status to detect when approval completes
  const { data: approvingExecutionStatus } = useQuery({
    queryKey: ['execution-status', approvingExecutionId],
    queryFn: async () => {
      const { getExecutionStatus } = await import('@/services/executions');
      return getExecutionStatus(approvingExecutionId!, selectedOrganizationId!);
    },
    enabled: !!approvingExecutionId && !!selectedOrganizationId,
    refetchInterval: (query) => {
      // Stop polling if execution is no longer in 'approving' state
      const status = query.state.data?.status;
      if (status !== 'approving') {
        return false;
      }
      return 1000; // Poll every 1 second for approval
    },
    refetchOnWindowFocus: false,
  });

  // Effect to refresh content when 'single' or 'from' execution completes
  // BUT keep tracking states so feedback can still display
  useEffect(() => {
    if (currentExecutionStatus && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) {
      const status = currentExecutionStatus.status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        console.log(`🎯 Section execution finished with status: ${status}, refreshing content but keeping feedback visible`);
        
        // Preserve scroll position before refreshing content
        preserveScrollPosition();
        
        // Add to dismissed banners to prevent ExecutionStatusBanner from showing for this execution
        if (currentExecutionId) {
          setDismissedExecutionBanners(prev => new Set([...prev, currentExecutionId]));
        }
        
        // Refresh content - but DON'T clear tracking states
        // The SectionExecutionFeedback needs these states to continue showing the feedback
        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      }
    }
  }, [currentExecutionStatus?.status, currentExecutionMode, selectedFile?.id, queryClient, currentExecutionId]);

  // Effect to detect when approval process completes
  useEffect(() => {
    if (approvingExecutionStatus && approvingExecutionId) {
      const status = approvingExecutionStatus.status;
      
      if (status === 'approved') {
        console.log(`✅ Execution approved successfully: ${approvingExecutionId}`);
        
        // Preserve scroll position
        preserveScrollPosition();
        
        // Show success message
        toast.success('Execution approved successfully!');
        
        // Clear approving state
        setApprovingExecutionId(null);
        
        // Refresh all data to show approved status
        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      } else if (status !== 'approving') {
        // If status changed to something other than 'approving' or 'approved' (e.g., error state)
        console.log(`⚠️ Approval process ended with unexpected status: ${status}`);
        setApprovingExecutionId(null);
        
        // Refresh data anyway to reflect current state
        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      }
    }
  }, [approvingExecutionStatus?.status, approvingExecutionId, selectedFile?.id, queryClient]);

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
      ['running', 'queued', 'pending', 'processing', 'approving'].includes(execution.status)
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

  // Get the correct access levels - use documentContent first (authoritative), fallback to selectedFile
  const accessLevels = useMemo(() => {
    return documentContent?.access_levels || selectedFile?.access_levels || [];
  }, [documentContent?.access_levels, selectedFile?.access_levels]);

  // Get active executions on other versions (not currently viewed)
  const otherVersionActiveExecutions = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    
    if (!executions || !selectedExecutionId) {
      return [];
    }

    return executions.filter((execution: any) => {
      // Exclude the currently selected version
      if (execution.id === selectedExecutionId) return false;
      
      // For single/from modes, also exclude the currentExecutionId (same as selected)
      if (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) {
        if (execution.id === currentExecutionId) return false;
      }
      
      // Only show running/pending executions that haven't been dismissed
      return ['running', 'pending'].includes(execution.status) &&
             !dismissedExecutionBanners.has(execution.id);
    });
  }, [documentContent?.executions, documentExecutions, selectedExecutionId, dismissedExecutionBanners, currentExecutionId, currentExecutionMode]);

  // Check if the currently selected version is actively executing
  const isSelectedVersionExecuting = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    
    if (!executions || !selectedExecutionId) {
      return null;
    }

    const selectedExecution = executions.find((execution: any) => 
      execution.id === selectedExecutionId && 
      ['running', 'pending'].includes(execution.status)
    );

    return selectedExecution || null;
  }, [documentContent?.executions, documentExecutions, selectedExecutionId]);

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
      // No specific execution selected manually
      // Use the current execution returned by the API (documentContent.execution_id)
      // This is the approved execution or the most recent one
      selectedExecution = documentContent?.execution_id 
        ? executions.find((execution: any) => execution.id === documentContent.execution_id)
        : null;
      
      // Fallback: if no execution_id in response, try approved or first
      if (!selectedExecution) {
        selectedExecution = executions.find((execution: any) => execution.status === 'approved') || executions[0];
      }
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
      hasInitializedExecutionRef.current = null; // Reset ref when leaving document
      return;
    }

    // Reset selectedExecutionId when switching to a different document
    // This allows the default call (without execution_id) to return the approved/latest execution
    if (selectedExecutionId) {
      setSelectedExecutionId(null);
    }
    
    // Reset the initialization ref when document changes
    hasInitializedExecutionRef.current = null;
  }, [selectedFile?.id]);

  // Sync selectedExecutionId with the execution that was loaded by the backend
  // This only happens ONCE per document to set the initial state, preventing duplicate API calls
  useEffect(() => {
    // Only sync if:
    // 1. We have document content with an execution_id
    // 2. selectedExecutionId is currently null (no manual selection yet)
    // 3. We haven't already initialized for this document
    if (
      selectedFile?.type === 'document' &&
      documentContent?.execution_id &&
      !selectedExecutionId &&
      hasInitializedExecutionRef.current !== selectedFile.id
    ) {
      console.log('🔄 Syncing selectedExecutionId with loaded execution:', documentContent.execution_id);
      
      // Copy the already-loaded data to the new queryKey to prevent duplicate API call
      queryClient.setQueryData(
        ['document-content', selectedFile.id, documentContent.execution_id],
        documentContent
      );
      
      setSelectedExecutionId(documentContent.execution_id);
      hasInitializedExecutionRef.current = selectedFile.id;
    }
  }, [selectedFile?.id, selectedFile?.type, documentContent?.execution_id, selectedExecutionId, queryClient]);
  
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

  const sectionOptionsForExecutionDialog = useMemo(() => {
    const optionsById = new Map<string, string>();

    if (fullDocument?.sections?.length) {
      fullDocument.sections.forEach((section: { id?: string; name?: string }) => {
        if (!section.id) return;
        optionsById.set(section.id, section.name || "Untitled section");
      });
    }

    if (Array.isArray(documentContent?.content)) {
      documentContent.content.forEach((section: ContentSection, index: number) => {
        if (!section.section_id) return;

        const existingName = optionsById.get(section.section_id);
        if (existingName && existingName !== "Untitled section") {
          return;
        }

        optionsById.set(
          section.section_id,
          section.section_name || `Section ${index + 1}`
        );
      });
    }

    return Array.from(optionsById.entries()).map(([id, name]) => ({ id, name }));
  }, [documentContent?.content, fullDocument?.sections]);

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
  
  // Handle export to custom word
  const handleExportCustomWord = () => {
    setIsCustomWordExportDialogOpen(true);
  };

  // Handle add custom field document
  const handleAddCustomFieldDocument = () => {
    setIsAddCustomFieldDocumentDialogOpen(true);
  };

  // Handle refresh custom fields
  const handleRefreshCustomFields = async () => {
    setIsRefreshingCustomFields(true);
    try {
      await queryClient.refetchQueries({ queryKey: ['custom-field-documents', selectedFile?.id] });
      toast.success('Custom fields refreshed');
    } finally {
      setIsRefreshingCustomFields(false);
    }
  };

  // Handle edit custom field document
  const handleEditCustomFieldDocument = (field: CustomFieldDocument) => {
    setSelectedCustomFieldDocument(field);
    setCustomFieldEditMode("configuration");
    setIsEditCustomFieldDocumentDialogOpen(true);
  };

  // Handle edit custom field document content
  const handleEditCustomFieldDocumentContent = (field: CustomFieldDocument) => {
    setSelectedCustomFieldDocument(field);
    setCustomFieldEditMode("content");
    setIsEditCustomFieldDocumentDialogOpen(true);
  };

  // Handle create custom field document submission
  const handleCreateCustomFieldDocument = async (data: any) => {
    const result = await createCustomFieldDocumentMutation.mutateAsync(data);
    // If it's an image type, keep dialog open for upload, but return the created field
    return result;
  };

  // Handle update custom field document submission
  const handleUpdateCustomFieldDocument = async (id: string, data: any) => {
    return updateCustomFieldDocumentMutation.mutateAsync({ id, data });
  };

  // Handle image upload tracking
  const handleImageUploadStart = (fieldId: string) => {
    setUploadingImageFieldId(fieldId);
  };

  const handleImageUploadComplete = () => {
    setUploadingImageFieldId(null);
    // Refresh custom fields data to show the uploaded image
    queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFile?.id] });
    // Close the dialog and show success message
    setIsAddCustomFieldDocumentDialogOpen(false);
    toast.success('Custom field document created successfully!');
  };

  // Handle delete custom field document
  const handleDeleteCustomFieldDocument = (field: CustomFieldDocument) => {
    setCustomFieldDocumentToDelete(field);
    setIsDeleteCustomFieldDocumentDialogOpen(true);
  };

  // Handle confirm delete custom field document
  const handleConfirmDeleteCustomFieldDocument = async () => {
    if (!customFieldDocumentToDelete) return;

    setIsDeletingCustomFieldDocument(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    try {
      await Promise.all([
        deleteCustomFieldDocumentMutation.mutateAsync(customFieldDocumentToDelete.id),
        minDelay
      ]);
    } finally {
      setIsDeletingCustomFieldDocument(false);
    }
  };

  // Handle cancel delete custom field document
  const handleCancelDeleteCustomFieldDocument = () => {
    if (!isDeletingCustomFieldDocument) {
      setIsDeleteCustomFieldDocumentDialogOpen(false);
      setCustomFieldDocumentToDelete(null);
    }
  };

  function openDeleteDialog(type: 'document' | 'execution') {
    preserveScrollPosition();
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setIsDeleteDialogOpen(false);
    setDeleteType(null);
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      // Preserve scroll when closing dialog
      onPreserveScroll?.();
      closeDeleteDialog();
    }
  };

  function openCloneDialog() {
    preserveScrollPosition();
    setIsCloneDialogOpen(true);
  }

  function closeCloneDialog() {
    setIsCloneDialogOpen(false);
  }

  const handleCloneDialogChange = (open: boolean) => {
    if (open) {
      openCloneDialog();
    } else {
      onPreserveScroll?.();
      closeCloneDialog();
    }
  };

  function openApproveDialog() {
    preserveScrollPosition();
    setIsApproveDialogOpen(true);
  }

  function closeApproveDialog() {
    setIsApproveDialogOpen(false);
  }

  const handleApproveDialogChange = (open: boolean) => {
    if (open) {
      openApproveDialog();
    } else {
      onPreserveScroll?.();
      closeApproveDialog();
    }
  };

  function openDisapproveDialog() {
    preserveScrollPosition();
    setIsDisapproveDialogOpen(true);
  }

  function closeDisapproveDialog() {
    setIsDisapproveDialogOpen(false);
  }

  const handleDisapproveDialogChange = (open: boolean) => {
    if (open) {
      openDisapproveDialog();
    } else {
      onPreserveScroll?.();
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
        
        // Defer navigation and refresh so the AlertDialog exit animation
        // (200ms) finishes before the large re-render cascade triggered by
        // route changes and PermissionsProvider.  Without this delay the
        // portal DOM is reconciled mid-animation, producing a visible flash.
        setTimeout(() => {
          navigate('/asset', { replace: true });
          onRefresh();
          queryClient.invalidateQueries({ queryKey: ['library'] });
          queryClient.invalidateQueries({ queryKey: ['document-content'] });
        }, 300);
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
    // Preserve scroll position before opening dialog
    preserveScrollPosition();
    // Apertura diferida para que primero se cierre el dropdown y no dispare outside click sobre el dialog recién montado
    setTimeout(() => setIsEditDialogOpen(true), 0);
  };

  if (!selectedFile) {
    return (
      <>
        <div className="h-full bg-gray-50 flex items-center justify-center p-4">
          <Empty>
            <div className="p-8 text-center">
              <EmptyIcon>
                <FileIcon className="h-12 w-12" />
              </EmptyIcon>
              <EmptyTitle>Welcome to Assets</EmptyTitle>
              <EmptyDescription>
                {(canAccessTemplates && canCreate('template')) || (canAccessAssets && canCreate('asset'))
                  ? "Create your first document or select an existing one to get started with your document workflow."
                  : "Select an existing asset to get started or contact your administrator for permissions to create new assets."
                }
              </EmptyDescription>
              <EmptyActions>
                {canAccessTemplates && canCreate('template') && (
                  <Button
                    onClick={() => {
                      onPreserveScroll?.();
                      setIsCreateTemplateSheetOpen(true);
                    }}
                    variant="outline"
                    className="hover:cursor-pointer"
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
                {canAccessAssets && canCreate('asset') && (
                  <Button 
                    onClick={() => {
                      onPreserveScroll?.();
                      openCreateAssetDialog(currentFolderId);
                    }}
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

        {/* Template Creation Dialog */}
        <CreateTemplateDialog
          open={isCreateTemplateSheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              onPreserveScroll?.();
              setIsCreateTemplateSheetOpen(false);
            } else {
              setIsCreateTemplateSheetOpen(true);
            }
          }}
          organizationId={selectedOrganizationId}
          onTemplateCreated={(template) => {
            setCreatedTemplate(template);
            setIsCreateTemplateSheetOpen(false);
            // Invalidate templates query to refresh the template list
            queryClient.invalidateQueries({ queryKey: ['templates', selectedOrganizationId] });
            // Open template configuration sheet
            setTimeout(() => {
              setIsTemplateConfigSheetOpen(true);
            }, 300);
          }}
        />
        
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
    <>
    <ResizablePanelGroup direction="horizontal" className=" bg-gray-50">
      {/* Document Content */}
      <ResizablePanel defaultSize={80}>
        <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header with Toggle */}
        {isMobile && !isContentError && (
          <div className="bg-white border-b border-gray-200 shadow-sm py-2 px-4 z-20 shrink-0 min-h-20" data-mobile-header>
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
                {isLoadingContent && !documentContent ? (
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {documentContent?.document_name || selectedFile.name}
                      </span>
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
                        {documentContent?.template_name && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700 border border-blue-200">
                            <FileCode className="w-1.5 h-1.5" />
                            {documentContent.template_name}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Always reserve space for execution info to prevent layout shift */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 min-h-4.5">
                      {selectedExecutionInfo && (
                        <>
                          <span className="font-medium text-xs text-gray-900">{selectedExecutionInfo.name}</span>
                          <span>•</span>
                          <span className="text-xs">{selectedExecutionInfo.formattedDate}</span>
                          {selectedExecutionInfo.isLatest && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                              Latest
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {/* Document metadata for mobile */}
                    {(documentContent?.internal_code || documentContent?.created_by_user || documentContent?.updated_by_user) && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {documentContent?.internal_code && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-700">
                            <FileText className="w-2.5 h-2.5" />
                            <span className="font-medium">Code:</span>
                            <span>{documentContent.internal_code}</span>
                          </div>
                        )}
                        {documentContent?.created_by_user && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-xs text-purple-700">
                            <span className="font-medium">By:</span>
                            <span>{documentContent.created_by_user.name} {documentContent.created_by_user.last_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                      <p>{isTocSidebarOpen ? "Hide sidebar" : "Show sidebar"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Mobile Action Buttons - Icon Only */}
            {isLoadingContent && !documentContent ? (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ) : (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 animate-in fade-in duration-300">
              <DocumentActionButton
                accessLevels={accessLevels}
                requiredAccess={["create"]}
                requireAll={false}
                checkGlobalPermissions={true}
                resource="asset"
                size="sm"
                onClick={handleCreateExecutionFromHeader}
                disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                className={executeDocumentMutation.isPending || hasExecutionInProcess
                  ? "h-8 w-8 p-0 bg-gray-300 text-gray-500 border-none cursor-not-allowed shadow-sm rounded-full" 
                  : "h-8 w-8 p-0 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer shadow-sm rounded-full"
                }
                title={executeDocumentMutation.isPending || hasExecutionInProcess 
                  ? "Cannot execute while another execution is in process" 
                  : "Execute New Version"
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
                checkGlobalPermissions={true}
                resource="asset"
              >
                <SectionSheet
                  selectedFile={selectedFile}
                  fullDocument={fullDocument}
                  isOpen={isSectionSheetOpen}
                  onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    if (!open) preserveScrollPosition();
                    setIsSectionSheetOpen(open);
                  }}
                  isMobile={isMobile}
                  accessLevels={accessLevels}
                  executionId={selectedExecutionId}
                  executionInfo={selectedExecutionInfo}
                />
              </DocumentAccessControl>
              
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess={["edit", "create"]}
                requireAll={false}
                checkGlobalPermissions={true}
                resource="asset"
              >
                <DependenciesSheet
                  selectedFile={selectedFile}
                  isOpen={isDependenciesSheetOpen}
                  onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    if (!open) preserveScrollPosition();
                    setIsDependenciesSheetOpen(open);
                  }}
                  isMobile={isMobile}
                  accessLevels={accessLevels}
                />
              </DocumentAccessControl>
              
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess={["edit", "create"]}
                requireAll={false}
                checkGlobalPermissions={true}
                resource="asset"
              >
                <ContextSheet
                  selectedFile={selectedFile}
                  isOpen={isContextSheetOpen}
                  onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    if (!open) preserveScrollPosition();
                    setIsContextSheetOpen(open);
                  }}
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
                        // Determine if this execution is the currently selected/displayed one
                        const currentExecutionId = selectedExecutionId || documentContent?.execution_id;
                        const isSelected = execution.id === currentExecutionId;
                        const isApproved = execution.status === 'approved';
                        const isLatest = index === 0;
                        
                        return (
                          <DropdownMenuItem 
                            key={execution.id} 
                            className={`hover:cursor-pointer p-2 transition-colors ${
                              isSelected ? 'bg-blue-50 border-l-2 border-[#4464f7]' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              // Preserve scroll position before changing execution
                              preserveScrollPosition();
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
                checkGlobalPermissions={true}
                resource="asset"
                onClick={openEditDialog}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                title="Edit Document"
              >
                <Edit3 className="h-4 w-4" />
              </DocumentActionButton>

              {/* Create Template from Document - only show if document has no template */}
              {!documentContent?.template_name && canCreate('template') && (
                <DocumentActionButton
                  accessLevels={accessLevels}
                  requiredAccess="edit"
                  checkGlobalPermissions={true}
                  resource="asset"
                  onClick={() => setIsCreateTemplateFromDocumentDialogOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                  title="Create Template from Asset"
                >
                  <FileCode className="h-4 w-4" />
                </DocumentActionButton>
              )}

              {/* Clone Button - only show if there's an execution to clone */}
              {selectedExecutionId && (
                <DocumentActionButton
                  accessLevels={accessLevels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  checkGlobalPermissions={true}
                  resource="asset"
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
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportMarkdown(), 0)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportWord(), 0)}>
                      <FileCode className="mr-2 h-4 w-4" />
                      Export as Word
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportCustomWord(), 0)}>
                      <FileCode className="mr-2 h-4 w-4" />
                      Export as Custom Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DocumentAccessControl>
              
              {/* Delete Options */}
              <DocumentAccessControl
                accessLevels={accessLevels}
                requiredAccess="delete"
                checkGlobalPermissions={true}
                resource="asset"
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
                        onSelect={() => setTimeout(() => openDeleteDialog('execution'), 0)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Version
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => setTimeout(() => openDeleteDialog('document'), 0)}
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
                // Determine the current execution to show buttons for
                let currentExecution = null;
                let actualStatus = null;
                
                if (selectedExecutionId) {
                  // User has manually selected a specific execution
                  currentExecution = documentExecutions?.find((e: { id: string; }) => e.id === selectedExecutionId);
                  const statusFromExecutionInfo = selectedExecutionInfo?.status;
                  const statusFromDocumentExecutions = currentExecution?.status;
                  actualStatus = statusFromExecutionInfo || statusFromDocumentExecutions;
                } else if (documentExecutions?.length > 0) {
                  // No specific execution selected, determine which execution to show buttons for
                  // Priority: execution_id from documentContent -> approved execution -> first execution
                  if (documentContent?.execution_id) {
                    currentExecution = documentExecutions.find((e: any) => e.id === documentContent.execution_id);
                  }
                  if (!currentExecution) {
                    currentExecution = documentExecutions.find((e: any) => e.status === 'approved') || documentExecutions[0];
                  }
                  actualStatus = currentExecution?.status;
                }
                
                if (!currentExecution || !actualStatus) {
                  return null;
                }
                
                // Show Approve button when status is 'completed'
                if (actualStatus === 'completed') {
                  return (
                    <DocumentActionButton
                      accessLevels={accessLevels}
                      requiredAccess="approve"
                      checkGlobalPermissions={true}
                      resource="asset"
                      onClick={() => {
                        // Ensure selectedExecutionId is set to the current execution before opening dialog
                        if (!selectedExecutionId && currentExecution) {
                          setSelectedExecutionId(currentExecution.id);
                        }
                        setTimeout(() => openApproveDialog(), 0);
                      }}
                      size="sm"
                      variant="ghost"
                      disabled={approveMutation.isPending || approvingExecutionId === currentExecution.id}
                      className={`h-8 w-8 p-0 transition-colors rounded-full ${
                        approveMutation.isPending || approvingExecutionId === currentExecution.id
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-green-600 hover:bg-green-50 hover:text-green-700 hover:cursor-pointer'
                      }`}
                      title={approveMutation.isPending || approvingExecutionId === currentExecution.id ? "Approving..." : "Approve Execution"}
                    >
                      {approveMutation.isPending || approvingExecutionId === currentExecution.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </DocumentActionButton>
                  );
                }
                
                // Show spinner when status is 'approving'
                if (actualStatus === 'approving') {
                  return (
                    <DocumentActionButton
                      accessLevels={accessLevels}
                      requiredAccess="approve"
                      checkGlobalPermissions={true}
                      resource="asset"
                      size="sm"
                      variant="ghost"
                      disabled={true}
                      className="h-8 w-8 p-0 transition-colors rounded-full text-green-600 bg-green-50 cursor-not-allowed"
                      title="Approving..."
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </DocumentActionButton>
                  );
                }
                
                // Show Disapprove button when status is 'approved'
                if (actualStatus === 'approved') {
                  return (
                    <DocumentActionButton
                      accessLevels={accessLevels}
                      requiredAccess="approve"
                      checkGlobalPermissions={true}
                      resource="asset"
                      onClick={() => {
                        // Ensure selectedExecutionId is set to the current execution before opening dialog
                        if (!selectedExecutionId && currentExecution) {
                          setSelectedExecutionId(currentExecution.id);
                        }
                        setTimeout(() => openDisapproveDialog(), 0);
                      }}
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
              })()}            </div>
            )}
          </div>
        )}
        
        {/* Header Section */}
        {!isMobile && !isContentError && (
        <div className="bg-white border-b border-gray-200 shadow-sm py-3 px-5 md:px-6 z-10 shrink-0" data-desktop-header>
          <div className="space-y-2.5">
            {/* Title and Type Section */}
            {!isMobile && (
              <div className="flex items-start justify-between gap-4">
                {isLoadingContent && !documentContent ? (
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5">
                      <Skeleton className="h-6 w-52" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3.5 w-1" />
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between gap-2.5 flex-wrap">
                      <h1 className="text-lg font-semibold text-gray-900 wrap-break-word">{documentContent?.document_name || selectedFile.name}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        {documentContent?.document_type && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                            <div 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ backgroundColor: documentContent.document_type.color }}
                            />
                            {documentContent.document_type.name}
                          </div>
                        )}
                        {documentContent?.template_name && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700">
                            <FileCode className="w-3 h-3" />
                            {documentContent.template_name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata Row - Combined */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                      {selectedExecutionInfo && (
                        <>
                          <span className="font-medium text-gray-900">
                            {selectedExecutionInfo.name || `Version ${selectedExecutionInfo.status}`}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{selectedExecutionInfo.formattedDate}</span>
                          {selectedExecutionInfo.isLatest && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                              Latest
                            </span>
                          )}
                          {(documentContent?.internal_code || documentContent?.created_by_user) && (
                            <span className="text-gray-400">•</span>
                          )}
                        </>
                      )}
                      {documentContent?.internal_code && (
                        <>
                          <span className="font-medium">Code:</span>
                          <span>{documentContent.internal_code}</span>
                        </>
                      )}
                      {documentContent?.created_by_user && (
                        <>
                          {documentContent?.internal_code && <span className="text-gray-400">•</span>}
                          <span className="font-medium">By:</span>
                          <span>{documentContent.created_by_user.name} {documentContent.created_by_user.last_name}</span>
                        </>
                      )}
                      {documentContent?.updated_by_user && documentContent?.updated_by_user.id !== documentContent?.created_by_user?.id && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="font-medium">Updated:</span>
                          <span>{documentContent.updated_by_user.name} {documentContent.updated_by_user.last_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons Section */}
            {isLoadingContent && !documentContent ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg">
                  <Skeleton className="h-7 w-[106px] rounded-md" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-7 w-18 rounded-md" />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg">
                  <Skeleton className="h-7 w-10 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                </div>
              </div>
            ) : (
            <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-300">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
              <DocumentActionButton
                accessLevels={accessLevels}
                requiredAccess={["create", "edit"]}
                requireAll={false}
                size="sm"
                onClick={handleCreateExecutionFromHeader}
                disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                className={executeDocumentMutation.isPending || hasExecutionInProcess
                  ? "h-7 px-3 bg-gray-300 text-gray-500 border-none cursor-not-allowed text-xs"
                  : "h-7 px-3 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer text-xs"
                }
                title={executeDocumentMutation.isPending || hasExecutionInProcess 
                  ? "Cannot execute a new version while another execution is in process" 
                  : "Execute New Version"
                }
              >
                {executeDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1.5" />
                    New Version
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
                    executionId={selectedExecutionId}
                    executionInfo={selectedExecutionInfo}
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
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
                {/* Execution Dropdown - only show for documents with executions */}
                {selectedFile.type === 'document' && documentExecutions?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors text-xs"
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
                                // Preserve scroll position before changing execution
                                onPreserveScroll?.();
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
                  // Determine the current execution to show buttons for
                  let currentExecution = null;
                  let actualStatus = null;
                  
                  if (selectedExecutionId) {
                    // User has manually selected a specific execution
                    currentExecution = documentExecutions?.find((e: { id: string; }) => e.id === selectedExecutionId);
                    const statusFromExecutionInfo = selectedExecutionInfo?.status;
                    const statusFromDocumentExecutions = currentExecution?.status;
                    actualStatus = statusFromExecutionInfo || statusFromDocumentExecutions;
                  } else if (documentExecutions?.length > 0) {
                    // No specific execution selected, determine which execution to show buttons for
                    // Priority: execution_id from documentContent -> approved execution -> first execution
                    if (documentContent?.execution_id) {
                      currentExecution = documentExecutions.find((e: any) => e.id === documentContent.execution_id);
                    }
                    if (!currentExecution) {
                      currentExecution = documentExecutions.find((e: any) => e.status === 'approved') || documentExecutions[0];
                    }
                    actualStatus = currentExecution?.status;
                  }
                  
                  if (!currentExecution || !actualStatus) {
                    return null;
                  }
                  
                  // Show Approve button when status is 'completed'
                  if (actualStatus === 'completed') {
                    return (
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="approve"
                        checkGlobalPermissions={true}
                        resource="asset"
                        onClick={() => {
                          // Ensure selectedExecutionId is set to the current execution before opening dialog
                          if (!selectedExecutionId && currentExecution) {
                            setSelectedExecutionId(currentExecution.id);
                          }
                          setTimeout(() => openApproveDialog(), 0);
                        }}
                        size="sm"
                        variant="ghost"
                        disabled={approveMutation.isPending || approvingExecutionId === currentExecution.id}
                        className={`h-8 px-2.5 transition-colors ${
                          approveMutation.isPending || approvingExecutionId === currentExecution.id
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                            : 'text-green-600 hover:bg-green-50 hover:text-green-700 hover:cursor-pointer'
                        }`}
                        title={approveMutation.isPending || approvingExecutionId === currentExecution.id ? "Approving..." : "Approve Execution"}
                      >
                        {approveMutation.isPending || approvingExecutionId === currentExecution.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </DocumentActionButton>
                    );
                  }
                  
                  // Show spinner when status is 'approving'
                  if (actualStatus === 'approving') {
                    return (
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="approve"
                        checkGlobalPermissions={true}
                        resource="asset"
                        size="sm"
                        variant="ghost"
                        disabled={true}
                        className="h-8 px-2.5 transition-colors text-green-600 bg-green-50 cursor-not-allowed"
                        title="Approving..."
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </DocumentActionButton>
                    );
                  }
                  
                  // Show Disapprove button when status is 'approved'
                  if (actualStatus === 'approved') {
                    return (
                      <DocumentActionButton
                        accessLevels={accessLevels}
                        requiredAccess="approve"
                        checkGlobalPermissions={true}
                        resource="asset"
                        onClick={() => {
                          // Ensure selectedExecutionId is set to the current execution before opening dialog
                          if (!selectedExecutionId && currentExecution) {
                            setSelectedExecutionId(currentExecution.id);
                          }
                          setTimeout(() => openDisapproveDialog(), 0);
                        }}
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
                    checkGlobalPermissions={true}
                    resource="asset"
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
                  <div className="h-5 w-px bg-gray-200 mx-1.5"></div>
                )}

                {/* Document Actions Group */}
                <DocumentActionButton
                  accessLevels={accessLevels}
                  requiredAccess="edit"
                  checkGlobalPermissions={true}
                  resource="asset"
                  onClick={openEditDialog}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                  title="Edit Document"
                >
                  <Edit3 className="h-3 w-3" />
                </DocumentActionButton>

                {/* Create Template from Document - only show if document has no template */}
                {!documentContent?.template_name && canCreate('template') && (
                  <DocumentActionButton
                    accessLevels={accessLevels}
                    requiredAccess="edit"
                    checkGlobalPermissions={true}
                    resource="asset"
                    onClick={() => setIsCreateTemplateFromDocumentDialogOpen(true)}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                    title="Create Template from Asset"
                  >
                    <FileCode className="h-3 w-3" />
                  </DocumentActionButton>
                )}
                
                {/* <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess=""
                > */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                        title="Export Options"
                      >
                        <Download className="h-3 w-3" />
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
                      <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportCustomWord(), 0)}>
                        <FileCode className="mr-2 h-4 w-4" />
                        Export as Custom Word
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                {/* </DocumentAccessControl> */}
                
                {/* Delete Options */}
                <DocumentAccessControl
                  accessLevels={accessLevels}
                  requiredAccess="delete"
                  checkGlobalPermissions={true}
                  resource="asset"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors"
                        title="Delete Options"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {selectedExecutionId && (
                        <DropdownMenuItem
                          onSelect={() => setTimeout(() => openDeleteDialog('execution'), 0)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Version
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onSelect={() => setTimeout(() => openDeleteDialog('document'), 0)}
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
            )}
            
          </div>
        </div>
        )}

        {/* Content Section - Now with ScrollArea and scroll restoration */}
        <div className="flex-1 bg-white min-w-0 overflow-hidden">
          <ScrollArea className="h-full max-w-full">
            <div 
              ref={scrollRestoration.viewportRef}
              className="py-4 md:py-5 px-4 md:px-6"
            >
            {selectedFile.type === 'document' ? (
              <>
                {/* Other Version Execution Banners - includes full/full-single modes */}
                {otherVersionActiveExecutions.length > 0 && (
                  <div className="sticky top-0 z-50 mb-4 space-y-2">
                    {otherVersionActiveExecutions.map((execution: any) => (
                      <OtherVersionExecutionBanner
                        key={execution.id}
                        executionId={execution.id}
                        executionName={execution.name || `Version ${execution.id.substring(0, 8)}`}
                        onDismiss={() => {
                          setDismissedExecutionBanners(prev => new Set(prev).add(execution.id));
                        }}
                        onViewVersion={() => {
                          // Preserve scroll position before changing execution
                          preserveScrollPosition();
                          setSelectedExecutionId(execution.id);
                          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, execution.id] });
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Current Version Execution Banner - when viewing the version being generated */}
                {/* Don't show banner for single/from modes - they use section feedback instead */}
                {isSelectedVersionExecuting && 
                 !dismissedExecutionBanners.has(isSelectedVersionExecuting.id) && 
                 !(currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) && (
                  <div className="sticky top-0 z-50 mb-4">
                    <ExecutionStatusBanner
                      executionId={isSelectedVersionExecuting.id}
                      onExecutionComplete={() => {
                        console.log('🔄 Current version execution completed, refreshing content...');
                        
                        // Invalidate and refetch all relevant queries
                        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['execution-status', isSelectedVersionExecuting.id] });
                        
                        // Refetch immediately
                        queryClient.refetchQueries({ queryKey: ['document-content', selectedFile?.id, selectedExecutionId] });
                      }}
                    />
                  </div>
                )}
                
                {isLoadingContent ? (
                  // Show skeleton loader with consistent height to prevent layout shift
                  <div className="space-y-6 animate-pulse min-h-150">
                    {/* Title skeleton */}
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    
                    {/* Paragraph skeletons */}
                    <div className="space-y-3 pt-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                    
                    {/* Section separator */}
                    <div className="h-px bg-gray-200 my-8"></div>
                    
                    {/* Another section */}
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="space-y-3 pt-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    
                    {/* Section separator */}
                    <div className="h-px bg-gray-200 my-8"></div>
                    
                    {/* Another section */}
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-3 pt-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                    </div>
                    
                    {/* Loading indicator at the bottom */}
                    <div className="flex items-center justify-center pt-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading document content...</span>
                    </div>
                  </div>
                ) : isContentError ? (
                  // Show error state when content fails to load
                  <ContentErrorState 
                    error={contentError}
                    onRetry={() => refetchContent()}
                  />
                ) : isSelectedVersionExecuting && !dismissedExecutionBanners.has(isSelectedVersionExecuting.id) && !(currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) ? (
                  // Show skeleton when viewing a version that is currently executing (full/full-single mode ONLY)
                  <div className="space-y-6 min-h-150">
                    {/* Skeleton for document content */}
                    <div className="animate-pulse space-y-4">
                      {/* Title skeleton */}
                      <div className="h-8 bg-blue-200 rounded w-3/4"></div>
                      
                      {/* Paragraph skeletons */}
                      <div className="space-y-3 pt-4">
                        <div className="h-4 bg-blue-200 rounded"></div>
                        <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                        <div className="h-4 bg-blue-200 rounded w-4/6"></div>
                      </div>
                      
                      {/* Section separator */}
                      <div className="h-px bg-blue-200 my-8"></div>
                      
                      {/* Another section */}
                      <div className="h-6 bg-blue-200 rounded w-2/3"></div>
                      <div className="space-y-3 pt-4">
                        <div className="h-4 bg-blue-200 rounded"></div>
                        <div className="h-4 bg-blue-200 rounded w-4/5"></div>
                        <div className="h-4 bg-blue-200 rounded w-3/5"></div>
                        <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                      </div>
                      
                      {/* Section separator */}
                      <div className="h-px bg-blue-200 my-8"></div>
                      
                      {/* Another section */}
                      <div className="h-6 bg-blue-200 rounded w-1/2"></div>
                      <div className="space-y-3 pt-4">
                        <div className="h-4 bg-blue-200 rounded"></div>
                        <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                        <div className="h-4 bg-blue-200 rounded w-4/6"></div>
                        <div className="h-4 bg-blue-200 rounded w-3/5"></div>
                      </div>
                      
                      {/* Section separator */}
                      <div className="h-px bg-blue-200 my-8"></div>
                      
                      {/* Another section */}
                      <div className="h-6 bg-blue-200 rounded w-3/5"></div>
                      <div className="space-y-3 pt-4">
                        <div className="h-4 bg-blue-200 rounded"></div>
                        <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                        <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Loading indicator at the bottom */}
                      <div className="flex items-center justify-center pt-8">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm text-blue-600 font-medium">Generating document content...</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Lógica mejorada para manejar diferentes estados de ejecución
                  (() => {
                    // Check if the current execution has failed
                    const hasFailedExecution = selectedExecutionInfo?.status === 'failed';
                    
                    // Si no hay ejecuciones o no hay contenido
                    if ((!documentExecutions || documentExecutions.length === 0) || (!documentContent?.content)) {
                      return (
                        <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
                          <Empty className="max-w-full">
                            <div className="p-8 text-center">
                              {hasFailedExecution ? (
                                <>
                                  <div className="max-w-full mx-auto">
                                    <div className="bg-linear-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
                                      {/* Icon Container with Animation */}
                                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-4 border-red-200">
                                        <AlertCircle className="h-8 w-8 text-red-600 animate-pulse" />
                                      </div>
                                      
                                      {/* Title */}
                                      <h3 className="text-2xl font-bold text-red-900 mb-3">
                                        Execution Failed
                                      </h3>
                                      
                                      {/* Description */}
                                      <p className="text-base text-red-800/90 mb-6 leading-relaxed max-w-full mx-auto">
                                        The AI couldn't generate content for this document. Please try again or check your sections configuration.
                                      </p>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <DocumentActionButton
                                          accessLevels={accessLevels}
                                          requiredAccess={["create"]}
                                          requireAll={false}
                                          onClick={handleCreateExecutionFromHeader}
                                          disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                                          size="lg"
                                          className={executeDocumentMutation.isPending || hasExecutionInProcess
                                            ? "hover:cursor-not-allowed bg-gray-300 text-gray-500" 
                                            : "hover:cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                                          }
                                        >
                                          {executeDocumentMutation.isPending ? (
                                            <>
                                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                              Retrying...
                                            </>
                                          ) : (
                                            <>
                                              <RefreshCw className="h-5 w-5 mr-2" />
                                              Retry Execution
                                            </>
                                          )}
                                        </DocumentActionButton>
                                        <DocumentActionButton
                                          accessLevels={accessLevels}
                                          requiredAccess={["edit", "create"]}
                                          requireAll={false}
                                          onClick={() => {
                                            preserveScrollPosition();
                                            setIsSectionSheetOpen(true);
                                          }}
                                          variant="outline"
                                          size="lg"
                                          className="border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
                                        >
                                          <Edit3 className="h-5 w-5 mr-2" />
                                          Edit Sections
                                        </DocumentActionButton>
                                      </div>
                                      
                                      {/* Additional Help Text */}
                                      <p className="text-xs text-red-600/70 mt-6">
                                        Common issues: API errors, invalid prompts, or missing dependencies
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <EmptyIcon>
                                    <Zap className="h-12 w-12" />
                                  </EmptyIcon>
                                  <EmptyTitle>Setup {documentContent?.document_name || selectedFile.name}</EmptyTitle>
                                  <EmptyDescription>
                                    {fullDocument?.sections?.length > 0 
                                      ? "Your document is ready! You can now generate content with AI, add more sections, or configure dependencies."
                                      : "Start building your document by adding sections. Sections help structure your content and guide the AI generation process."
                                    }
                                  </EmptyDescription>
                                  {!hasFailedExecution && (
                                    <EmptyActions>
                                      {fullDocument?.sections?.length === 0 ? (
                                        <DocumentActionButton
                                          accessLevels={accessLevels}
                                          requiredAccess={["edit", "create"]}
                                          requireAll={false}
                                          onClick={() => setIsSectionSheetOpen(true)}
                                          className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                                        >
                                          <BetweenHorizontalStart className="h-4 w-4 mr-2" />
                                          Add Sections
                                        </DocumentActionButton>
                                      ) : (
                                        <>
                                          <DocumentActionButton
                                            accessLevels={accessLevels}
                                            requiredAccess={["create"]}
                                            requireAll={false}
                                            onClick={handleCreateExecutionFromHeader}
                                            disabled={executeDocumentMutation.isPending || hasExecutionInProcess}
                                            className={executeDocumentMutation.isPending || hasExecutionInProcess
                                              ? "hover:cursor-not-allowed bg-gray-300 text-gray-500" 
                                              : "bg-[#4464f7] hover:bg-[#3451e6]"
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
                                          </DocumentActionButton>
                                          <DocumentActionButton
                                            accessLevels={accessLevels}
                                            requiredAccess={["edit", "create"]}
                                            requireAll={false}
                                            onClick={() => {
                                              onPreserveScroll?.();
                                              setIsSectionSheetOpen(true);
                                            }}
                                            variant="outline"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add More Sections
                                          </DocumentActionButton>
                                        </>
                                      )}
                                    </EmptyActions>
                                  )}
                                </>
                              )}
                            </div>
                          </Empty>
                        </div>
                      );
                    }
                    
                    // Si hay contenido disponible, renderizar el contenido
                    if (documentContent?.content) {
                      return (
                        <div className="prose prose-gray prose-sm md:prose-base max-w-full">
                          {Array.isArray(documentContent.content) ? (
                            // New format: array of sections with separators
                            <>
                              {/* Add section button at the beginning */}
                              <SectionSeparator 
                                onAddSection={() => handleAddSectionAtPosition(-1)} 
                                index={-1}
                                isMobile={isMobile}
                                accessLevels={accessLevels}
                              />
                              
                              {documentContent.content.map((section: ContentSection, index: number) => {
                          const realSectionId = section.section_id;
                          
                          // Removed debug logging for performance
                          
                          return (
                            <div key={section.id}>
                              <div id={`section-${index}`} className="relative">
                                <SectionExecution 
                                  sectionExecution={{
                                    id: section.id,
                                    output: section.content,
                                    section_id: realSectionId
                                  }}
                                  onUpdate={() => {
                                    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                                  }}
                                  readyToEdit={true}
                                  sectionIndex={index}
                                  documentId={selectedFile?.id}
                                  executionId={
                                    (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))
                                      ? currentExecutionId
                                      : (selectedExecutionId || undefined)
                                  }
                                  executionStatus={
                                    (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))
                                      ? (currentExecutionStatus?.status || 'running')
                                      : selectedExecutionInfo?.status
                                  }
                                  executionMode={currentExecutionMode}
                                  showExecutionFeedback={
                                    !!(currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from') && (
                                      currentExecutionMode === 'single'
                                        ? index === currentSectionIndex
                                        : currentSectionIndex !== undefined && index >= currentSectionIndex
                                    ))
                                  }
                                  accessLevels={accessLevels}
                                  onExecutionStart={(executionIdForSection) => {
                                    if (executionIdForSection) {
                                      setSectionExecutionId(executionIdForSection);
                                    }
                                  }}
                                  onOpenExecuteSheet={handleCreateExecutionFromSection(index, realSectionId)}
                                  sectionType={section.section_type}
                                  sectionName={section.section_name}
                                />
                              </div>
                              
                              {/* Add separator after each section */}
                              <SectionSeparator
                                onAddSection={handleAddSectionAtPosition}
                                index={index}
                                isLastSection={index === documentContent.content.length - 1}
                                isMobile={isMobile}
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
                      <div className="flex items-center justify-center h-full min-h-100">
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
                              <BetweenHorizontalStart className="h-4 w-4 mr-2" />
                              Add Section
                            </DocumentActionButton>
                            
                            <DocumentActionButton
                              accessLevels={accessLevels}
                              requiredAccess={["edit", "create"]}
                              requireAll={false}
                              checkGlobalPermissions={true}
                              variant="outline" 
                              onClick={handleCreateExecutionFromHeader}
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
                                  Execute New Version
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
          </ScrollArea>
        </div>
        </div>
      </ResizablePanel>

      {/* Table of Contents Sidebar - only show for documents with content and not during full/full-single executions */}
      {selectedFile.type === 'document' && documentContent?.content && tocItems.length > 0 && 
       (!isSelectedVersionExecuting || (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))) && (
        <>
          <ResizableHandle/>
          <ResizablePanel defaultSize={20}>
            <div className="flex flex-col h-full bg-white border-l">
              <div className="flex flex-col pt-3">
                <div className="px-2 pb-2">
                  <div className="grid w-full grid-cols-2 h-8 bg-gray-50 rounded-md p-0.5">
                    <button 
                      onClick={() => setActiveTab('toc')}
                      className={`text-xs py-1 px-1 h-6 rounded-sm transition-all truncate hover:cursor-pointer ${
                        activeTab === 'toc' 
                          ? 'bg-white shadow-sm text-gray-900' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Content
                    </button>
                    <button 
                      onClick={() => setActiveTab('custom-fields')}
                      className={`text-xs py-1 px-1 h-6 rounded-sm transition-all truncate hover:cursor-pointer ${
                        activeTab === 'custom-fields' 
                          ? 'bg-white shadow-sm text-gray-900' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Custom Fields
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
                {activeTab === 'toc' ? (
                  <TableOfContents items={tocItems} />
                ) : (
                  <CustomFieldsList 
                    customFields={customFieldsData?.data || []} 
                    isLoading={isLoadingCustomFields}
                    onAdd={handleAddCustomFieldDocument}
                    onEdit={handleEditCustomFieldDocument}
                    onEditContent={handleEditCustomFieldDocumentContent}
                    onDelete={handleDeleteCustomFieldDocument}
                    onRefresh={handleRefreshCustomFields}
                    uploadingImageFieldId={uploadingImageFieldId}
                    isRefreshing={isRefreshingCustomFields}
                    accessLevels={accessLevels}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>

      {documentContent && documentContent.content && (
        <Chatbot executionId={documentContent.execution_id} />
      )}

      {/* Direct Section Creation Dialog */}
      <AddSectionDialog
        open={isDirectSectionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDirectSectionDialogOpen(false)
          }
        }}
        documentId={selectedFile?.id || ''}
        sectionInsertPosition={sectionInsertPosition}
        existingSections={fullDocument?.sections || []}
        onSubmit={handleDirectSectionSubmit}
        isPending={addSectionMutation.isPending}
      />

      {/* Section Execution Creation Dialog */}
      <AddSectionExecutionDialog
        open={isSectionExecutionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSectionExecutionDialogOpen(false)
          }
        }}
        afterFromSectionId={afterFromSectionId}
        existingSections={sectionOptionsForExecutionDialog}
        onSubmit={handleSectionExecutionSubmit}
        isPending={createSectionExecutionMutation.isPending}
        onClose={() => {
          setIsSectionExecutionDialogOpen(false)
          setAfterFromSectionId(null)
        }}
      />

      {/* Delete Confirmation AlertDialog */}
      <ReusableAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !deleteExecutionMutation.isPending && handleDeleteDialogChange(open)}
        title={deleteType === 'execution' ? 'Delete Version' : 'Delete Document'}
        description={
          deleteType === 'execution' ? (
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
          )
        }
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isProcessing={deleteExecutionMutation.isPending}
        variant="destructive"
      />

      {/* Clone Confirmation AlertDialog */}
      <ReusableAlertDialog
        open={isCloneDialogOpen}
        onOpenChange={(open) => !cloneMutation.isPending && handleCloneDialogChange(open)}
        title="Clone Execution"
        description={
          selectedExecutionInfo ? (
            <>
              Are you sure you want to clone the execution <strong>{selectedExecutionInfo.name}</strong>?
              <br />
              This will create a new version that you can modify independently.
            </>
          ) : (
            "Are you sure you want to clone this execution? This will create a new version that you can modify independently."
          )
        }
        onConfirm={handleCloneConfirm}
        confirmLabel="Clone"
        isProcessing={cloneMutation.isPending}
        variant="default"
      />

      {/* Approve Confirmation AlertDialog */}
      <ReusableAlertDialog
        open={isApproveDialogOpen}
        onOpenChange={(open) => !approveMutation.isPending && !approvingExecutionId && handleApproveDialogChange(open)}
        title="Approve Execution"
        description={
          selectedExecutionInfo ? (
            <>
              Are you sure you want to approve the execution <strong>{selectedExecutionInfo.name}</strong>?
              <br />
              This will mark the execution as approved and ready for production use.
            </>
          ) : (
            "Are you sure you want to approve this execution? This will mark it as approved and ready for production use."
          )
        }
        onConfirm={handleApproveConfirm}
        confirmLabel="Approve"
        isProcessing={approveMutation.isPending || !!approvingExecutionId}
        variant="default"
      />

      {/* Disapprove Confirmation AlertDialog */}
      <ReusableAlertDialog
        open={isDisapproveDialogOpen}
        onOpenChange={(open) => !disapproveMutation.isPending && handleDisapproveDialogChange(open)}
        title="Draft execution"
        description={
          selectedExecutionInfo ? (
            <>
              Are you sure you want to convert the execution to draft <strong>{selectedExecutionInfo.name}</strong>?
              <br />
              This will mark the execution as draft and remove it from production use.
            </>
          ) : (
            "Are you sure you want to convert the execution to draft this execution? This will mark it as draft and remove it from production use."
          )
        }
        onConfirm={handleDisapproveConfirm}
        confirmLabel="Convert to Draft"
        isProcessing={disapproveMutation.isPending}
        variant="destructive"
      />

      <EditDocumentDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) onPreserveScroll?.();
          setIsEditDialogOpen(open);
        }}
        documentId={selectedFile?.id || ''}
        currentName={documentContent?.document_name || selectedFile?.name || ''}
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
        isLoadingFullDocument={isLoadingFullDocument}
        isOpen={isExecuteSheetOpen}
        onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
          if (!open) onPreserveScroll?.();
          setIsExecuteSheetOpen(open);
          if (!open) setExecutionContext(null); // Clear context when closing
        }}
        onSectionSheetOpen={() => {
          onPreserveScroll?.();
          setIsSectionSheetOpen(true);
        }}
        onExecutionCreated={handleExecutionCreated}
        onExecutionComplete={handleExecutionComplete}
        isMobile={isMobile}
        selectedExecutionId={selectedExecutionId}
        executionContext={executionContext}
        accessLevels={accessLevels}
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

      {/* Custom Word Export Dialog */}
      <CustomWordExportDialog
        selectedFile={selectedFile}
        selectedExecutionId={selectedExecutionId || documentContent?.execution_id || null}
        isOpen={isCustomWordExportDialogOpen}
        onOpenChange={(open) => {
          if (!open) onPreserveScroll?.();
          setIsCustomWordExportDialogOpen(open);
        }}
      />

      {/* Add Custom Field Document Dialog */}
      <AddCustomFieldDocumentDialog
        isOpen={isAddCustomFieldDocumentDialogOpen}
        onClose={() => setIsAddCustomFieldDocumentDialogOpen(false)}
        documentId={selectedFile.id}
        onAdd={handleCreateCustomFieldDocument}
        onImageUploadStart={handleImageUploadStart}
        onImageUploadComplete={handleImageUploadComplete}
      />

      {/* Edit Custom Field Document Dialog (Unified) */}
      <EditCustomFieldAssetDialog
        isOpen={isEditCustomFieldDocumentDialogOpen}
        onClose={() => {
          setIsEditCustomFieldDocumentDialogOpen(false);
          setSelectedCustomFieldDocument(null);
          setCustomFieldEditMode("configuration");
        }}
        customFieldDocument={selectedCustomFieldDocument}
        onUpdate={handleUpdateCustomFieldDocument}
        mode={customFieldEditMode}
      />

      {/* Delete Custom Field Document Confirmation Dialog */}
      <ReusableAlertDialog
        open={isDeleteCustomFieldDocumentDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isDeletingCustomFieldDocument) {
            handleCancelDeleteCustomFieldDocument();
          }
        }}
        title="Delete Custom Field Document"
        description={`Are you sure you want to delete the custom field "${customFieldDocumentToDelete?.name}"? This action cannot be undone and will remove this field data from the document.`}
        onConfirm={handleConfirmDeleteCustomFieldDocument}
        confirmLabel="Delete"
        isProcessing={isDeletingCustomFieldDocument}
        variant="destructive"
      />

      {/* Create Template from Document Dialog */}
      <CreateTemplateFromDocumentDialog
        open={isCreateTemplateFromDocumentDialogOpen}
        onOpenChange={setIsCreateTemplateFromDocumentDialogOpen}
        documentId={selectedFile.id}
        organizationId={selectedOrganizationId}
        onTemplateCreated={(template) => {
          navigate(`/templates/${template.id}`);
        }}
      />
    </>
  );
}
