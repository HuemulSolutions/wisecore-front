/**
 * Custom hook for managing custom field document operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createCustomFieldDocument,
  updateCustomFieldDocument,
  deleteCustomFieldDocument,
} from '@/services/custom-fieldds-documents';

interface UseCustomFieldMutationsProps {
  selectedFileId?: string;
}

export function useCustomFieldMutations({ selectedFileId }: UseCustomFieldMutationsProps) {
  const queryClient = useQueryClient();

  // Mutation for creating custom field document
  const createCustomFieldDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      return createCustomFieldDocument(data);
    },
    onSuccess: (createdField) => {
      if (createdField.data_type !== 'image') {
        queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFileId] });
        toast.success('Custom field document created successfully!');
      }
      return createdField;
    },
  });

  // Mutation for updating custom field document
  const updateCustomFieldDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return updateCustomFieldDocument(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFileId] });
      toast.success('Custom field document updated successfully!');
    },
  });

  // Mutation for deleting custom field document
  const deleteCustomFieldDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteCustomFieldDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-documents', selectedFileId] });
      toast.success('Custom field document deleted successfully!');
    },
  });

  return {
    createCustomFieldDocumentMutation,
    updateCustomFieldDocumentMutation,
    deleteCustomFieldDocumentMutation,
  };
}
