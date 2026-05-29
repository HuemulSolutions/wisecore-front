export interface ExecutionInfoProps {
  execution: {
    id: string;
    document_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  onRefresh?: () => void;
  isGenerating: boolean;
}

export interface ExecutionStatusBannerProps {
  executionId: string | null;
  onExecutionComplete?: (completedExecutionId?: string) => void;
  className?: string;
}
