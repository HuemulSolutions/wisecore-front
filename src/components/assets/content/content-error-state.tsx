import { AlertCircle, RefreshCw, Lock, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/types/api-error";

interface ContentErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ContentErrorState({ error, onRetry }: ContentErrorStateProps) {
  // Determinar tipo de error para mostrar icono/mensaje apropiado
  const isAccessError = ApiError.isApiError(error) && 
    (error.statusCode === 403 || error.statusCode === 401);
  const isNotFoundError = ApiError.isApiError(error) && error.statusCode === 404;
  
  const Icon = isAccessError ? Lock : isNotFoundError ? FileX : AlertCircle;
  const title = isAccessError 
    ? "Access Denied" 
    : isNotFoundError 
      ? "Document Not Found"
      : "Error Loading Content";
  const description = ApiError.isApiError(error) 
    ? error.message 
    : "There was an error loading the document content.";
  
  return (
    <div className="h-full flex items-center justify-center min-h-[calc(100vh-300px)] p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <Icon className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        {onRetry && !isAccessError && (
          <Button onClick={onRetry} variant="outline" className="hover:cursor-pointer">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
