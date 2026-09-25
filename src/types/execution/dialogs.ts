export interface ExecutionConfig {
  instructions: string;
  llmModel: string;
}

export interface ExecutionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'single' | 'from';
  onExecute: (config: ExecutionConfig) => void;
  isExecuting?: boolean;
}

export interface DeleteExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}
