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
