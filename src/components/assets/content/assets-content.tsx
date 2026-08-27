import { useMemo, useEffect, useState, useRef, useCallback, useDeferredValue } from "react";
import { handleApiError } from "@/lib/error-utils";
import { resolveCannotGenerateReason, isMissingContextReason } from "@/lib/generation-gating";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
// Import necesario para el icono Plus
import { File, Loader2, Download, Trash2, FileText, FileCode, FileSpreadsheet, Plus, Play, List, FolderTree, FileIcon, Zap, CheckCircle, Clock, Eye, Copy, FileX, BetweenHorizontalStart, AlertCircle, RefreshCw, Pencil, Lock, Settings2, Bell, Sparkles, MessageSquareText, BookOpen } from "lucide-react";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { createSectionExecution, type AddSectionExecutionRequest } from "@/services/section_execution";
import { OtherVersionExecutionBanner } from "@/components/execution/other-version-execution-banner";
import { ExecutionStatusBanner } from "@/components/execution/execution-status-banner";
import { ChatbotContextSync } from "@/components/chatbot/chatbot-context-sync";
import { DependenciesSheet, ContextSheet, TemplateConfigSheet, ExecuteSheet, SectionSheet } from "@/components/assets/content";
import { VersionManagementSheet } from "@/components/assets/content/assets-version-management-sheet";
import { AssetVersionCompareSheet } from "@/components/assets/content/asset-version-compare-sheet";
import { AssetsInfoSheet } from "@/components/assets/content/assets-info-sheet";
import AssetLifecycleSheet from "@/components/assets/dialogs/assets-lifecycle-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { DocumentAccessControl } from "@/components/assets/content/assets-access-control";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulExpandableText } from "@/huemul/components/huemul-expandable-text";
import { AssetsNotificationsSheet } from "@/components/assets/content/assets-notifications-sheet";
import { AssetsDiscussionsSheet } from "@/components/assets/content/assets-discussions-sheet";
import { DiscussionFocusProvider, useDiscussionFocus } from "@/contexts/discussion-focus-context";
import { useDiscussions } from "@/hooks/useDiscussions";
import { LifecycleHistorySheet } from "@/components/assets/content/lifecycle-history-sheet";
import { AssetDiagramsSheet } from "@/components/assets/content/asset-diagrams-sheet";
import { AssetsRelatedDocuments } from "@/components/assets/content/assets-related-documents";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getDocumentContent, deleteDocument, getDocumentById, exportDocuments } from "@/services/assets";
import { useDocumentMediaUrls } from "@/hooks/useDocumentMediaUrls";
import { MediaUrlProvider } from "@/contexts/media-url-context";
import { MentionRefsProvider } from "@/contexts/mention-refs-context";
import { RoleRefsProvider } from "@/contexts/role-refs-context";
import { DocumentDataProvider } from "@/contexts/document-data-context";
import { collectMentionAssetIds, hasAnyRoleReference } from "@/lib/plate-mention-utils";
import { exportExecutionToMarkdown, exportExecutionToWord, exportExecutionToExcel, executeDocument, approveExecution, disapproveExecution, cloneExecution, cloneExecutionToNewDocument, deleteExecution, updateExecutionName } from "@/services/executions";
import { useExecutionRun } from './hooks/useExecutionRun';
import { ExecutionRunProgressBanner } from '@/components/execution/execution-run-progress-banner';
import { getDefaultLLM } from "@/services/llms";
import { useLifecycleActions } from "@/hooks/useLifecycleActions";
import { HuemulLifecycleStageBadge } from "@/huemul/components/huemul-lifecycle-stage-badge";
import { HuemulLifecycleActions } from "@/huemul/components/huemul-lifecycle-actions";
import { HuemulLifecycleSheets } from "@/huemul/components/huemul-lifecycle-sheets";
import { createSection, updateSectionsOrder } from "@/services/section";
import { getTemplateById } from "@/services/templates";
import { getCustomFieldDocumentsByDocument, createCustomFieldDocument, updateCustomFieldDocument, deleteCustomFieldDocument } from "@/services/custom-fieldds-documents";
import type { CustomFieldDocument } from '@/types/custom-fields';
import { AddCustomFieldDocumentSheet } from "@/components/assets-custom-fields/assets-add-custom-field-sheet";
import { EditCustomFieldAssetSheet } from "@/components/assets-custom-fields/assets-edit-custom-field-sheet";
import { AddSectionDialog } from "@/components/assets/dialogs/assets-add-section-dialog";
import { AddSectionExecutionSheet } from "@/components/assets/dialogs/assets-add-section-execution-sheet";
import { CreateTemplateDialog } from "@/components/templates/templates-create-dialog";
import { CreateTemplateFromDocumentDialog } from "@/components/assets/dialogs/assets-create-template-from-document-dialog";
import { RenameVersionDialog } from "@/components/assets/dialogs/assets-rename-version-dialog";
import { CloneToNewDocumentDialog } from "@/components/assets/dialogs/assets-clone-to-new-document-dialog";
import { ContentDeleteDialog } from "@/components/assets/dialogs/assets-content-delete-dialog";
import { CloneExecutionDialog } from "@/components/assets/dialogs/assets-clone-execution-dialog";
import { ApproveExecutionDialog } from "@/components/assets/dialogs/assets-approve-execution-dialog";
import { DisapproveExecutionDialog } from "@/components/assets/dialogs/assets-disapprove-execution-dialog";
import { DeleteCustomFieldDialog } from "@/components/assets/dialogs/assets-delete-custom-field-dialog";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import Markdown from "@/components/ui/markdown";
import { TableOfContents } from "@/components/assets/content/assets-table-of-contents";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { useExecutionRelationships } from "@/hooks/useExecutionRelationships";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { AssetsSectionsList } from "./assets-sections-list";
import { formatApiDateTime, parseApiDate, cn } from "@/lib/utils";
import { CustomWordExportDialog } from "@/components/assets/dialogs/assets-export-custom.word-dialog";
import { useNavKnowledgeActions } from "@/contexts/nav-knowledge-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useAssetContentPermissions } from '@/hooks/useDocumentAccess';
import {
  useDocumentSectionAccess,
  useInvalidateDocumentSectionAccess,
} from '@/hooks/useDocumentSectionAccess';
import { usePageAccess } from '@/hooks/usePageAccess';
import type { ContentSection, LibraryContentProps, LifecyclePermissions } from '@/types/assets';
import type { FormValuesSectionPayload } from '@/types/sections/core';
import { applyFormValuesPatch } from '@/components/assets/content/utils/patch-document-content';
import { isSectionApplicable } from '@/components/workflow/workflow-section-stats';
import { CustomFieldsList } from './assets-custom-fields-list';
import { useOptionalEditingGuard } from '@/contexts/editing-guard-context';
import { useGlobalPanel } from '@/contexts/global-panel-context';

// Utilities and hooks
import { withRefresh } from '@/lib/query-utils';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import { ContentErrorState } from './content-error-state';
// TODO: Integrate these hooks gradually to replace inline mutations
// import { useDocumentMutations } from './hooks/useDocumentMutations';
// import { useCustomFieldMutations } from './hooks/useCustomFieldMutations';
// import { useExecutionState } from './hooks/useExecutionState';

import { getExecutionDisplayLabel } from './utils/version-utils';
import { VersionSelectorDropdown } from './assets-version-selector';
import { ViewModeToggle } from './assets-view-mode-toggle';
import { MoreOptionsDropdown } from './assets-more-options-dropdown';
import { CUSTOM_FIELD_DOCUMENTS_PAGE_SIZE, customFieldDocumentsQueryKeys } from '@/hooks/useCustomFieldDocuments';

// Tamaño de página del listado de campos personalizados en el panel lateral (angosto).
// Compartido con la validación preventiva del lifecycle (useCustomFieldDocuments) —
// misma query key, un solo fetch.
const CUSTOM_FIELDS_PAGE_SIZE = CUSTOM_FIELD_DOCUMENTS_PAGE_SIZE;

/** Recursively extract all text from a Plate JSON node. */
function extractPlateText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  if ('text' in node) return (node as { text: string }).text || '';
  const el = node as { children?: unknown[] };
  if (Array.isArray(el.children)) return el.children.map(extractPlateText).join('');
  return '';
}

/**
 * Check whether a section has no visible content.
 * Checks plate_content (primary render source) when available, then falls back to markdown.
 */
function isSectionContentEmpty(section: ContentSection): boolean {
  // If plate_content exists, it's used as the primary render source
  if (section.plate_content && section.plate_content.length > 0) {
    const allText = section.plate_content
      .map((s) => { try { return extractPlateText(JSON.parse(s)); } catch { return ''; } })
      .join('');
    if (allText.trim() === '') return true;
    return false;
  }
  // Fallback: check markdown content
  return !section.content || section.content.trim() === '';
}



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
  selectedSectionId,
  setSelectedSectionId,
  setSelectedFile,
  onRefresh,
  currentFolderId,
  onToggleSidebar,
  onPreserveScroll
}: LibraryContentProps) {
  // ============================================================================
  // HOOKS AND CONTEXT
  // ============================================================================
  const { t } = useTranslation(["assets", "common"]);
  const queryClient = useQueryClient();
  const navigate = useOrgNavigate();
  const isMobile = useIsMobile();
  const { selectedOrganizationId } = useOrganization();
  const { canCreate, canList, canAccessTemplates, canAccessAssets, canAccessDiagrams } = useUserPermissions();
  const { can } = usePageAccess('asset');
  const { handleCreateAsset: openCreateAssetDialog } = useNavKnowledgeActions();
  const { guardedAction } = useOptionalEditingGuard();
  const { isOpen: isGlobalPanelOpen } = useGlobalPanel();
  const { requestFocus } = useDiscussionFocus();
  
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
      // Nueva sección → puede tener sus propias filas de acceso configuradas más tarde;
      // refresca la lista de secciones con `view` (ver useDocumentSectionAccess).
      invalidateSectionAccess(selectedFile?.id);

      setIsDirectSectionDialogOpen(false);
      setSectionInsertPosition(undefined);
    },
    meta: { successMessage: t('mutations.sectionCreated') },
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
      invalidateSectionAccess(selectedFile?.id);

      setIsSectionExecutionDialogOpen(false);
      setAfterFromSectionId(null);
    },
    meta: { successMessage: t('mutations.sectionAdded') },
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
      setCurrentExecutionId(executionData.id);
      
      // Update selected execution to show the new one
      setSelectedExecutionId(executionData.id);
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    meta: { successMessage: t('mutations.executionStarted') },
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
    onError: (error) => {
      setApprovingExecutionId(null);
      handleApiError(error);
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    meta: { successMessage: t('mutations.executionDisapproved') },
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
    meta: { successMessage: t('mutations.executionDeleted') },
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
      // Switch to the new cloned execution
      setSelectedExecutionId(clonedExecution.id);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
    },
    meta: { successMessage: t('mutations.executionCloned') },
  });

  // Mutation for clone execution to new document
  const cloneToNewDocumentMutation = useMutation({
    mutationFn: async (options: { name?: string; internal_code?: string; description?: string; folder_id?: string }) => {
      preserveScrollPosition();
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Missing execution ID or organization ID');
      }
      return cloneExecutionToNewDocument(selectedExecutionId, selectedOrganizationId, options);
    },
    onSuccess: () => {
      closeCloneToNewDocumentDialog();
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
    meta: { successMessage: t('mutations.executionCloned') },
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
      }
    },
    meta: { successMessage: t('mutations.customFieldCreated') },
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
    },
    meta: { successMessage: t('mutations.customFieldUpdated') },
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
    },
    meta: { successMessage: t('mutations.customFieldDeleted') },
  });

  // Helper function to preserve scroll position
  const preserveScrollPosition = useCallback(() => {
    scrollRestoration.saveScrollPosition();
  }, [scrollRestoration.saveScrollPosition]);

  // Mutation for renaming an execution version
  const renameVersionMutation = useMutation({
    mutationFn: withRefresh(
      async ({ executionId, name }: { executionId: string; name: string }) => {
        if (!selectedOrganizationId) throw new Error('Missing organization');
        // Renombrar una versión es escritura sobre el asset: sin asset:u no se
        // muta (el botón ya está oculto, esto cubre el permiso revocado en vivo).
        if (!can('updateAssetContent')) throw new Error('Missing permission');
        return updateExecutionName(executionId, name, selectedOrganizationId);
      },
      queryClient,
      () => [['document-content', selectedFile?.id], ['executions', selectedFile?.id], ['document', selectedFile?.id], ['library']],
    ),
    onSuccess: () => {
      setIsRenameVersionDialogOpen(false);
      setExecutionToRename(null);
    },
    meta: { successMessage: t('mutations.versionRenamed') },
    onError: (error) => {
      handleApiError(error, { fallbackMessage: t('mutations.failedRenameVersion') });
    },
  });

  // ============================================================================
  // STATE - DIALOG AND SHEET VISIBILITY
  // ============================================================================
  // Confirmation dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'document' | 'execution' | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isCloneToNewDocumentDialogOpen, setIsCloneToNewDocumentDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);
  const [isRenameVersionDialogOpen, setIsRenameVersionDialogOpen] = useState(false);
  const [executionToRename, setExecutionToRename] = useState<{ id: string; name: string } | null>(null);
  const [isNotificationsSheetOpen, setIsNotificationsSheetOpen] = useState(false);
  const [isDiscussionsSheetOpen, setIsDiscussionsSheetOpen] = useState(false);
  const [isLifecycleHistorySheetOpen, setIsLifecycleHistorySheetOpen] = useState(false);
  const [isDiagramsSheetOpen, setIsDiagramsSheetOpen] = useState(false);

  // Sidebar and sheets
  const [activeTab, setActiveTab] = useState<'toc' | 'custom-fields'>('toc');
  // Los custom fields son un recurso propio (custom_fields), no del asset: el tab
  // y su query exigen el permiso de listarlos.
  const canListCustomFields = can('listCustomFields');
  const canCreateCustomField = can('createCustomField');
  const canListNotifications = can('listNotifications');
  const canListDiscussions = canList('discussion');
  const canListExecutionRelationships = can('listExecutionRelationships');
  // El tab activo no puede quedar apuntando a un tab que el usuario no puede ver.
  useEffect(() => {
    if (activeTab === 'custom-fields' && !canListCustomFields) setActiveTab('toc');
  }, [activeTab, canListCustomFields]);
  const [isTocSidebarOpen, setIsTocSidebarOpen] = useState(true);
  const [isSectionSheetOpen, setIsSectionSheetOpen] = useState(false);
  const [isDependenciesSheetOpen, setIsDependenciesSheetOpen] = useState(false);

  // Close TOC when Wisy panel opens
  useEffect(() => {
    if (isGlobalPanelOpen) {
      setIsTocSidebarOpen(false);
    }
  }, [isGlobalPanelOpen]);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isVersionManagementSheetOpen, setIsVersionManagementSheetOpen] = useState(false);
  const [isVersionCompareSheetOpen, setIsVersionCompareSheetOpen] = useState(false);
  const [versionCompareOverride, setVersionCompareOverride] = useState<{ left?: string; right?: string } | null>(null);
  const [isPermissionsSheetOpen, setIsPermissionsSheetOpen] = useState(false);
  const canViewTags = can('viewTags');
  const canManageTags = can('manageTags');

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
    setCustomFieldsPage(1);
  }, [selectedFile?.id]);
  
  // ============================================================================
  // STATE - EXECUTION TRACKING
  // ============================================================================
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [currentExecutionMode, setCurrentExecutionMode] = useState<'full' | 'single' | 'from' | 'full-single'>('full');
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | undefined>(undefined);
  // epoch ms del click que disparó currentExecutionId — arma la ventana de
  // "arming" en useExecutionRun (ver ese archivo para el porqué).
  const [executionStartedAt, setExecutionStartedAt] = useState<number | null>(null);
  // Identifica ESTA corrida — el backend reutiliza el mismo currentExecutionId
  // al re-ejecutar una sección ya terminada, así que currentExecutionId por sí
  // solo no alcanza para distinguir "la corrida anterior" de "la nueva". Las
  // queryKeys del flujo single/from (ver useExecutionRun) incluyen este token,
  // para que el caché arranque en blanco en cada disparo y no pueda arrastrar
  // el resultado ya reconciliado de la corrida previa (causa del banner
  // "completado" apareciendo de inmediato al re-ejecutar la misma sección).
  const [executionRunToken, setExecutionRunToken] = useState<string | null>(null);
  // Ejecución de versión nueva (full/full-single) recién creada: se banner-ea
  // de inmediato como "otra versión generando" sin esperar a que /content
  // devuelva la lista de ejecuciones actualizada (ver A4 en el plan).
  const [newVersionExecutionId, setNewVersionExecutionId] = useState<string | null>(null);
  const [dismissedExecutionBanners, setDismissedExecutionBanners] = useState<Set<string>>(new Set());
  const [approvingExecutionId, setApprovingExecutionId] = useState<string | null>(null);
  
  // ============================================================================
  // STATE - SECTION MANAGEMENT
  // ============================================================================
  const [isDirectSectionDialogOpen, setIsDirectSectionDialogOpen] = useState(false);
  const [sectionInsertPosition, setSectionInsertPosition] = useState<number | undefined>(undefined);
  const [isSectionExecutionDialogOpen, setIsSectionExecutionDialogOpen] = useState(false);
  const [afterFromSectionId, setAfterFromSectionId] = useState<string | null>(null);
  const [sectionFromSelectionContent, setSectionFromSelectionContent] = useState<string | null>(null);
  
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
  // STATE - VIEW / EDITOR MODE
  // ============================================================================
  // Starts in reader mode; auto-adjusted based on lifecycle permissions when document loads
  const [isViewMode, setIsViewMode] = useState(true);
  // Tracks which document has had its initial mode set, so re-fetches don't override the user's choice
  const hasSetInitialModeRef = useRef<string | null>(null);

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
  const [customFieldsPage, setCustomFieldsPage] = useState(1);

  // Restore scroll position after mode toggle causes layout shifts (sections/separators appear or disappear)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRestoration.restoreScrollPosition();
    }, 50);
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewMode]);

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
      setExecutionStartedAt(null);
      setExecutionRunToken(null);
      setNewVersionExecutionId(null);
      setDismissedExecutionBanners(new Set());
      setExecutionContext(null);
      doneSnapshotRef.current.clear();
      refreshedOrdersRef.current.clear();
      terminalInvalidatedRunTokenRef.current = null;
      if (pendingContentInvalidateRef.current !== null) {
        clearTimeout(pendingContentInvalidateRef.current);
        pendingContentInvalidateRef.current = null;
      }
    }
  }, [selectedFile?.id, selectedExecutionId]);

  // Compartido entre handleExecutionCreated (Execute Sheet) y el disparo desde
  // el menú de una sección: registra la corrida en curso. `startedAt` arma la
  // ventana de "arming" en useExecutionRun; `runToken` (nuevo en cada llamada,
  // incluso reutilizando el mismo executionId) es lo que le da a esa corrida
  // una identidad propia frente al caché — ya no hace falta resetQueries.
  const armExecutionTracking = useCallback((
    executionId: string,
    mode: 'full' | 'single' | 'from' | 'full-single',
    sectionIndex?: number,
  ) => {
    isCreatingExecutionRef.current = false;
    setCurrentExecutionId(executionId);
    setCurrentExecutionMode(mode);
    setCurrentSectionIndex(sectionIndex);
    setExecutionStartedAt(Date.now());
    setExecutionRunToken(`${executionId}:${Date.now()}`);
    doneSnapshotRef.current.clear();
    refreshedOrdersRef.current.clear();
    terminalInvalidatedRunTokenRef.current = null;
  }, []);

  // Disparado desde el menú de una sección ("Ejecutar sección" / "Ejecutar
  // desde esta sección"), no desde el ExecuteSheet — sin esto, isSectionInScope()
  // daba false y ese camino nunca mostraba banner ni skeleton. Currificada por
  // índice y memoizada (deps estables: armExecutionTracking y
  // preserveScrollPosition ya son useCallback) para no romper el memo de
  // AssetsSectionsList en cada render.
  const handleSectionExecutionStart = useCallback((index: number) => (
    executionIdForSection: string,
    mode: 'single' | 'from',
  ) => {
    preserveScrollPosition();
    armExecutionTracking(executionIdForSection, mode, index);
  }, [armExecutionTracking, preserveScrollPosition]);

  // Handle execution created from Execute Sheet
  const handleExecutionCreated = (executionId: string, mode: 'full' | 'single' | 'from' | 'full-single', sectionIndex?: number) => {
    // Preserve scroll position before any changes
    preserveScrollPosition();

    logger.log('📥 Asset Content - Execution created received:', {
      executionId,
      mode,
      sectionIndex,
      willShowSectionFeedback: mode === 'single' || mode === 'from'
    });

    armExecutionTracking(executionId, mode, sectionIndex);

    // Determine behavior based on execution mode:
    // - full/full-single: Creates NEW version, user stays on current version
    // - single/from: Modifies EXISTING version, user stays to see the changes
    if (mode === 'full' || mode === 'full-single') {
      // NEW VERSION: Don't automatically switch to the new execution
      // The user decides if they want to switch to the new version
      logger.log('New version created:', executionId, 'User stays on current version:', selectedExecutionId);

      // Banner-ear de inmediato (no depende del snapshot de /content, que
      // puede llegar antes de que el backend registre la ejecución como
      // activa — ver A4 en el plan).
      setNewVersionExecutionId(executionId);
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
    } else if (mode === 'single' || mode === 'from') {
      // EDIT EXISTING: el contenido todavía no cambió — se refresca solo
      // cuando el efecto `newlyDone` ve cada sección terminar de verdad (B3).
      logger.log('Existing version modified:', executionId, 'Refreshing current version:', selectedExecutionId);
    }
  };

  // State for refresh animation
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);

  // Handle manual refresh of all asset content
  const handleRefreshContent = async () => {
    if (isRefreshingContent) return;
    setIsRefreshingContent(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['document-section-access', selectedFile?.id] }),
      ]);
    } finally {
      setIsRefreshingContent(false);
    }
  };

  // Stable callback for section onUpdate — invalidates document content.
  // Memoized so React.memo on SectionExecution can skip re-renders.
  const selectedFileIdRef = useRef(selectedFile?.id);
  selectedFileIdRef.current = selectedFile?.id;

  // Con payload (autoguardado de formularios): parchea en el caché solo las secciones
  // form devueltas por el PATCH /form_values, sin refetch de /documents/{id}/content
  // (que traería también las secciones ai/manual/reference sin necesidad). También
  // refresca section_name si vino no-null, para que TOC/headers queden al día sin
  // refetch. Nota: si el PATCH devuelve una sección que no está en el caché, se ignora
  // (solo reemplaza, nunca agrega) — limitación conocida.
  // Sin payload (resto de ediciones de sección): comportamiento previo, invalida y refetch.
  const handleSectionUpdate = useCallback((payload?: FormValuesSectionPayload[]) => {
    const fileId = selectedFileIdRef.current;
    if (payload?.length && fileId) {
      applyFormValuesPatch(queryClient, fileId, payload);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['document-content', fileId] });
  }, [queryClient]);

  // Al cerrar el sheet de secciones, refrescar el contenido del asset.
  // La edición de secciones propaga a la versión de forma asíncrona en el
  // backend; el invalidate inmediato del sheet corre una carrera contra esa
  // propagación y puede recachear contenido viejo como "fresh". Forzar un
  // refetch al cerrar (cuando la propagación ya terminó) evita tener que
  // recargar toda la página con Ctrl+F5.
  const handleSectionSheetOpenChange = useCallback((open: boolean) => {
    if (!open) {
      preserveScrollPosition();
      const fileId = selectedFileIdRef.current;
      queryClient.invalidateQueries({ queryKey: ['document-content', fileId] });
      queryClient.invalidateQueries({ queryKey: ['document', fileId] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', fileId] });
      // El sheet pudo crear/editar/borrar/reordenar secciones — refresca la lista de
      // secciones con `view` (ver useDocumentSectionAccess).
      invalidateSectionAccess(fileId);
    }
    setIsSectionSheetOpen(open);
  }, [queryClient]);

  // Handle add section
  const handleAddSection = () => {
    if (selectedFile && selectedFile.type === 'document') {
      preserveScrollPosition();
      setIsSectionSheetOpen(true);
    }
  };

  // handleAddSectionAtPosition: definida más abajo, después de la query de
  // documentContent (necesita leerla en sus deps de useCallback — ver ese punto).

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
    
    logger.log('Creating section with position:', sectionInsertPosition, 'calculated order:', order);
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

  // Handle create section from selected text in floating toolbar
  const handleCreateSectionFromSelection = (sectionIndex: number) => (selectedMarkdown: string) => {
    if (!selectedExecutionId || !documentContent?.content) return;
    // Determine after_from based on current section index
    const afterFromId = documentContent.content[sectionIndex]?.id || null;
    setAfterFromSectionId(afterFromId);
    setSectionFromSelectionContent(selectedMarkdown);
    setIsSectionExecutionDialogOpen(true);
  };

  // Handle create new execution - abrir Execute Sheet
  const handleCreateExecution = (context?: { type: 'header' | 'section', sectionIndex?: number, sectionId?: string }) => {
    // Mark that we're starting to create an execution
    isCreatingExecutionRef.current = true;
    if (selectedFile && selectedFile.type === 'document') {
      preserveScrollPosition();
      setNeedsFullDocument(true);
      setNeedsDefaultLLM(true);

      // Only set execution context for the sheet - do NOT update tracking state
      // (currentSectionIndex / currentExecutionMode) here. Those must only be set
      // in handleExecutionCreated, once the user actually triggers an execution.
      if (context?.type === 'section' && typeof context.sectionIndex === 'number') {
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
    isFetching: isFetchingContent,
    dataUpdatedAt: contentUpdatedAt,
    isError: isContentError,
    error: contentError,
    refetch: refetchContent
  } = useQuery({
    queryKey: selectedExecutionId
      ? ['document-content', selectedFile?.id, selectedExecutionId]
      : ['document-content', selectedFile?.id],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedOrganizationId!, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
    // No self-poll. The ExecutionStatusBanner polls /execution/{id}/status and,
    // on completion, refreshes content via onExecutionComplete + query invalidation.
    // This prevents /documents/.../content being re-hit on every status tick during import.
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
    // TODO: la key no incluye selectedOrganizationId (preexistente, ver
    // "ia context/rbac-audit-guide.md"). No se toca en este cambio.
  });

  // Handle add section at specific position.
  // useCallback: se pasa como prop a AssetsSectionsList (memoizado) — sin esto
  // tendría una referencia nueva en cada render de AssetContent, anulando ese memo.
  // Definida acá (no junto al resto de handlers de sección más arriba) porque
  // depende de `documentContent`, declarado recién arriba.
  const handleAddSectionAtPosition = useCallback((afterIndex?: number) => {
    if (selectedFile && selectedFile.type === 'document') {
      // Si hay contenido de documento (execution exists), crear section_execution
      if (documentContent?.content && Array.isArray(documentContent.content) && selectedExecutionId) {
        logger.log(`Adding section execution after index: ${afterIndex}`);
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
        logger.log(`Adding section after index: ${afterIndex}`);
        setSectionInsertPosition(afterIndex);
        setIsDirectSectionDialogOpen(true);
      }
    }
  }, [selectedFile, documentContent?.content, selectedExecutionId]);

  // Gate de generación con IA (context_required / can_generate del backend).
  // Fuente única: documentContent, porque es la única query siempre cargada
  // cuando hay un activo abierto (fullDocument es lazy y llega tarde).
  // can_generate ausente (backend viejo, /content aún cargando o en error) =>
  // fail-open, nunca bloquea. Ver src/lib/generation-gating.ts.
  const canGenerate = documentContent?.can_generate !== false;
  const cannotGenerateReason = canGenerate
    ? undefined
    : resolveCannotGenerateReason(documentContent?.cannot_generate_reason, t);
  const isCannotGenerateMissingContext = !canGenerate && isMissingContextReason(documentContent?.cannot_generate_reason);

  // Contenido diferido para la lista de secciones: banners, toolbar y el resto
  // del encabezado siguen leyendo `documentContent` directo (necesitan
  // reaccionar al instante — es el feedback de progreso de la corrida), pero
  // reconstruir los N editores Plate de la lista es lo caro. `useDeferredValue`
  // deja que React renderice ESE árbol en baja prioridad e interrumpible: el
  // scroll y los clicks siguen respondiendo mientras se arma, en vez de
  // bloquear el hilo principal hasta que termine (ver AssetsSectionsList).
  const deferredContent = useDeferredValue(documentContent?.content);

  // Emptiness por sección (índice a índice con deferredContent — el mismo
  // array que se le pasa a AssetsSectionsList, para no desalinear índices
  // durante la transición diferida), usada en modo lector para ocultar
  // secciones sin contenido. Antes esto se recalculaba —con un JSON.parse +
  // walk recursivo de TODO el plate_content de la sección— dentro del .map de
  // render, en CADA render de AssetContent (abrir un dropdown, un tick de
  // polling, cualquier cosa). Memoizado acá, solo se vuelve a calcular cuando
  // el contenido realmente cambia.
  const sectionEmptiness = useMemo(() => {
    if (!Array.isArray(deferredContent)) return [] as boolean[];
    return deferredContent.map((section: ContentSection) =>
      section.section_type === 'form' ? !isSectionApplicable(section) : isSectionContentEmpty(section)
    );
  }, [deferredContent]);

  // Permiso de sección por ciclo de vida (view/can_edit) — /content no lo trae, así que
  // se resuelve aparte contra GET /documents/{id}/sections. Ver
  // "ia context/permisos-seccion-lifecycle-guide.md" y src/hooks/useDocumentSectionAccess.ts.
  const sectionAccess = useDocumentSectionAccess(
    selectedFile?.type === 'document' ? selectedFile?.id : undefined,
    selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
  );
  const invalidateSectionAccess = useInvalidateDocumentSectionAccess();

  // Ids de todos los assets referenciados por menciones (@) en el contenido, para
  // resolverlos en un solo lote (asset_ids + include_executions) en vez de confiar
  // en el snapshot que cada chip trae guardado en su propio nodo Plate. También se
  // detecta si hay al menos una referencia a un rol, para gatear el fetch de
  // useRolesMap (trae TODOS los roles de la org) solo cuando hace falta.
  const { mentionAssetIds, hasRoleReferences } = useMemo(() => {
    if (!Array.isArray(documentContent?.content)) return { mentionAssetIds: [] as string[], hasRoleReferences: false };
    const ids = new Set<string>();
    let hasRoles = false;
    for (const section of documentContent.content) {
      for (const raw of section.plate_content ?? []) {
        try {
          const parsed = JSON.parse(raw);
          collectMentionAssetIds(parsed, ids);
          if (!hasRoles) hasRoles = hasAnyRoleReference(parsed);
        } catch {
          // Contenido plate_content malformado — se ignora, la chip cae al snapshot.
        }
      }
    }
    return { mentionAssetIds: Array.from(ids), hasRoleReferences: hasRoles };
  }, [documentContent?.content]);

  // Lightweight periodic refresh of media download URLs (images/files embedded in
  // the content), so a tab left open longer than the backend's SAS TTL doesn't end
  // up with broken media. Cadence is derived from the backend's own ttl_seconds.
  const { data: mediaUrlsData } = useDocumentMediaUrls(selectedFile?.id, selectedOrganizationId ?? undefined, {
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
    executionId: selectedExecutionId || undefined,
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
    queryKey: customFieldDocumentsQueryKeys.byDocument(selectedFile?.id, customFieldsPage, CUSTOM_FIELDS_PAGE_SIZE),
    queryFn: () => getCustomFieldDocumentsByDocument({
      document_id: selectedFile!.id,
      page: customFieldsPage,
      page_size: CUSTOM_FIELDS_PAGE_SIZE
    }),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId && activeTab === 'custom-fields' && canListCustomFields,
    staleTime: 60000, // Cache for 1 minute
    placeholderData: (prev) => prev,
  });

  // Dueño único del polling de estado para la corrida single/from en curso —
  // combina /status y /sections_status detrás de una máquina de estados
  // (phase). Ver useExecutionRun.ts para el porqué del runToken.
  const executionRun = useExecutionRun({
    executionId: currentExecutionId,
    executionMode: currentExecutionMode,
    startSectionIndex: currentSectionIndex,
    runToken: executionRunToken,
    startedAt: executionStartedAt,
  });

  // Botón "refrescar" del ExecutionRunProgressBanner: además de repetir el
  // polling de la corrida vigente (executionRun.refetch), invalida
  // document-content y executions — es la acción con la que hoy el usuario
  // destraba a mano un banner/skeleton que quedó colgado por estado stale de
  // la corrida anterior (ver terminalInvalidatedRunTokenRef más abajo, que
  // cubre el mismo caso automáticamente al terminar la corrida).
  const handleRefreshExecutionRun = useCallback(() => {
    executionRun.refetch();
    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
  }, [executionRun.refetch, queryClient, selectedFile?.id]);

  // Snapshot of contentUpdatedAt taken the instant a section is first seen as 'done'.
  // Until document-content refetches with data NEWER than that snapshot, the cached
  // body for that section is still the old/empty one — keep its skeleton up to avoid
  // a flash of stale content between the "done" banner and the real regenerated text.
  const doneSnapshotRef = useRef<Map<number, number>>(new Map());
  // Orders already invalidated for the current execution, so a tick where several
  // sections finish together triggers a single document-content refetch, not one per section.
  const refreshedOrdersRef = useRef<Set<number>>(new Set());
  // Debounce del invalidate de abajo: en modo `from`, varias secciones pueden
  // llegar a 'done' en ticks de polling distintos (2s cada uno) — sin esto,
  // cada una dispara su propio invalidateQueries + refetch + commit pesado
  // (ver assets-section.tsx: cada refetch reconstruye N editores Plate en
  // paralelo). Agrupar en una sola ventana corta reduce eso a un solo refetch
  // por tanda de secciones que terminan casi juntas.
  const pendingContentInvalidateRef = useRef<number | null>(null);
  const CONTENT_INVALIDATE_DEBOUNCE_MS = 500;

  useEffect(() => {
    // Mientras sections_status no sea confiable para ESTA corrida, un 'done'
    // puede ser el de la corrida anterior (el backend reutiliza el mismo
    // executionId y todavía no mutó estado) — no lo tratamos como "recién
    // terminada" hasta que useExecutionRun confirme actividad real.
    if (!executionRun.sectionsTrusted) return;
    if (!executionRun.sections?.length) return;
    const newlyDone = executionRun.sections.filter(
      (s) => s.status === 'done'
        && executionRun.isSectionInScope(s.order - 1)
        && !refreshedOrdersRef.current.has(s.order),
    );
    if (!newlyDone.length) return;

    newlyDone.forEach((s) => {
      refreshedOrdersRef.current.add(s.order);
      if (!doneSnapshotRef.current.has(s.order)) {
        doneSnapshotRef.current.set(s.order, contentUpdatedAt);
      }
    });

    preserveScrollPosition();

    if (pendingContentInvalidateRef.current !== null) {
      clearTimeout(pendingContentInvalidateRef.current);
    }
    const fileId = selectedFile?.id;
    pendingContentInvalidateRef.current = window.setTimeout(() => {
      pendingContentInvalidateRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['document-content', fileId] });
    }, CONTENT_INVALIDATE_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionRun.sections, executionRun.sectionsTrusted, executionRun.isSectionInScope, selectedFile?.id, queryClient]);

  // Ejecuta el invalidate pendiente (si lo hubiera) al desmontar, en vez de
  // perderlo — evita quedar con contenido stale si el componente se desmonta
  // justo dentro de la ventana de debounce (p. ej. navegación rápida).
  useEffect(() => {
    return () => {
      if (pendingContentInvalidateRef.current !== null) {
        clearTimeout(pendingContentInvalidateRef.current);
        pendingContentInvalidateRef.current = null;
      }
    };
  }, []);

  const isAwaitingFreshContent = useCallback((index: number) => {
    const snapshot = doneSnapshotRef.current.get(index + 1);
    if (snapshot === undefined) return false;
    return isFetchingContent || contentUpdatedAt <= snapshot;
  }, [isFetchingContent, contentUpdatedAt]);

  // El contenido regenerado puede tardar un tick más que el 'done' de la
  // sección en llegar al caché de document-content — mientras eso pasa,
  // seguir mostrando el skeleton en vez de destaparlo con contenido viejo.
  const getDisplaySectionStatus = useCallback((index: number) => {
    if (isAwaitingFreshContent(index)) return 'running';
    return executionRun.getSectionStatus(index);
  }, [isAwaitingFreshContent, executionRun.getSectionStatus]);

  // El banner de progreso solo espera contenido fresco en las secciones que
  // ya llegaron a 'done' — las demás (en cola o generando) todavía no tienen
  // nada que refrescar.
  const isRunAwaitingFreshContent = useMemo(() => {
    if (!executionRun.sections?.length) return false;
    return executionRun.sections.some(
      (s) => executionRun.isSectionInScope(s.order - 1) && isAwaitingFreshContent(s.order - 1),
    );
  }, [executionRun.sections, executionRun.isSectionInScope, isAwaitingFreshContent]);

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

  // Effect to mark the current single/from execution's banner as dismissed
  // once it reaches a terminal state (ExecutionStatusBanner no debe mostrarse
  // para esta ejecución — ExecutionRunProgressBanner ya cubre ese feedback).
  // NO clear tracking states here so feedback can still display.
  useEffect(() => {
    if (currentExecutionMode !== 'single' && currentExecutionMode !== 'from') return;
    if (executionRun.phase !== 'succeeded' && executionRun.phase !== 'failed' && executionRun.phase !== 'cancelled') return;
    if (!currentExecutionId) return;
    logger.log(`🎯 Section execution finished with phase: ${executionRun.phase}, keeping feedback visible`);
    setDismissedExecutionBanners(prev => new Set([...prev, currentExecutionId]));
  }, [executionRun.phase, currentExecutionMode, currentExecutionId]);

  // Red de seguridad al cerrar la corrida: `newlyDone` (arriba) ya invalida
  // document-content sección por sección a medida que cada una llega a
  // 'done' de verdad (B7), pero eso depende de que sections_status haya sido
  // confiable en algún momento antes del cierre. Este efecto garantiza, una
  // sola vez por runToken, que al terminar la corrida (éxito, falla o
  // cancelación) el contenido y la lista de executions queden al día — sin
  // esto, `documentContent.executions[].status` podía quedar congelado en
  // 'running' y los botones de generar del header seguían bloqueados aunque
  // la corrida ya hubiera terminado (hasExecutionInProcess más abajo).
  const terminalInvalidatedRunTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentExecutionMode !== 'single' && currentExecutionMode !== 'from') return;
    if (executionRun.phase !== 'succeeded' && executionRun.phase !== 'failed' && executionRun.phase !== 'cancelled') return;
    if (!executionRunToken) return;
    if (terminalInvalidatedRunTokenRef.current === executionRunToken) return;
    terminalInvalidatedRunTokenRef.current = executionRunToken;

    if (pendingContentInvalidateRef.current !== null) {
      clearTimeout(pendingContentInvalidateRef.current);
      pendingContentInvalidateRef.current = null;
    }
    queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
  }, [executionRun.phase, currentExecutionMode, executionRunToken, selectedFile?.id, queryClient]);

  // Effect to detect when approval process completes
  useEffect(() => {
    if (approvingExecutionStatus && approvingExecutionId) {
      const status = approvingExecutionStatus.status;
      
      if (status === 'approved') {
        logger.log(`✅ Execution approved successfully: ${approvingExecutionId}`);
        
        // Preserve scroll position
        preserveScrollPosition();
        
        // Show success message
        toast.success(t('mutations.executionApproved'));
        
        // Clear approving state
        setApprovingExecutionId(null);
        
        // Refresh all data to show approved status
        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      } else if (status !== 'approving') {
        // If status changed to something other than 'approving' or 'approved' (e.g., error state)
        logger.log(`⚠️ Approval process ended with unexpected status: ${status}`);
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

  // Unified executions source: prefer documentContent (always fresh after refetch) over separate query
  const allExecutions = documentContent?.executions || documentExecutions;

  // Relaciones + catálogo de tipos para el nodo `data_table` (fuente "related_documents") y para
  // AssetsRelatedDocuments más abajo — misma query key en ambos casos, comparten caché.
  const relatedExecutionId = selectedExecutionId || documentContent?.execution_id;
  const { data: relationshipsData } = useExecutionRelationships(
    selectedOrganizationId || '',
    relatedExecutionId || '',
    { enabled: canListExecutionRelationships && !!relatedExecutionId, direction: 'all', includeSubrelationships: false },
  );
  const { data: documentTypesResponse } = useDocumentTypes({ enabled: can('listAssetTypes') });
  const documentTypeNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of documentTypesResponse?.data ?? []) map.set(type.id, type.name);
    return map;
  }, [documentTypesResponse]);

  // Check if there's any execution in process - optimized with memoization
  const hasExecutionInProcess = useMemo(() => {
    // Use executions from documentContent first (preferred), then fallback to separate query
    const executions = documentContent?.executions || documentExecutions;
    if (!executions) return false;
    return executions.some((execution: any) => 
      ['running', 'queued', 'pending', 'processing', 'approving', 'importing'].includes(execution.status)
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
    // `pendingExecution.sections` viene embebido acá (no de `GET /execution/{id}`,
    // que sí filtra por `view` — ver "ia context/permisos-seccion-lifecycle-guide.md" §5).
    // Si esta lista empezara a filtrarse también, un usuario sin acceso a todas
    // las secciones podría dar un falso negativo — no confirmado hoy.
    return !pendingExecution.sections?.some((section: any) =>
      section.output && section.output.trim().length > 0
    );
  }, [documentContent?.executions, documentExecutions]);

  // Get the active execution ID (running, pending, or failed) from document executions

  // Lifecycle permissions from the document content response
  const lifecyclePermissions = documentContent?.lifecycle_permissions as LifecyclePermissions | undefined;

  // Permisos del panel: cruza lifecycle_permissions + lifecycle_status.stage con
  // las capacidades RBAC globales (regla AND — ver useAssetContentPermissions).
  // canViewContent / isViewOnly / canSwitchToEditorMode viven ahí y no acá para
  // que la política de "sin lifecycle configurado" se decida en un solo lugar.
  const {
    frontendPermissions,
    rbac: assetRbac,
    canViewContent,
    isViewOnly,
    canSwitchToEditorMode,
  } = useAssetContentPermissions(lifecyclePermissions, documentContent?.lifecycle_status);

  // Execution lifecycle transitions (complete/return, publish, archive, restore,
  // assign version, re-run external publish) — shared controller also used by
  // WorkflowDetailPanel, see useLifecycleActions.
  const lifecycle = useLifecycleActions({
    documentId: selectedFile?.id,
    executionId: selectedExecutionId || documentContent?.execution_id,
    organizationId: selectedOrganizationId,
    documentTypeId: documentContent?.document_type?.id,
    lifecycleStatus: documentContent?.lifecycle_status,
    lifecyclePermissions,
    rbac: { canTransition: assetRbac.updateAssetContent },
    extraRefreshKeys: () => [['document', selectedFile?.id], ['executions', selectedFile?.id]],
    onBeforeAdvance: () => preserveScrollPosition(),
    onViewChanges: (previousExecutionId, currentExecutionId) => {
      setVersionCompareOverride({ left: previousExecutionId, right: currentExecutionId });
      setIsVersionCompareSheetOpen(true);
    },
    canListCustomFields,
    onOpenCustomFields: canListCustomFields
      ? () => {
          setActiveTab('custom-fields');
          setIsTocSidebarOpen(true);
        }
      : undefined,
  });

  // Set initial view mode based on lifecycle permissions (once per document+execution):
  // - view only  → reader mode, no toggle
  // - has edit permission in edit stage → editor mode directly
  // - other stages → reader mode
  // Uses a composite key so switching executions within the same document also re-evaluates.
  useEffect(() => {
    if (!selectedFile?.id) return;

    const modeKey = `${selectedFile.id}::${selectedExecutionId ?? ''}`;

    // Already initialized for this document+execution combo
    if (hasSetInitialModeRef.current === modeKey) return;

    // Ensure the loaded data corresponds to the currently selected execution
    // to avoid setting the mode based on stale permissions from the previous version.
    const dataMatchesSelection =
      !selectedExecutionId || documentContent?.execution_id === selectedExecutionId;

    if (!lifecyclePermissions || !dataMatchesSelection) {
      // Data not ready yet – default to reader mode as a safe fallback
      setIsViewMode(true);
      return;
    }

    const isEditStage = documentContent?.lifecycle_status?.stage === 'edit';
    const hasEdit = !!(lifecyclePermissions.edit || lifecyclePermissions.create);

    // Set editor mode directly when user has edit permission in edit stage
    setIsViewMode(!(hasEdit && isEditStage));

    // Mark this document+execution as initialized so re-fetches don't override the user's choice
    hasSetInitialModeRef.current = modeKey;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.id, selectedExecutionId, lifecyclePermissions, documentContent?.lifecycle_status?.stage, documentContent?.execution_id]);

  // Force reader mode when stage moves away from "edit" (e.g. lifecycle advances)
  useEffect(() => {
    if (!canSwitchToEditorMode && !isViewMode) {
      setIsViewMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSwitchToEditorMode]);

  // Show editor action buttons: only in edit stage when user is in editor mode.
  // Non-edit stages always stay in reader mode, so editor actions are never shown.
  const showEditorActions = canSwitchToEditorMode && !isViewMode;

  // Versión efectivamente en pantalla: la elegida a mano, o si el usuario
  // nunca eligió, la que el backend devolvió como actual. Sin este fallback,
  // ninguno de los dos banners de abajo se muestra hasta la primera selección manual.
  const effectiveSelectedExecutionId = selectedExecutionId ?? documentContent?.execution_id ?? null;

  // Get active executions on other versions (not currently viewed)
  const otherVersionActiveExecutions = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;

    if (!executions || !effectiveSelectedExecutionId) {
      return [];
    }

    return executions.filter((execution: any) => {
      // Exclude the currently selected version
      if (execution.id === effectiveSelectedExecutionId) return false;

      // For single/from modes, also exclude the currentExecutionId (same as selected)
      if (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) {
        if (execution.id === currentExecutionId) return false;
      }

      // Only show active executions that haven't been dismissed — mismo set de
      // estados que hasExecutionInProcess (arriba), para no perder banners que
      // ese chequeo sí considera "en proceso".
      return ['running', 'pending', 'queued', 'processing'].includes(execution.status) &&
             !dismissedExecutionBanners.has(execution.id);
    });
  }, [documentContent?.executions, documentExecutions, effectiveSelectedExecutionId, dismissedExecutionBanners, currentExecutionId, currentExecutionMode]);

  // Une la ejecución de versión nueva recién creada (setNewVersionExecutionId en
  // handleExecutionCreated) con las que /content ya reporta como activas,
  // deduplicando por id — así el banner "otra versión generando" aparece en el
  // instante del click, sin esperar a que /content refresque la lista de
  // ejecuciones (que puede tardar más que el propio backend en registrar la
  // ejecución como activa).
  const bannerExecutions = useMemo(() => {
    if (
      !newVersionExecutionId ||
      dismissedExecutionBanners.has(newVersionExecutionId) ||
      newVersionExecutionId === effectiveSelectedExecutionId ||
      otherVersionActiveExecutions.some((e: any) => e.id === newVersionExecutionId)
    ) {
      return otherVersionActiveExecutions;
    }
    const known = allExecutions?.find((e: any) => e.id === newVersionExecutionId);
    // Si ya apareció en /content pero con un status que no es "activo" (p.ej.
    // completó entre el click y este refetch), no la forzamos: mismo criterio
    // de estados que usa otherVersionActiveExecutions arriba, para no dejar un
    // banner de "completado" pegado para siempre.
    if (known && !['running', 'pending', 'queued', 'processing'].includes(known.status)) {
      return otherVersionActiveExecutions;
    }
    // Todavía no está en /content ni en la lista de ejecuciones — nombre
    // provisorio traducido en vez del "Version {id}" que usa el fallback de
    // más abajo para ejecuciones sin nombre ya conocidas.
    const placeholder = known ?? {
      id: newVersionExecutionId,
      name: t('execute:otherVersionBanner.newVersionFallback'),
      status: 'running',
    };
    return [placeholder, ...otherVersionActiveExecutions];
  }, [otherVersionActiveExecutions, newVersionExecutionId, dismissedExecutionBanners, effectiveSelectedExecutionId, allExecutions, t]);

  // Check if the currently selected version is actively executing
  const isSelectedVersionExecuting = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;

    if (!executions || !effectiveSelectedExecutionId) {
      return null;
    }

    const selectedExecution = executions.find((execution: any) =>
      execution.id === effectiveSelectedExecutionId &&
      ['running', 'pending', 'importing', 'import_failed'].includes(execution.status)
    );

    return selectedExecution || null;
  }, [documentContent?.executions, documentExecutions, effectiveSelectedExecutionId]);

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

  // Reset initialization tracking when the selected document changes.
  // selectedExecutionId is managed by useAssetNavigation (it resets to null on file-tree
  // navigation and preserves the URL-provided execution on direct URL access) so we must
  // NOT call setSelectedExecutionId(null) here, otherwise the URL-supplied execution would
  // be wiped out before the document query has a chance to use it.
  useEffect(() => {
    hasInitializedExecutionRef.current = null;
  }, [selectedFile?.id]);

  // Sync selectedExecutionId with the execution that was loaded by the backend
  // This only happens ONCE per document to set the initial state, preventing duplicate API calls
  useEffect(() => {
    // Also handle the case where execution_id is null but there is an importing execution
    // (import-from-file sets execution_id = null until the import finishes)
    const importingExecution = documentContent?.executions?.find(
      (e: any) => e.status === 'importing'
    );
    const resolvedExecutionId = documentContent?.execution_id || importingExecution?.id;

    // Only sync if:
    // 1. We have document content with an execution_id OR an importing execution
    // 2. selectedExecutionId is currently null (no manual selection yet)
    // 3. We haven't already initialized for this document
    if (
      selectedFile?.type === 'document' &&
      resolvedExecutionId &&
      !selectedExecutionId &&
      hasInitializedExecutionRef.current !== selectedFile.id
    ) {
      logger.log('🔄 Syncing selectedExecutionId with loaded execution:', resolvedExecutionId);

      // Copy the already-loaded data to the new queryKey to prevent duplicate API call
      queryClient.setQueryData(
        ['document-content', selectedFile.id, resolvedExecutionId],
        documentContent
      );

      setSelectedExecutionId(resolvedExecutionId);
      hasInitializedExecutionRef.current = selectedFile.id;
    }
  }, [selectedFile?.id, selectedFile?.type, documentContent?.execution_id, documentContent?.executions, selectedExecutionId, queryClient]);
  
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
        
        logger.log(`Auto-switching to latest completed execution: ${mostRecentExecution.id}`);
        setSelectedExecutionId(mostRecentExecution.id);
        
        // Force refresh of document content with the new execution
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, mostRecentExecution.id] });
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
        }, 100);
      }
    }
  }, [selectedFile, documentContent, documentExecutions, selectedExecutionId, setSelectedExecutionId, queryClient]); */



  // Build table of contents from section names
  const tocItems = useMemo(() => {
    if (!documentContent?.content || !Array.isArray(documentContent.content)) return [];
    return (documentContent.content as ContentSection[]).map((section, index) => ({
      id: `section-${index}`,
      title: section.section_name || `Section ${index + 1}`,
      level: 1,
      hasPendingSuggestion: section.ai_suggestion_status === 'completed',
    }));
  }, [documentContent?.content]);

  // Scroll to section when selectedSectionId is set (e.g. from a shared URL)
  const hasScrolledToSectionRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !selectedSectionId ||
      !documentContent?.content ||
      !Array.isArray(documentContent.content) ||
      hasScrolledToSectionRef.current === selectedSectionId
    ) return;

    // Find the index of the section with the matching section_id
    const sectionIndex = (documentContent.content as ContentSection[]).findIndex(
      (section) => section.section_id === selectedSectionId || section.id === selectedSectionId
    );

    if (sectionIndex === -1) return;

    // Mark as handled so we don't re-scroll on every re-render
    hasScrolledToSectionRef.current = selectedSectionId;

    // Wait for DOM to render the section elements
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(`section-${sectionIndex}`);
      if (element) {
        const SCROLL_OFFSET = 40;
        const viewport = element.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (viewport) {
          const elementTop = element.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
          viewport.scrollTo({ top: elementTop - SCROLL_OFFSET, behavior: 'smooth' });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Clear section from URL after scrolling so it doesn't persist
        setSelectedSectionId?.(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedSectionId, documentContent?.content]);

  // Reset scroll tracking when the document changes
  useEffect(() => {
    hasScrolledToSectionRef.current = null;
  }, [selectedFile?.id]);

  // Discussions badge count — same query key as each section's DiscussionSync,
  // so this dedupes against the editor's own fetch instead of adding one.
  const { discussions: allDiscussions } = useDiscussions(
    canListDiscussions ? selectedFile?.id : undefined
  );
  const openDiscussionsCount = useMemo(
    () => allDiscussions.filter((d) => !d.isResolved).length,
    [allDiscussions]
  );

  // Navigate from the discussions panel to the thread's section and activate it.
  const handleFocusDiscussion = useCallback(
    (discussionId: string, sectionExecutionId: string | null | undefined) => {
      setIsDiscussionsSheetOpen(false);

      if (!sectionExecutionId) {
        toast.info(t('content.discussions.threadNoSection'));
        return;
      }

      const sectionList = documentContent?.content;
      const index = Array.isArray(sectionList)
        ? (sectionList as ContentSection[]).findIndex((s) => s.id === sectionExecutionId)
        : -1;

      if (index === -1) {
        toast.info(t('content.discussions.sectionNotInVersion'));
        return;
      }

      const element = document.getElementById(`section-${index}`);
      if (!element) {
        toast.info(t('content.discussions.sectionHidden'));
        return;
      }

      requestFocus(discussionId, sectionExecutionId);

      const SCROLL_OFFSET = 40;
      const viewport = element.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        const elementTop = element.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
        viewport.scrollTo({ top: elementTop - SCROLL_OFFSET, behavior: 'smooth' });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [documentContent?.content, requestFocus, t]
  );

  const handleDiscussionFocusResolved = useCallback(
    (outcome: 'activated' | 'mark-missing') => {
      if (outcome === 'mark-missing') {
        toast.info(t('content.discussions.threadNotHighlighted'));
      }
    },
    [t]
  );

  const sectionOptionsForExecutionDialog = useMemo(() => {
    const optionsById = new Map<string, string>();

    if (fullDocument?.sections?.length) {
      fullDocument.sections.forEach((section: { id?: string; name?: string }) => {
        if (!section.id) return;
        optionsById.set(section.id, section.name || t('section.untitled'));
      });
    }

    if (Array.isArray(documentContent?.content)) {
      documentContent.content.forEach((section: ContentSection, index: number) => {
        if (!section.section_id) return;

        const existingName = optionsById.get(section.section_id);
        if (existingName && existingName !== t('section.untitled')) {
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

  // Handle copy section link to clipboard
  const handleCopySectionLink = useCallback((sectionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('section', sectionId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      toast.success(t('section.linkCopied'));
    });
  }, [t]);

  // Handle export to markdown
  const handleExportMarkdown = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToMarkdown(documentContent.execution_id, selectedOrganizationId!);
      } catch (error) {
        handleApiError(error, { fallbackMessage: t('mutations.exportFailed') });
      }
    }
  };

  // Handle export to word
  const handleExportWord = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToWord(documentContent.execution_id, selectedOrganizationId!);
      } catch (error) {
        handleApiError(error, { fallbackMessage: t('mutations.exportFailed') });
      }
    }
  };
  
  // Handle export to custom word
  const handleExportCustomWord = () => {
    setIsCustomWordExportDialogOpen(true);
  };

  // Handle export to excel
  const handleExportExcel = async () => {
    if (documentContent?.execution_id) {
      try {
        await exportExecutionToExcel(documentContent.execution_id, selectedOrganizationId!);
      } catch (error) {
        handleApiError(error, { fallbackMessage: t('mutations.exportFailed') });
      }
    }
  };

  // Handle export version configuration (JSON) — reusable via import-config
  const handleExportVersion = async () => {
    const executionId = selectedExecutionId || documentContent?.execution_id;
    if (!executionId || !selectedOrganizationId) return;
    try {
      await exportDocuments(selectedOrganizationId, { execution_ids: [executionId] });
    } catch (error) {
      handleApiError(error, { fallbackMessage: t('mutations.exportFailed') });
    }
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
    toast.success(t('mutations.customFieldCreated'));
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

  function openCloneToNewDocumentDialog() {
    preserveScrollPosition();
    setIsCloneToNewDocumentDialogOpen(true);
  }

  function closeCloneToNewDocumentDialog() {
    setIsCloneToNewDocumentDialogOpen(false);
  }

  const handleCloneToNewDocumentDialogChange = (open: boolean) => {
    if (open) {
      openCloneToNewDocumentDialog();
    } else {
      closeCloneToNewDocumentDialog();
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

  const handleDeleteDocument = async () => {
    if (selectedFile) {
      try {
        await deleteDocument(selectedFile.id, selectedOrganizationId!);
        logger.log('Document deleted successfully:', selectedFile.id);
        toast.success(t('mutations.documentDeletedNamed', { name: selectedFile.name }));
        
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
        logger.error('Error deleting document:', error);
        toast.error(t('mutations.documentDeleteFailed'));
      }
    }
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
              <EmptyTitle>{t('content.welcomeTitle')}</EmptyTitle>
              <EmptyDescription>
                {(canAccessTemplates && canCreate('template')) || (canAccessAssets && canCreate('asset'))
                  ? t('content.welcomeDescriptionWithPermissions')
                  : t('content.welcomeDescriptionNoPermissions')
                }
              </EmptyDescription>
              <EmptyActions>
                {canAccessTemplates && canCreate('template') && (
                  <HuemulButton
                    onClick={() => {
                      onPreserveScroll?.();
                      setIsCreateTemplateSheetOpen(true);
                    }}
                    variant="outline"
                    icon={FileCode}
                    iconClassName="h-4 w-4"
                    label={t('content.createTemplate')}
                  />
                )}
                {canAccessAssets && canCreate('asset') && (
                  <HuemulButton
                    onClick={() => {
                      onPreserveScroll?.();
                      openCreateAssetDialog(currentFolderId);
                    }}
                    className="bg-[#4464f7] hover:bg-[#3451e6]"
                    icon={FileText}
                    iconClassName="h-4 w-4"
                    label={t('content.createAsset')}
                  />
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
    <DiscussionFocusProvider onResolve={handleDiscussionFocusResolved}>
    <ResizablePanelGroup direction="horizontal" className=" bg-gray-50">
      {/* Document Content */}
      <ResizablePanel defaultSize={80}>
        <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header with Toggle */}
        {isMobile && !isContentError && (
          <div className="bg-white border-b border-gray-200 shadow-sm py-2 px-4 z-(--z-page-header) shrink-0 min-h-20" data-mobile-header>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <HuemulButton
                  onClick={onToggleSidebar}
                  variant="ghost"
                  size="sm"
                  icon={FolderTree}
                  iconClassName="h-5 w-5"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  tooltip={t('content.showFileTree')}
                />
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
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {documentContent?.document_name || selectedFile.name}
                        </span>
                        {showEditorActions && (
                          <HuemulButton
                            requiredAccess="edit"
                            checkGlobalPermissions={true}
                            resource="asset"
                            lifecyclePermissions={lifecyclePermissions}
                            onClick={openEditDialog}
                            size="sm"
                            variant="ghost"
                            icon={Pencil}
                            iconClassName="h-3 w-3"
                            tooltip={t('content.editDocument')}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          />
                        )}
                      </div>
                    </div>
                    {/* Always reserve space for execution info to prevent layout shift */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 min-h-4.5">
                      {selectedExecutionInfo && (
                        <>
                          <span className="text-xs">{selectedExecutionInfo.formattedDate}</span>
                          {selectedExecutionInfo.isLatest && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              {t('content.latest')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {documentContent?.lifecycle_status && (
                      <div className="flex items-center gap-1.5 flex-wrap bg-gray-50 px-2 py-1 rounded-lg">
                        <HuemulLifecycleStageBadge status={documentContent.lifecycle_status} />
                        <HuemulLifecycleActions controller={lifecycle} variant="compact" showRerunExternalPublish />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Table of Contents Toggle - Mobile */}
              {selectedFile?.type === 'document' && documentContent?.content && tocItems.length > 0 && (
                <HuemulButton
                  onClick={() => setIsTocSidebarOpen(!isTocSidebarOpen)}
                  variant="ghost"
                  size="sm"
                  icon={List}
                  iconClassName="h-5 w-5"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  tooltip={isTocSidebarOpen ? t('content.hideSidebar') : t('content.showSidebar')}
                />
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
              {/* Mode Toggle - Mobile */}
              {canSwitchToEditorMode && (
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg gap-0.5">
                  <HuemulButton
                    size="sm"
                    variant="ghost"
                    onClick={() => { preserveScrollPosition(); setIsViewMode(true); }}
                    icon={Eye}
                    iconClassName="h-3.5 w-3.5"
                    className={`h-7 w-7 p-0 rounded-md transition-all ${
                      isViewMode
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    tooltip={t('content.readerMode')}
                  />
                  <HuemulButton
                    size="sm"
                    variant="ghost"
                    onClick={() => { preserveScrollPosition(); setIsViewMode(false); }}
                    icon={Pencil}
                    iconClassName="h-3.5 w-3.5"
                    className={`h-7 w-7 p-0 rounded-md transition-all ${
                      !isViewMode
                        ? 'bg-white text-[#4464f7] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    tooltip={t('content.editorMode')}
                  />
                </div>
              )}

              {/* Mobile action: create new version. El propio HuemulButton hace el
                  AND lifecycle × RBAC (requiredAccess + checkGlobalPermissions +
                  resource), así que no hace falta repetir la condición afuera
                  — y repetirla con `!lifecyclePermissions ||` la abría de más. */}
              <HuemulButton
                requiredAccess={["create"]}
                requireAll={false}
                checkGlobalPermissions={true}
                resource="asset"
                lifecyclePermissions={lifecyclePermissions}
                size="sm"
                onClick={handleCreateExecutionFromHeader}
                disabled={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate}
                className={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate
                  ? "h-8 w-8 p-0 bg-gray-300 text-gray-500 border-none cursor-not-allowed shadow-sm rounded-full"
                  : "h-8 w-8 p-0 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer shadow-sm rounded-full"
                }
                title={executeDocumentMutation.isPending || hasExecutionInProcess
                  ? t('content.cannotExecuteInProgress')
                  : !canGenerate
                    ? cannotGenerateReason
                    : t('content.executeNewVersion')
                }
              >
                {executeDocumentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </HuemulButton>
              
              {frontendPermissions.canAccessSectionSheet && (
                <SectionSheet
                  selectedFile={selectedFile}
                  fullDocument={fullDocument}
                  documentName={documentContent?.document_name}
                  isOpen={isSectionSheetOpen}
                  onOpenChange={handleSectionSheetOpenChange}
                  isMobile={isMobile}
                  executionId={selectedExecutionId}
                  executionInfo={selectedExecutionInfo}
                  lifecyclePermissions={lifecyclePermissions}
                  stage={documentContent?.lifecycle_status?.stage}
                />
              )}
              
              {frontendPermissions.canAccessSectionSheet && (
                <DependenciesSheet
                  selectedFile={selectedFile}
                  isOpen={isDependenciesSheetOpen}
                  onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    if (!open) preserveScrollPosition();
                    setIsDependenciesSheetOpen(open);
                  }}
                  isMobile={isMobile}
                  documentName={documentContent?.document_name}
                  lifecyclePermissions={lifecyclePermissions}
                  stage={documentContent?.lifecycle_status?.stage}
                />
              )}
              
              {frontendPermissions.canAccessSectionSheet && (
                <ContextSheet
                  selectedFile={selectedFile}
                  isOpen={isContextSheetOpen}
                  onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    if (!open) preserveScrollPosition();
                    setIsContextSheetOpen(open);
                  }}
                  isMobile={isMobile}
                  documentName={documentContent?.document_name}
                  lifecyclePermissions={lifecyclePermissions}
                  stage={documentContent?.lifecycle_status?.stage}
                />
              )}
              
              {/* Secondary Action Buttons */}
              {/* Execution Dropdown - only show for documents with executions */}
              {selectedFile.type === 'document' && allExecutions?.length > 0 && (
                <DocumentAccessControl
                  requiredAccess="read"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <HuemulButton
                        requiredAccess="read"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors text-xs"
                        title={t('content.switchVersion')}
                      >
                        <span className="font-medium">
                          {(() => {
                            if (!allExecutions) return 'v1';
                            // Use selectedExecutionId if available, otherwise use documentContent.execution_id (the default loaded execution)
                            const targetId = selectedExecutionId || documentContent?.execution_id;
                            const selectedExecution = allExecutions.find((exec: any) => exec.id === targetId);
                            const label = getExecutionDisplayLabel(selectedExecution);
                            if (label) {
                              return label.length > 15 ? `${label.substring(0, 15)}...` : label;
                            }
                            // Fallback to version number if no name
                            const sortedExecutions = [...allExecutions].sort((a: { created_at: string }, b: { created_at: string }) => 
                              parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                            );
                            const index = sortedExecutions.findIndex((exec: any) => exec.id === targetId);
                            return index !== -1 ? `v${sortedExecutions.length - index}` : 'v1';
                          })()
                          }
                        </span>
                      </HuemulButton>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900">{t('content.documentVersions')}</p>
                      <p className="text-xs text-gray-500">{t('content.selectVersion')}</p>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                    {allExecutions
                      .sort((a: { created_at: string }, b: { created_at: string }) => 
                        parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
                      )
                      .map((execution: { id: string; created_at: string; name: string; status: string; version?: string | null }, index: number) => {
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
                            onClick={() => guardedAction(() => {
                              // Preserve scroll position before changing execution
                              preserveScrollPosition();
                              setSelectedExecutionId(execution.id);
                              // Invalidate all document-content queries and refetch with new execution ID
                              queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                              queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, execution.id] });
                            })}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  isSelected ? 'text-[#4464f7]' : 'text-gray-900'
                                }`}>
                                  {getExecutionDisplayLabel(execution)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isLatest && (
                                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    {t('content.latest')}
                                  </div>
                                )}
                                {isApproved && (
                                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    {t('content.approved')}
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
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="hover:cursor-pointer p-2 gap-2 text-gray-700 hover:bg-gray-50"
                      onSelect={() => setTimeout(() => setIsVersionManagementSheetOpen(true), 0)}
                    >
                      <Settings2 className="h-4 w-4" />
                      <span className="text-xs font-medium">{t('content.manageVersions')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </DocumentAccessControl>
              )}
              
              {/* Discussions Button - Mobile */}
              {canListDiscussions && (
                <div className="relative">
                  <HuemulButton
                    size="sm"
                    variant="ghost"
                    icon={MessageSquareText}
                    iconClassName="h-4 w-4"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                    tooltip={t('content.discussions.commentsTooltip')}
                    onClick={() => setIsDiscussionsSheetOpen(true)}
                  />
                  {openDiscussionsCount > 0 && (
                    <span className="-top-0.5 -right-0.5 absolute inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-medium text-[10px] text-white">
                      {openDiscussionsCount}
                    </span>
                  )}
                </div>
              )}

              {/* Refresh Button - Mobile */}
              <HuemulButton
                size="sm"
                variant="ghost"
                onClick={handleRefreshContent}
                disabled={isRefreshingContent || isLoadingContent}
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                title={t('content.refreshContent')}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingContent ? 'animate-spin' : ''}`} />
              </HuemulButton>
              
              {/* Clone Button - create permission only (lifecycle × RBAC) */}
              {lifecyclePermissions?.create && can('createVersion') && selectedExecutionId && (
                <HuemulButton
                  onClick={() => void setTimeout(() => openCloneDialog(), 0)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                  title={t('content.cloneExecution')}
                >
                  <Copy className="h-4 w-4" />
                </HuemulButton>
              )}
              
              {/* Export Dropdown - available to any user with lifecycle permissions + RBAC de lectura */}
              {!isViewOnly && can('exportVersion') && (lifecyclePermissions?.view || lifecyclePermissions?.create || lifecyclePermissions?.edit || lifecyclePermissions?.review || lifecyclePermissions?.approve || lifecyclePermissions?.publish || lifecyclePermissions?.archive) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <HuemulButton
                      size="sm"
                      variant="ghost"
                      icon={Download}
                      iconClassName="h-4 w-4"
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors rounded-full"
                      tooltip={t('content.exportOptions')}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!documentContent?.template_name && canCreate('template') && (
                      <>
                        <DropdownMenuItem
                          onSelect={() => setTimeout(() => setIsCreateTemplateFromDocumentDialogOpen(true), 0)}
                          className="hover:cursor-pointer"
                        >
                          <FileCode className="mr-2 h-4 w-4" />
                          {t('content.createTemplateFromAsset')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportMarkdown(), 0)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('content.exportAsMarkdown')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportWord(), 0)}>
                      <FileCode className="mr-2 h-4 w-4" />
                      {t('content.exportAsWord')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportCustomWord(), 0)}>
                      <FileCode className="mr-2 h-4 w-4" />
                      {t('content.exportAsCustomWord')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setTimeout(() => handleExportExcel(), 0)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {t('content.exportAsExcel')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Delete Options - edit or create permission + edit stage + asset:d */}
              {(lifecyclePermissions?.edit || lifecyclePermissions?.create) && can('deleteVersion') && documentContent?.lifecycle_status?.stage === 'edit' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <HuemulButton
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      iconClassName="h-4 w-4"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors rounded-full"
                      tooltip={t('content.deleteOptions')}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {selectedExecutionId && (
                      <DropdownMenuItem
                        onSelect={() => setTimeout(() => openDeleteDialog('execution'), 0)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('content.deleteVersion')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => setTimeout(() => openDeleteDialog('document'), 0)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                    >
                      <FileX className="mr-2 h-4 w-4" />
                      {t('content.deleteDocumentLabel')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

            </div>
            )}
          </div>
        )}
        
        {/* Header Section */}
        {!isMobile && !isContentError && (
        <div className="bg-white border-b border-gray-200 shadow-sm py-3 px-5 md:px-6 z-(--z-page-header) shrink-0" data-desktop-header>
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
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h1 className="text-lg font-semibold text-gray-900 truncate cursor-default">{documentContent?.document_name || selectedFile.name}</h1>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md">
                              <p>{documentContent?.document_name || selectedFile.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <HuemulButton
                          requiredAccess="edit"
                          checkGlobalPermissions={true}
                          resource="asset"
                          lifecyclePermissions={lifecyclePermissions}
                          onClick={openEditDialog}
                          size="sm"
                          variant="ghost"
                          icon={Pencil}
                          iconClassName="h-3.5 w-3.5"
                          tooltip={t('content.editDocument')}
                          tooltipSide="right"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        />

                      </div>
                      {/* Mode Toggle + Version dropdown + More Options — always in the same position for muscle memory */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canSwitchToEditorMode && (
                          <ViewModeToggle
                            isViewMode={isViewMode}
                            onSwitchToReader={() => { preserveScrollPosition(); setIsViewMode(true); }}
                            onSwitchToEditor={() => { preserveScrollPosition(); setIsViewMode(false); }}
                          />
                        )}
                        {selectedFile.type === 'document' && allExecutions?.length > 0 && (
                          <VersionSelectorDropdown
                            allExecutions={allExecutions}
                            selectedExecutionId={selectedExecutionId}
                            documentExecutionId={documentContent?.execution_id}
                            lifecyclePermissions={lifecyclePermissions}
                            isCreatingPending={executeDocumentMutation.isPending}
                            hasExecutionInProcess={hasExecutionInProcess}
                            canGenerate={canGenerate}
                            cannotGenerateReason={cannotGenerateReason}
                            onCreateExecution={handleCreateExecutionFromHeader}
                            onSelectExecution={(id) => guardedAction(() => {
                              onPreserveScroll?.();
                              setSelectedExecutionId(id);
                              queryClient.removeQueries({ queryKey: ['document-content', selectedFile?.id] });
                              queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, id] });
                            })}
                            onOpenVersionManagement={() => setIsVersionManagementSheetOpen(true)}
                            onRenameVersion={frontendPermissions.canEditSections ? (exec) => {
                              setExecutionToRename({ id: exec.id, name: exec.name });
                              setTimeout(() => setIsRenameVersionDialogOpen(true), 0);
                            } : undefined}
                            dropdownAlign="end"
                          />
                        )}
                        {canListDiscussions && (
                          <div className="relative">
                            <HuemulButton
                              size="sm"
                              variant="ghost"
                              icon={MessageSquareText}
                              iconClassName="h-4 w-4"
                              className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                              tooltip={t('content.discussions.commentsTooltip')}
                              onClick={() => setIsDiscussionsSheetOpen(true)}
                            />
                            {openDiscussionsCount > 0 && (
                              <span className="-top-0.5 -right-0.5 absolute inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-medium text-[10px] text-white">
                                {openDiscussionsCount}
                              </span>
                            )}
                          </div>
                        )}
                        {canListNotifications && (
                          <HuemulButton
                            size="sm"
                            variant="ghost"
                            icon={Bell}
                            iconClassName="h-4 w-4"
                            className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                            tooltip={t('content.notificationsTooltip')}
                            onClick={() => setIsNotificationsSheetOpen(true)}
                          />
                        )}
                        {!isViewOnly && (
                          <MoreOptionsDropdown
                            isViewMode={isViewMode}
                            dropdownAlign="end"
                            lifecyclePermissions={lifecyclePermissions}
                            frontendPermissions={frontendPermissions}
                            lifecycleStatus={documentContent?.lifecycle_status}
                            finalLifecycleStage={lifecycle.finalLifecycleStage}
                            selectedExecutionId={selectedExecutionId}
                            hasTemplateName={!!documentContent?.template_name}
                            canCreateTemplate={canCreate('template')}
                            canManageGrants={can('manageAssetLifecycleGrants')}
                            canCloneVersion={can('createVersion')}
                            canExportVersion={can('exportVersion')}
                            canDeleteVersion={can('deleteVersion')}
                            isRefreshing={isRefreshingContent}
                            isLoadingContent={isLoadingContent}
                            hasTocItems={!!documentContent?.content}
                            isDocumentType={selectedFile.type === 'document'}
                            hasDocumentContent={!!documentContent?.content}
                            isTocSidebarOpen={isTocSidebarOpen}
                            canCompareVersions={selectedFile.type === 'document' && allExecutions?.length > 1}
                            onAssignVersion={() => lifecycle.setIsAssignVersionDialogOpen(true)}
                            onCompareVersions={() => setIsVersionCompareSheetOpen(true)}
                            onRejectLifecycle={() => lifecycle.setIsRejectDialogOpen(true)}
                            onCheckLifecycle={() => lifecycle.setIsCheckDialogOpen(true)}
                            onPublish={() => lifecycle.setIsPublishDialogOpen(true)}
                            onArchive={() => lifecycle.setIsArchiveDialogOpen(true)}
                            onRestore={() => lifecycle.setIsRestoreDialogOpen(true)}
                            onRefresh={handleRefreshContent}
                            onToggleToc={() => setIsTocSidebarOpen((prev) => !prev)}
                            onOpenInfo={() => setIsInfoSheetOpen(true)}
                            onOpenLifecycleHistory={() => setIsLifecycleHistorySheetOpen(true)}
                            canAccessDiagrams={canAccessDiagrams}
                            onOpenDiagrams={() => setIsDiagramsSheetOpen(true)}
                            onOpenPermissions={() => setIsPermissionsSheetOpen(true)}
                            onOpenSections={() => setIsSectionSheetOpen(true)}
                            onOpenDependencies={() => setIsDependenciesSheetOpen(true)}
                            onOpenContext={() => setIsContextSheetOpen(true)}
                            onClone={() => openCloneDialog()}
                            onCloneToNew={() => openCloneToNewDocumentDialog()}
                            onCreateTemplate={() => setIsCreateTemplateFromDocumentDialogOpen(true)}
                            onExportMarkdown={handleExportMarkdown}
                            onExportWord={handleExportWord}
                            onExportCustomWord={handleExportCustomWord}
                            onExportExcel={handleExportExcel}
                            onExportVersion={handleExportVersion}
                            onDeleteVersion={() => openDeleteDialog('execution')}
                            onDeleteDocument={() => openDeleteDialog('document')}
                            isRerunningExternalPublish={lifecycle.runExternalPublishMutation.isPending}
                            onRerunExternalPublish={() => lifecycle.runExternalPublishMutation.mutate()}
                          />
                        )}
                      </div>
                    </div>

                    {/* Metadata Row - date/badges left, lifecycle buttons right (both modes) */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: date + stage badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                        {selectedExecutionInfo && (
                          <>
                            <span>{selectedExecutionInfo.formattedDate}</span>
                            {selectedExecutionInfo.isLatest && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                {t('content.latest')}
                              </span>
                            )}
                          </>
                        )}
                        {documentContent?.lifecycle_status && (
                          <>
                            <span className="text-gray-400">•</span>
                            <HuemulLifecycleStageBadge status={documentContent.lifecycle_status} />
                          </>
                        )}
                      </div>
                      {/* Right: lifecycle action buttons - always at end of line in both modes */}
                      <HuemulLifecycleActions controller={lifecycle} variant="row" />
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Section - editor mode only */}
            {!isViewMode && (isLoadingContent && !documentContent ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg">
                  <Skeleton className="h-7 w-10 rounded-md" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-7 w-18 rounded-md" />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg">
                  <Skeleton className="h-7 w-26.5 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                  <Skeleton className="h-7 w-8 rounded-md" />
                </div>
              </div>
            ) : (
            <div className="flex items-center justify-between gap-2 animate-in fade-in duration-300">
              {/* LEFT GROUP - Sections, Dependencies, Context */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg min-w-0">
                {/* Sections sheet */}
                {frontendPermissions.canAccessSectionSheet && (
                  <SectionSheet
                    selectedFile={selectedFile}
                    fullDocument={fullDocument}
                    isOpen={isSectionSheetOpen}
                    onOpenChange={handleSectionSheetOpenChange}
                    executionId={selectedExecutionId}
                    executionInfo={selectedExecutionInfo}
                    lifecyclePermissions={lifecyclePermissions}
                    stage={documentContent?.lifecycle_status?.stage}
                    showTrigger={frontendPermissions.canEditSections && !isViewMode}
                  />
                )}

                {/* Dependencies, Context */}
                {frontendPermissions.canAccessSectionSheet && (
                  <DependenciesSheet
                    selectedFile={selectedFile}
                    isOpen={isDependenciesSheetOpen}
                    onOpenChange={setIsDependenciesSheetOpen}
                    documentName={documentContent?.document_name}
                    lifecyclePermissions={lifecyclePermissions}
                    stage={documentContent?.lifecycle_status?.stage}
                    showTrigger={frontendPermissions.canEditSections && !isViewMode}
                  />
                )}

                {frontendPermissions.canAccessSectionSheet && (
                  <ContextSheet
                    selectedFile={selectedFile}
                    isOpen={isContextSheetOpen}
                    onOpenChange={setIsContextSheetOpen}
                    documentName={documentContent?.document_name}
                    lifecyclePermissions={lifecyclePermissions}
                    stage={documentContent?.lifecycle_status?.stage}
                    showTrigger={frontendPermissions.canEditSections && !isViewMode}
                  />
                )}
              </div>

              {/* RIGHT GROUP - Refresh, TOC Toggle */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg min-w-0">
                <HuemulButton
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshContent}
                  disabled={isRefreshingContent || isLoadingContent}
                  icon={RefreshCw}
                  iconClassName={`h-3.5 w-3.5 ${isRefreshingContent ? 'animate-spin' : ''}`}
                  className="h-7 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors hover:cursor-pointer"
                  tooltip={t('content.refreshContent')}
                />

                {/* TOC Toggle button - desktop only */}
                {selectedFile.type === 'document' && documentContent?.content &&
                 (!isSelectedVersionExecuting || (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))) && (
                  <HuemulButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsTocSidebarOpen((prev) => !prev)}
                    icon={List}
                    iconClassName="h-3.5 w-3.5"
                    className={`h-7 px-2 transition-colors hover:cursor-pointer ${
                      isTocSidebarOpen
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                    tooltip={isTocSidebarOpen ? t('content.hideSidebar') : t('content.showSidebar')}
                  />
                )}

              </div>
            </div>
            ))}
            
          </div>
        </div>
        )}

        {/* Content Section - Now with ScrollArea and scroll restoration */}
        <div className="flex-1 bg-white min-w-0 overflow-hidden px-1">
          <ScrollArea className="h-full max-w-full">
            <div 
              ref={scrollRestoration.viewportRef}
              className={`${isViewMode ? 'pt-2 md:pt-3 pb-4 md:pb-5' : 'py-4 md:py-5'} px-4 md:px-6 contain-[inline-size]`}
            >
            {selectedFile.type === 'document' ? (
              <>
                {/* Other Version Execution Banners - includes full/full-single modes */}
                {bannerExecutions.length > 0 && (
                  <div className="sticky top-0 z-(--z-page-sticky-elevated) mb-4 space-y-2">
                    {bannerExecutions.map((execution: any) => (
                      <OtherVersionExecutionBanner
                        key={execution.id}
                        executionId={execution.id}
                        executionName={execution.name || `Version ${execution.id.substring(0, 8)}`}
                        onDismiss={() => {
                          setDismissedExecutionBanners(prev => new Set(prev).add(execution.id));
                          if (execution.id === newVersionExecutionId) setNewVersionExecutionId(null);
                        }}
                        onViewVersion={() => {
                          // Preserve scroll position before changing execution
                          guardedAction(() => {
                            preserveScrollPosition();
                            setSelectedExecutionId(execution.id);
                            queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id, execution.id] });
                          });
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
                  <div className="sticky top-0 z-(--z-page-sticky-elevated) mb-4">
                    <ExecutionStatusBanner
                      executionId={isSelectedVersionExecuting.id}
                      onExecutionComplete={() => {
                        logger.log('🔄 Current version execution completed, refreshing content...');
                        
                        // Invalidate and refetch all relevant queries
                        queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['executions', selectedFile?.id] });
                        queryClient.invalidateQueries({ queryKey: ['execution-status', isSelectedVersionExecuting.id] });
                        
                        // When an import finishes the backend now has a real execution_id.
                        // Reset the initialization ref so the sync effect can pick the real
                        // execution_id on the next refetch, then refetch without an execution_id
                        // so the response carries the updated execution_id.
                        if (isSelectedVersionExecuting.status === 'importing' || !selectedExecutionId) {
                          hasInitializedExecutionRef.current = null;
                          setSelectedExecutionId(null);
                          queryClient.refetchQueries({ queryKey: ['document-content', selectedFile?.id] });
                        } else {
                          // Refetch immediately
                          queryClient.refetchQueries({ queryKey: ['document-content', selectedFile?.id, selectedExecutionId] });
                        }
                      }}
                    />
                  </div>
                )}

                {/* Single/from progress banner — un único banner por corrida (no uno por
                    sección, ver ia context del rediseño de feedback de ejecución).
                    `key={executionRunToken}` fuerza un remount limpio en cada disparo,
                    incluso re-ejecutando la misma sección: sin esto, el estado local del
                    banner (toast ya mostrado, dismiss) sobrevivía a la corrida nueva y el
                    banner de "completado" aparecía de inmediato. */}
                {currentExecutionId && executionRunToken && (currentExecutionMode === 'single' || currentExecutionMode === 'from') &&
                 executionRun.phase !== 'idle' && (
                  <div className="sticky top-0 z-(--z-page-sticky-elevated) mb-4">
                    <ExecutionRunProgressBanner
                      key={executionRunToken}
                      runToken={executionRunToken}
                      phase={executionRun.phase}
                      progress={executionRun.progress}
                      executionMode={currentExecutionMode}
                      currentSectionName={executionRun.currentSectionName}
                      failureMessage={executionRun.failureMessage}
                      isAwaitingFreshContent={isRunAwaitingFreshContent}
                      onRefresh={handleRefreshExecutionRun}
                    />
                  </div>
                )}

                {isLoadingContent || sectionAccess.isLoading ? (
                  // Show skeleton loader with consistent height to prevent layout shift.
                  // También cubre sectionAccess: sin la lista de secciones con `view`, no hay
                  // forma de saber si alguna del array de /content debe ocultarse.
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
                      <span className="ml-2 text-sm text-gray-500">{t('content.loadingDocument')}</span>
                    </div>
                  </div>
                ) : isContentError ? (
                  // Show error state when content fails to load
                  <ContentErrorState 
                    error={contentError}
                    onRetry={() => refetchContent()}
                  />
                ) : !canViewContent ? (
                  // Show access-denied state when user has no lifecycle permissions on this document
                  <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
                    <div className="text-center max-w-sm">
                      <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100">
                        <Lock className="h-7 w-7 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('content.accessRestricted')}</h3>
                      <p className="text-sm text-gray-500">
                        {t('content.accessRestrictedDescription')}
                      </p>
                    </div>
                  </div>
                ) : isSelectedVersionExecuting && isSelectedVersionExecuting.status !== 'import_failed' && !dismissedExecutionBanners.has(isSelectedVersionExecuting.id) && !(currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) ? (
                  // Show skeleton when viewing a version that is currently executing (full/full-single mode ONLY) — not for import_failed
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
                        <span className="ml-2 text-sm text-blue-600 font-medium">{t('content.generatingContent')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Lógica mejorada para manejar diferentes estados de ejecución
                  (() => {
                    // Check if the current execution has failed
                    const hasFailedExecution = selectedExecutionInfo?.status === 'failed';
                    const hasImportFailed = selectedExecutionInfo?.status === 'import_failed';
                    
                    // Si no hay ejecuciones o no hay contenido
                    if ((!documentExecutions || documentExecutions.length === 0) || (!documentContent?.content)) {
                      return (
                        <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
                          <Empty className="max-w-full">
                            <div className="p-8 text-center">
                              {hasImportFailed ? (
                                <div className="max-w-full mx-auto">
                                  <div className="bg-linear-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
                                    <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-4 border-red-200">
                                      <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-red-900 mb-3">
                                      {t('content.importFailed')}
                                    </h3>
                                    <p className="text-base text-red-800/90 mb-2 leading-relaxed max-w-full mx-auto">
                                      {selectedExecutionInfo?.status_message || t('content.importFailedDescription')}
                                    </p>
                                    <p className="text-xs text-red-600/70 mt-6">
                                      {t('content.supportedFormats')}
                                    </p>
                                  </div>
                                </div>
                              ) : hasFailedExecution ? (
                                <>
                                  <div className="max-w-full mx-auto">
                                    <div className="bg-linear-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
                                      {/* Icon Container with Animation */}
                                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-4 border-red-200">
                                        <AlertCircle className="h-8 w-8 text-red-600 animate-pulse" />
                                      </div>
                                      
                                      {/* Title */}
                                      <h3 className="text-2xl font-bold text-red-900 mb-3">
                                        {t('content.executionFailed')}
                                      </h3>
                                      
                                      {/* Description */}
                                      <p className="text-base text-red-800/90 mb-6 leading-relaxed max-w-full mx-auto">
                                        {isMissingDependencyFailure(selectedExecutionInfo?.status_message)
                                          ? t('content.executionFailedMissingDependencyDescription')
                                          : t('content.executionFailedDescription')}
                                      </p>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <HuemulButton
                                          requiredAccess={["create"]}
                                          requireAll={false}
                                          checkGlobalPermissions={true}
                                          resource="version"
                                          lifecyclePermissions={lifecyclePermissions}
                                          onClick={handleCreateExecutionFromHeader}
                                          disabled={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate}
                                          size="lg"
                                          title={!canGenerate ? cannotGenerateReason : undefined}
                                          className={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate
                                            ? "hover:cursor-not-allowed bg-gray-300 text-gray-500"
                                            : "hover:cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                                          }
                                        >
                                          {executeDocumentMutation.isPending ? (
                                            <>
                                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                              {t('content.retrying')}
                                            </>
                                          ) : (
                                            <>
                                              <RefreshCw className="h-5 w-5 mr-2" />
                                              {t('content.retryExecution')}
                                            </>
                                          )}
                                        </HuemulButton>
                                        <HuemulButton
                                          requiredAccess={["edit", "create"]}
                                          requireAll={false}
                                          checkGlobalPermissions={true}
                                          resource="section"
                                          lifecyclePermissions={lifecyclePermissions}
                                          onClick={() => {
                                            preserveScrollPosition();
                                            setIsSectionSheetOpen(true);
                                          }}
                                          variant="outline"
                                          size="lg"
                                          className="border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
                                        >
                                          <Pencil className="h-5 w-5 mr-2" />
                                          {t('content.editSections')}
                                        </HuemulButton>
                                      </div>
                                      
                                      {/* Additional Help Text */}
                                      <p className="text-xs text-red-600/70 mt-6">
                                        {t('content.commonIssues')}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <EmptyIcon>
                                    <Zap className="h-12 w-12" />
                                  </EmptyIcon>
                                  <EmptyTitle>{t('content.setupDocument', { name: documentContent?.document_name || selectedFile.name })}</EmptyTitle>
                                  <EmptyDescription>
                                    {!canGenerate
                                      ? cannotGenerateReason
                                      : fullDocument?.sections?.length > 0
                                        ? t('content.readyWithAi')
                                        : t('content.readyWithSections')
                                    }
                                  </EmptyDescription>
                                  {!hasFailedExecution && !hasImportFailed && (
                                    <EmptyActions>
                                      {fullDocument?.sections?.length === 0 ? (
                                        <HuemulButton
                                          requiredAccess={["edit", "create"]}
                                          requireAll={false}
                                          checkGlobalPermissions={true}
                                          resource="section"
                                          lifecyclePermissions={lifecyclePermissions}
                                          onClick={() => setIsSectionSheetOpen(true)}
                                          className="hover:cursor-pointer bg-[#4464f7] hover:bg-[#3451e6]"
                                        >
                                          <BetweenHorizontalStart className="h-4 w-4 mr-2" />
                                          {t('content.addSections')}
                                        </HuemulButton>
                                      ) : (
                                        <>
                                          <HuemulButton
                                            requiredAccess={["create"]}
                                            requireAll={false}
                                            checkGlobalPermissions={true}
                                            resource="version"
                                            lifecyclePermissions={lifecyclePermissions}
                                            onClick={handleCreateExecutionFromHeader}
                                            disabled={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate}
                                            title={!canGenerate ? cannotGenerateReason : undefined}
                                            className={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate
                                              ? "hover:cursor-not-allowed bg-gray-300 text-gray-500"
                                              : "bg-[#4464f7] hover:bg-[#3451e6]"
                                            }
                                          >
                                            {executeDocumentMutation.isPending ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t('common:executing')}
                                              </>
                                            ) : (
                                              <>
                                                <Zap className="h-4 w-4 mr-2" />
                                                {hasNewPendingExecution ? t('content.startExecution') : hasPendingExecution ? t('content.continueExecution') : t('content.generateContent')}
                                              </>
                                            )}
                                          </HuemulButton>
                                          {isCannotGenerateMissingContext && frontendPermissions.canAccessSectionSheet && (
                                            <HuemulButton
                                              variant="outline"
                                              onClick={() => {
                                                preserveScrollPosition();
                                                setIsContextSheetOpen(true);
                                              }}
                                            >
                                              <BookOpen className="h-4 w-4 mr-2" />
                                              {t('content.configureContext')}
                                            </HuemulButton>
                                          )}
                                          <HuemulButton
                                            requiredAccess={["edit", "create"]}
                                            requireAll={false}
                                            checkGlobalPermissions={true}
                                            resource="section"
                                            lifecyclePermissions={lifecyclePermissions}
                                            onClick={() => {
                                              onPreserveScroll?.();
                                              setIsSectionSheetOpen(true);
                                            }}
                                            variant="outline"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('content.addMoreSections')}
                                          </HuemulButton>
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
                        <MediaUrlProvider freshUrls={mediaUrlsData?.media_urls ?? null}>
                        <MentionRefsProvider assetIds={mentionAssetIds} organizationId={selectedOrganizationId ?? undefined}>
                        <RoleRefsProvider enabled={hasRoleReferences}>
                        <DocumentDataProvider documentContent={documentContent} executions={allExecutions} relationships={relationshipsData?.data} documentTypeNames={documentTypeNames} isLoaded>
                        <div className={`prose prose-gray prose-sm md:prose-base max-w-full${isViewMode ? ' [&>*+*]:mt-0' : ''}`}>
                          {/* Template instructions callout - shown once at the top */}
                          {documentContent.template_instructions?.trim() && (
                            <div className="not-prose mb-4">
                              <HuemulExpandableText
                                collapsible
                                text={documentContent.template_instructions.trim()}
                                collapsedLines={1}
                                expandedMaxHeight={100}
                                showMoreLabel={t('content.instructionsShowMore')}
                                showLessLabel={t('content.instructionsShowLess')}
                                triggerClassName="rounded-lg border border-gray-200 bg-white px-3 py-2"
                                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5"
                                leading={
                                  <span className="flex items-center gap-1.5 shrink-0">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {t('content.instructionsTitle')}
                                    </span>
                                  </span>
                                }
                              />
                            </div>
                          )}
                          {Array.isArray(documentContent.content) ? (
                            // New format: array of sections with separators.
                            // Lista extraída y memoizada — ver assets-sections-list.tsx
                            // para el porqué (evitar que cada re-render de AssetContent
                            // recorra y reconstruya las N secciones). El check de
                            // formato sigue sobre `documentContent.content` (no sobre
                            // `deferredContent`) para que TS siga angostando ese mismo
                            // campo al formato legado (string) en la rama `else` de
                            // abajo — angostar una expresión distinta (deferredContent)
                            // no angosta esta.
                            <AssetsSectionsList
                              content={deferredContent ?? documentContent.content}
                              sectionEmptiness={sectionEmptiness}
                              isViewMode={isViewMode}
                              showEditorActions={showEditorActions}
                              canEditSections={frontendPermissions.canEditSections}
                              isMobile={isMobile}
                              sectionAccess={sectionAccess}
                              documentId={selectedFile?.id}
                              currentExecutionId={currentExecutionId}
                              currentExecutionMode={currentExecutionMode}
                              selectedExecutionId={selectedExecutionId}
                              selectedExecutionStatus={selectedExecutionInfo?.status}
                              isSectionInScope={executionRun.isSectionInScope}
                              getDisplaySectionStatus={getDisplaySectionStatus}
                              canGenerate={canGenerate}
                              cannotGenerateReason={cannotGenerateReason}
                              onSectionUpdate={handleSectionUpdate}
                              onAddSectionAtPosition={handleAddSectionAtPosition}
                              onExecutionStartForSection={handleSectionExecutionStart}
                              onOpenExecuteSheetForSection={handleCreateExecutionFromSection}
                              onCreateSectionFromSelectionForSection={handleCreateSectionFromSelection}
                              onCopyLink={handleCopySectionLink}
                            />
                          ) : (
                            // Legacy format: single string content
                            <Markdown>{documentContent.content}</Markdown>
                          )}
                        </div>
                        </DocumentDataProvider>
                        </RoleRefsProvider>
                        </MentionRefsProvider>
                        </MediaUrlProvider>
                      );
                    }

                    // Si no hay contenido disponible, mostrar mensaje
                    return (
                      <div className="flex items-center justify-center h-full min-h-100">
                        <div className="text-center">
                          <File className="h-16 w-16 mx-auto mb-4 opacity-40" style={{ color: '#4464f7' }} />
                          <p className="text-lg font-medium text-gray-500">{t('content.noContentTitle')}</p>
                          <p className="text-sm text-gray-400 mt-1 mb-6">{t('content.noContentDescription')}</p>
                          
                          <div className="flex gap-3 justify-center">
                            <HuemulButton
                              requiredAccess={["edit", "create"]}
                              requireAll={false}
                              checkGlobalPermissions={true}
                              resource="section"
                              lifecyclePermissions={lifecyclePermissions}
                              variant="outline" 
                              onClick={handleAddSection}
                              className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200"
                            >
                              <BetweenHorizontalStart className="h-4 w-4 mr-2" />
                              {t('content.addSection')}
                            </HuemulButton>
                            
                            <HuemulButton
                              requiredAccess={["edit", "create"]}
                              requireAll={false}
                              checkGlobalPermissions={true}
                              resource="version"
                              lifecyclePermissions={lifecyclePermissions}
                              variant="outline"
                              onClick={handleCreateExecutionFromHeader}
                              disabled={executeDocumentMutation.isPending || hasExecutionInProcess || !canGenerate}
                              title={!canGenerate ? cannotGenerateReason : undefined}
                              className="hover:cursor-pointer border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {executeDocumentMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t('common:executing')}
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  {t('content.executeNewVersion')}
                                </>
                              )}
                            </HuemulButton>
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
                  <strong>{t('content.itemId')}</strong> {selectedFile.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('content.itemName')}</strong> {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('content.itemType')}</strong> {selectedFile.type}
                </p>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
        </div>
      </ResizablePanel>

      {/* Table of Contents Sidebar - only show for documents with content and not during full/full-single executions */}
      {selectedFile.type === 'document' && documentContent?.content &&
       isTocSidebarOpen &&
       (!isSelectedVersionExecuting || (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'))) && (
        <>
          <ResizableHandle/>
          <ResizablePanel defaultSize={20}>
            <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
                {/* Header con tabs — banda gris a sangre */}
                <div className="shrink-0 bg-muted/50 border-b border-border px-3 py-2.5">
                  <div className={cn("grid w-full gap-1", canListCustomFields ? "grid-cols-2" : "grid-cols-1")}>
                    <button
                      onClick={() => setActiveTab('toc')}
                      className={cn(
                        "flex items-center justify-center text-xs py-1.5 px-2 rounded-md transition-all hover:cursor-pointer",
                        activeTab === 'toc'
                          ? "bg-background border border-border shadow-sm text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="line-clamp-2 text-center leading-tight">{t('content.contentTab')}</span>
                    </button>
                    {canListCustomFields && (
                      <button
                        onClick={() => setActiveTab('custom-fields')}
                        className={cn(
                          "flex items-center justify-center text-xs py-1.5 px-2 rounded-md transition-all hover:cursor-pointer",
                          activeTab === 'custom-fields'
                            ? "bg-background border border-border shadow-sm text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="line-clamp-2 text-center leading-tight">{t('content.customFieldsTab')}</span>
                      </button>
                    )}
                  </div>
                </div>
                {activeTab === 'toc' || !canListCustomFields ? (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2">
                      <TableOfContents items={tocItems} />
                    </div>
                    {canListExecutionRelationships && (
                      <AssetsRelatedDocuments
                        organizationId={selectedOrganizationId}
                        executionId={selectedExecutionId || documentContent?.execution_id}
                        currentDocumentId={selectedFile?.id}
                        versionLabel={getExecutionDisplayLabel(selectedExecutionInfo)}
                        canOpenDiagrams={can('openDiagramsCanvas')}
                        canListAssetTypes={can('listAssetTypes')}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex-1 min-h-0 overflow-hidden">
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
                      canCreate={frontendPermissions.canEditSections}
                      canUpdate={frontendPermissions.canEditSections}
                      canDelete={frontendPermissions.canEditSections}
                      page={customFieldsPage}
                      pageSize={CUSTOM_FIELDS_PAGE_SIZE}
                      totalItems={customFieldsData?.total}
                      hasNext={customFieldsData?.has_next}
                      onPageChange={setCustomFieldsPage}
                    />
                  </div>
                )}
              </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>

      <ChatbotContextSync
        sourceKey="asset-content"
        executionId={documentContent?.execution_id}
        documentId={selectedFile?.id}
        assetName={
          selectedFile?.id
            ? (() => {
                const displayName = documentContent?.document_name || selectedFile.name;
                return documentContent?.execution_id && selectedExecutionInfo
                  ? `${getExecutionDisplayLabel(selectedExecutionInfo) || selectedExecutionInfo.formattedDate} - ${displayName}`
                  : displayName;
              })()
            : undefined
        }
        enabled={Boolean(documentContent && documentContent.content && selectedFile?.id)}
        priority={20}
      />

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
      <AddSectionExecutionSheet
        open={isSectionExecutionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSectionExecutionDialogOpen(false)
            setSectionFromSelectionContent(null)
          }
        }}
        afterFromSectionId={afterFromSectionId}
        existingSections={sectionOptionsForExecutionDialog}
        documentId={selectedFile?.id}
        onSubmit={handleSectionExecutionSubmit}
        isPending={createSectionExecutionMutation.isPending}
        onClose={() => {
          setIsSectionExecutionDialogOpen(false)
          setAfterFromSectionId(null)
          setSectionFromSelectionContent(null)
        }}
        defaultType={sectionFromSelectionContent ? 'manual' : undefined}
        defaultManualInput={sectionFromSelectionContent || undefined}
      />

      {/* Delete Confirmation AlertDialog */}
      <ContentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        deleteType={deleteType}
        documentName={selectedFile?.name}
        executionFormattedDate={selectedExecutionInfo?.formattedDate}
        onAction={async () => {
          if (deleteType === 'document') {
            await handleDeleteDocument();
          } else {
            await deleteExecutionMutation.mutateAsync();
          }
        }}
      />

      {/* Clone Confirmation AlertDialog */}
      <CloneExecutionDialog
        open={isCloneDialogOpen}
        onOpenChange={handleCloneDialogChange}
        executionName={selectedExecutionInfo?.name}
        onAction={() => cloneMutation.mutateAsync()}
      />

      {/* Clone to New Document Dialog */}
      <CloneToNewDocumentDialog
        open={isCloneToNewDocumentDialogOpen}
        onOpenChange={handleCloneToNewDocumentDialogChange}
        onConfirm={(options) => cloneToNewDocumentMutation.mutate(options)}
        isProcessing={cloneToNewDocumentMutation.isPending}
        organizationId={selectedOrganizationId!}
      />

      {/* Approve Confirmation AlertDialog */}
      <ApproveExecutionDialog
        open={isApproveDialogOpen}
        onOpenChange={handleApproveDialogChange}
        executionName={selectedExecutionInfo?.name}
        onAction={() => approveMutation.mutateAsync()}
      />

      {/* Disapprove Confirmation AlertDialog */}
      <DisapproveExecutionDialog
        open={isDisapproveDialogOpen}
        onOpenChange={handleDisapproveDialogChange}
        executionName={selectedExecutionInfo?.name}
        onAction={() => disapproveMutation.mutateAsync()}
      />

      <HuemulLifecycleSheets
        controller={lifecycle}
        executionId={selectedExecutionId || documentContent?.execution_id}
        organizationId={selectedOrganizationId}
        existingVersions={allExecutions?.map((e: { version?: string | null }) => e.version).filter((v: string | null | undefined): v is string => !!v)}
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
        isMobile={isMobile}
        selectedExecutionId={selectedExecutionId}
        executionContext={executionContext}
        disabled={hasExecutionInProcess || !canGenerate || !fullDocument?.sections || fullDocument.sections.length === 0 || !defaultLLM?.id}
        disabledReason={
          hasExecutionInProcess
            ? t('content.executionRunning')
            : !canGenerate
              ? cannotGenerateReason
              : !fullDocument?.sections || fullDocument.sections.length === 0
                ? t('content.needsSections')
                : !defaultLLM?.id
                  ? t('content.noDefaultLlm')
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

      {/* Add Custom Field Document Sheet */}
      <AddCustomFieldDocumentSheet
        isOpen={isAddCustomFieldDocumentDialogOpen}
        onClose={() => setIsAddCustomFieldDocumentDialogOpen(false)}
        documentId={selectedFile.id}
        onAdd={handleCreateCustomFieldDocument}
        onImageUploadStart={handleImageUploadStart}
        onImageUploadComplete={handleImageUploadComplete}
        canCreateCustomField={canCreateCustomField}
      />

      {/* Edit Custom Field Document Sheet (Unified) */}
      <EditCustomFieldAssetSheet
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
      <DeleteCustomFieldDialog
        open={isDeleteCustomFieldDocumentDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelDeleteCustomFieldDocument();
        }}
        fieldName={customFieldDocumentToDelete?.name}
        onAction={handleConfirmDeleteCustomFieldDocument}
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

      {/* Rename Version Dialog */}
      <RenameVersionDialog
        open={isRenameVersionDialogOpen}
        onOpenChange={(open) => {
          if (!renameVersionMutation.isPending) {
            setIsRenameVersionDialogOpen(open);
            if (!open) setExecutionToRename(null);
          }
        }}
        currentName={executionToRename?.name || ''}
        onConfirm={(name) => {
          if (executionToRename) {
            renameVersionMutation.mutate({ executionId: executionToRename.id, name });
          }
        }}
        isProcessing={renameVersionMutation.isPending}
      />

      {/* Asset Permissions Sheet */}
      {/* Defensa en profundidad: el gate real vive dentro del sheet (se monta
          también desde nav-knowledge-provider), acá solo se evita montarlo. */}
      {can('manageAssetLifecycleGrants') && (
        <AssetLifecycleSheet
          asset={selectedFile?.type === 'document' ? { id: selectedFile.id, name: documentContent?.document_name || selectedFile.name, document_type_id: documentContent?.document_type?.id ?? selectedFile.document_type?.id ?? null } : null}
          open={isPermissionsSheetOpen}
          onOpenChange={setIsPermissionsSheetOpen}
        />
      )}

      {/* Asset Info Sheet */}
      <AssetsInfoSheet
        open={isInfoSheetOpen}
        onOpenChange={setIsInfoSheetOpen}
        documentContent={documentContent}
        selectedExecutionInfo={selectedExecutionInfo}
        canViewTags={canViewTags}
        canManageTags={canManageTags}
      />

      {/* Version Management Sheet */}
      {allExecutions && selectedOrganizationId && (
        <VersionManagementSheet
          open={isVersionManagementSheetOpen}
          onOpenChange={setIsVersionManagementSheetOpen}
          executions={allExecutions}
          organizationId={selectedOrganizationId}
          documentId={selectedFile?.id ?? ''}
          canEdit={!!(lifecyclePermissions?.create && lifecyclePermissions?.edit)}
          initialExecutionId={selectedExecutionId || documentContent?.execution_id}
        />
      )}

      {/* Version Compare Sheet */}
      {allExecutions && allExecutions.length > 1 && selectedFile && selectedOrganizationId && (
        <AssetVersionCompareSheet
          key={versionCompareOverride ? `${versionCompareOverride.left}-${versionCompareOverride.right}` : 'default'}
          open={isVersionCompareSheetOpen}
          onOpenChange={(open) => {
            setIsVersionCompareSheetOpen(open);
            if (!open) setVersionCompareOverride(null);
          }}
          documentId={selectedFile.id}
          executions={allExecutions}
          defaultRightExecutionId={versionCompareOverride?.right ?? selectedExecutionId ?? documentContent?.execution_id}
          defaultLeftExecutionId={versionCompareOverride?.left}
        />
      )}

      {/* Notifications Sheet */}
      {canListNotifications && (
        <AssetsNotificationsSheet
          open={isNotificationsSheetOpen}
          onOpenChange={setIsNotificationsSheetOpen}
          documentId={selectedFile?.id ?? ''}
          executionId={selectedExecutionId}
          organizationId={selectedOrganizationId ?? ''}
          allExecutions={allExecutions}
        />
      )}

      {/* Lifecycle History Sheet */}
      <LifecycleHistorySheet
        open={isLifecycleHistorySheetOpen}
        onOpenChange={setIsLifecycleHistorySheetOpen}
        executionId={selectedExecutionId || documentContent?.execution_id || ''}
        organizationId={selectedOrganizationId ?? ''}
        allExecutions={allExecutions ?? []}
      />

      {/* Related Diagrams Sheet */}
      <AssetDiagramsSheet
        open={isDiagramsSheetOpen}
        onOpenChange={setIsDiagramsSheetOpen}
        documentId={selectedFile?.id ?? ''}
        organizationId={selectedOrganizationId ?? ''}
        executionId={selectedExecutionId || documentContent?.execution_id || ''}
      />

      {/* Discussions Sheet */}
      {canListDiscussions && selectedFile && (
        <AssetsDiscussionsSheet
          open={isDiscussionsSheetOpen}
          onOpenChange={setIsDiscussionsSheetOpen}
          documentId={selectedFile.id}
          sections={Array.isArray(documentContent?.content) ? (documentContent.content as ContentSection[]) : []}
          onFocusDiscussion={handleFocusDiscussion}
        />
      )}
    </DiscussionFocusProvider>
  );
}
