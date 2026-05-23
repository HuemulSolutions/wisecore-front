export interface ExecutionStatusBannerProps {
  executionId: string | null;
  onExecutionComplete?: (completedExecutionId?: string) => void;
  className?: string;
}
