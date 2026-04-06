import { AlertCircle, RefreshCw, Lock, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/types/api-error";
import { useTranslation } from "react-i18next";

interface ContentErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ContentErrorState({ error, onRetry }: ContentErrorStateProps) {
  const { t } = useTranslation('assets');

  // Determinar tipo de error para mostrar icono/mensaje apropiado
  const isAccessError = ApiError.isApiError(error) && 
    (error.statusCode === 403 || error.statusCode === 401);
  const isNotFoundError = ApiError.isApiError(error) && error.statusCode === 404;
  
  const Icon = isAccessError ? Lock : isNotFoundError ? FileX : AlertCircle;
  const title = isAccessError 
    ? t('contentError.accessDenied')
    : isNotFoundError 
      ? t('contentError.documentNotFound')
      : t('contentError.errorLoading');
  const description = ApiError.isApiError(error) 
    ? error.message 
    : t('contentError.defaultDescription');
  
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
            {t('contentError.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );
}
