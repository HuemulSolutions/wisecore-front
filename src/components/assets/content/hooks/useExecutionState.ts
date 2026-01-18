/**
 * Custom hook for managing execution state and tracking
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UseExecutionStateProps {
  selectedFileId?: string;
  selectedOrganizationId?: string;
  documentContent?: any;
  documentExecutions?: any[];
  selectedExecutionId: string | null;
  // setSelectedExecutionId is intentionally not used internally - 
  // it's passed down for external state management
  setSelectedExecutionId: (id: string | null) => void;
}

export function useExecutionState({
  selectedFileId,
  selectedOrganizationId,
  documentContent,
  documentExecutions,
  selectedExecutionId,
  // setSelectedExecutionId is intentionally unused internally
  // It's part of the interface for external state management
  setSelectedExecutionId: _setSelectedExecutionId,
}: UseExecutionStateProps) {
  // State for tracking current execution for polling
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [currentExecutionMode, setCurrentExecutionMode] = useState<'full' | 'single' | 'from' | 'full-single'>('full');
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | undefined>(undefined);
  
  // State for tracking active executions on other versions
  const [dismissedExecutionBanners, setDismissedExecutionBanners] = useState<Set<string>>(new Set());
  
  // Ref to track if we've already synced selectedExecutionId for this document
  const hasInitializedExecutionRef = useRef<string | null>(null);

  // Clear states when file changes
  useEffect(() => {
    setCurrentExecutionId(null);
    setCurrentExecutionMode('full');
    setCurrentSectionIndex(undefined);
    setDismissedExecutionBanners(new Set());
  }, [selectedFileId]);

  // Check if there's any execution in process
  const hasExecutionInProcess = useMemo(() => {
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
    return !pendingExecution.sections?.some((section: any) => 
      section.output && section.output.trim().length > 0
    );
  }, [documentContent?.executions, documentExecutions]);

  // Get active executions on other versions
  const otherVersionActiveExecutions = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    
    if (!executions || !selectedExecutionId) {
      return [];
    }

    return executions.filter((execution: any) => {
      if (execution.id === selectedExecutionId) return false;
      
      if (currentExecutionId && (currentExecutionMode === 'single' || currentExecutionMode === 'from')) {
        if (execution.id === currentExecutionId) return false;
      }
      
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

  // Get selected execution info
  const selectedExecutionInfo = useMemo(() => {
    const executions = documentContent?.executions || documentExecutions;
    
    if (!executions) {
      return null;
    }
    
    let selectedExecution;
    
    if (selectedExecutionId) {
      selectedExecution = executions.find((execution: any) => 
        execution.id === selectedExecutionId
      );
    } else {
      selectedExecution = documentContent?.execution_id 
        ? executions.find((execution: any) => execution.id === documentContent.execution_id)
        : null;
      
      if (!selectedExecution) {
        selectedExecution = executions.find((execution: any) => execution.status === 'approved') || executions[0];
      }
    }
    
    if (!selectedExecution) {
      return null;
    }
    
    return {
      ...selectedExecution,
      isLatest: executions[0]?.id === selectedExecution.id
    };
  }, [documentContent?.executions, documentContent?.execution_id, documentExecutions, selectedExecutionId]);

  // Poll current execution status for 'single' and 'from' modes
  const { data: currentExecutionStatus } = useQuery({
    queryKey: ['execution-status', currentExecutionId],
    queryFn: async () => {
      const { getExecutionStatus } = await import('@/services/executions');
      return getExecutionStatus(currentExecutionId!, selectedOrganizationId!);
    },
    enabled: !!currentExecutionId && !!selectedOrganizationId && (currentExecutionMode === 'single' || currentExecutionMode === 'from'),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return false;
      }
      return 2000;
    },
    refetchOnWindowFocus: false,
  });

  return {
    currentExecutionId,
    setCurrentExecutionId,
    currentExecutionMode,
    setCurrentExecutionMode,
    currentSectionIndex,
    setCurrentSectionIndex,
    dismissedExecutionBanners,
    setDismissedExecutionBanners,
    hasInitializedExecutionRef,
    hasExecutionInProcess,
    hasPendingExecution,
    hasNewPendingExecution,
    otherVersionActiveExecutions,
    isSelectedVersionExecuting,
    selectedExecutionInfo,
    currentExecutionStatus,
  };
}
