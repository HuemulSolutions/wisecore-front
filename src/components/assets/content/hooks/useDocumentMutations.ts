/**
 * Custom hook for document-related mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteDocument } from '@/services/assets';
import { createSection, updateSectionsOrder } from '@/services/section';
import { 
  executeDocument,
  approveExecution,
  disapproveExecution,
  deleteExecution,
  cloneExecution
} from '@/services/executions';
import { createSectionExecution } from '@/services/section_execution';
import { useTranslation } from 'react-i18next';

interface UseDocumentMutationsProps {
  selectedFileId?: string;
  selectedOrganizationId?: string;
  onPreserveScroll?: () => void;
  fullDocument?: any;
}

export function useDocumentMutations({ 
  selectedFileId, 
  selectedOrganizationId,
  onPreserveScroll,
  fullDocument
}: UseDocumentMutationsProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('assets');

  const preserveScrollPosition = () => {
    onPreserveScroll?.();
  };

  // Mutation for direct section creation
  const addSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      preserveScrollPosition();
      
      const { order, ...createData } = sectionData;
      const newSection = await createSection(createData, selectedOrganizationId!);
      
      if (order !== undefined) {
        const existingSections = [...(fullDocument?.sections || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        let sectionsWithOrder: { section_id: string; order: number }[] = [];
        
        if (order === -1) {
          sectionsWithOrder.push({ section_id: newSection.id, order: 1 });
          existingSections.forEach((s: any, index: number) => {
            sectionsWithOrder.push({ section_id: s.id, order: index + 2 });
          });
        } else if (existingSections.length > 0) {
          existingSections.forEach((s: any, index: number) => {
            if (index <= order) {
              sectionsWithOrder.push({ section_id: s.id, order: index + 1 });
            } else {
              sectionsWithOrder.push({ section_id: s.id, order: index + 2 });
            }
          });
          sectionsWithOrder.push({ section_id: newSection.id, order: order + 2 });
        } else {
          sectionsWithOrder.push({ section_id: newSection.id, order: 1 });
        }
        
        sectionsWithOrder.sort((a, b) => a.order - b.order);
        await updateSectionsOrder(sectionsWithOrder, selectedOrganizationId!);
      }
      
      return newSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success(t('mutations.sectionCreated'));
    },
  });

  // Mutation for section execution creation
  const createSectionExecutionMutation = useMutation({
    mutationFn: async ({ executionId, sectionData }: { executionId: string; sectionData: any }) => {
      return await createSectionExecution(executionId, sectionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFileId] });
      toast.success(t('mutations.sectionAdded'));
    },
  });

  // Mutation for executing document
  const executeDocumentMutation = useMutation({
    mutationFn: async ({ documentId, llmId, instructions }: { documentId: string; llmId: string; instructions?: string }) => {
      preserveScrollPosition();
      return await executeDocument({
        documentId,
        llmId,
        instructions: instructions || "",
        organizationId: selectedOrganizationId!
      });
    },
    onSuccess: (executionData) => {
      toast.success(t('mutations.executionStarted'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
      return executionData;
    },
  });

  // Mutation for approve execution
  const approveMutation = useMutation({
    mutationFn: async (executionId: string) => {
      preserveScrollPosition();
      return approveExecution(executionId, selectedOrganizationId!);
    },
    onSuccess: () => {
      toast.success(t('mutations.executionApproved'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
    },
  });

  // Mutation for disapprove execution
  const disapproveMutation = useMutation({
    mutationFn: async (executionId: string) => {
      preserveScrollPosition();
      return disapproveExecution(executionId, selectedOrganizationId!);
    },
    onSuccess: () => {
      toast.success(t('mutations.executionDisapproved'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
    },
  });

  // Mutation for deleting execution
  const deleteExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      preserveScrollPosition();
      return deleteExecution(executionId, selectedOrganizationId!);
    },
    onSuccess: () => {
      toast.success(t('mutations.executionDeleted'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
    },
  });

  // Mutation for clone execution
  const cloneMutation = useMutation({
    mutationFn: async (executionId: string) => {
      preserveScrollPosition();
      return cloneExecution(executionId, selectedOrganizationId!);
    },
    onSuccess: (clonedExecution) => {
      toast.success(t('mutations.executionCloned'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['executions', selectedFileId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFileId] });
      return clonedExecution;
    },
  });

  // Mutation for deleting document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return deleteDocument(documentId, selectedOrganizationId!);
    },
    onSuccess: () => {
      toast.success(t('mutations.documentDeleted'));
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['document-content'] });
    },
  });

  return {
    addSectionMutation,
    createSectionExecutionMutation,
    executeDocumentMutation,
    approveMutation,
    disapproveMutation,
    deleteExecutionMutation,
    cloneMutation,
    deleteDocumentMutation,
  };
}
