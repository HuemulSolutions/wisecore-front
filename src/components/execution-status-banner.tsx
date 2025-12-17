import { useEffect } from 'react';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useExecutionPolling } from '@/hooks/useExecutionPolling';
import { useOrganization } from '@/contexts/organization-context';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface ExecutionStatusBannerProps {
  executionId: string | null;
  onExecutionComplete?: (completedExecutionId?: string) => void;
  className?: string;
}

export function ExecutionStatusBanner({
  executionId,
  onExecutionComplete,
  className
}: ExecutionStatusBannerProps) {
  console.log('ExecutionStatusBanner rendering with executionId:', executionId);
  
  // Intentar obtener el status desde el cache de documentContent primero
  useOrganization();
  const queryClient = useQueryClient();
  
  // Buscar en cache del documentContent para evitar llamada extra
  const getCachedExecutionStatus = () => {
    const cachedQueries = queryClient.getQueriesData({ queryKey: ['document-content'] });
    for (const [, data] of cachedQueries) {
      if (data && typeof data === 'object' && 'executions' in data) {
        const executions = (data as any).executions;
        if (Array.isArray(executions)) {
          const execution = executions.find((exec: any) => exec.id === executionId);
          if (execution) {
            return execution;
          }
        }
      }
    }
    return null;
  };
  
  const cachedExecution = getCachedExecutionStatus();
  
  // Solo hacer polling si no tenemos datos cached o si están obsoletos
  const { execution, stopPolling, invalidateExecution, error } = useExecutionPolling({
    executionId,
    enabled: !!executionId, // Siempre habilitado para tener datos frescos
    pollingInterval: 15000, // Siempre hacer polling para ejecuciones activas
    onStatusChange: (status, executionData) => {
      console.log('Banner - Execution status changed:', status, executionData);
      
      try {
        if (status === 'completed') {
          toast.success('Document generation completed successfully!');
          onExecutionComplete?.(executionData?.execution_id || executionId);
          stopPolling();
        } else if (status === 'failed') {
          toast.error('Document generation failed. Please try again.');
          stopPolling();
        }
      } catch (error) {
        console.error('Error in status change handler:', error);
      }
    }
  });
  
  // Usar cached execution si está disponible, sino usar el del polling
  const currentExecution = cachedExecution || execution;

  console.log('Banner - Current execution:', currentExecution, 'from cache:', !!cachedExecution);
  
  // Handle polling errors
  useEffect(() => {
    if (error && !cachedExecution) {
      console.error('Execution polling error:', error);
      toast.error('Error checking execution status. Please refresh the page.');
    }
  }, [error, cachedExecution]);

  // Don't show banner if no execution or if execution is in final state
  if (!currentExecution || ['completed', 'approved'].includes(currentExecution.status)) {
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
          text: 'Generating content...',
          description: 'Your document is being generated. This may take a few minutes.',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
          descriptionColor: 'text-blue-700'
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 text-amber-600" />,
          text: 'Execution pending',
          description: 'Your execution is waiting to start.',
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-900',
          descriptionColor: 'text-amber-700'
        };
      case 'queued':
        return {
          icon: <Clock className="h-4 w-4 text-orange-600" />,
          text: 'In queue',
          description: 'Your execution is queued and will start soon.',
          bgColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-900',
          descriptionColor: 'text-orange-700'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          text: 'Generation failed',
          description: 'There was an error generating your document. Please try again.',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          descriptionColor: 'text-red-700'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-600" />,
          text: `Status: ${status}`,
          description: 'Processing your request...',
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-900',
          descriptionColor: 'text-gray-700'
        };
    }
  };

  const statusConfig = getStatusConfig(currentExecution.status);

  return (
    <Card className={cn(
      'border-l-4',
      statusConfig.bgColor,
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div className="flex-1">
              <h3 className={cn('text-sm font-medium', statusConfig.textColor)}>
                {statusConfig.text}
              </h3>
              <p className={cn('text-xs mt-1', statusConfig.descriptionColor)}>
                {statusConfig.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentExecution.status === 'running' && (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                Processing
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={invalidateExecution}
              className="text-xs hover:cursor-pointer"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}