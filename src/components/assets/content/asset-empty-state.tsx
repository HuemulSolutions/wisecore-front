import { File as FileIcon, FolderIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-organization" | "permission-denied" | "loading-error";
  onRetry?: () => void;
  onChangeOrganization?: () => void;
}

/**
 * Component for displaying empty or error states in the assets page
 */
export function AssetEmptyState({ type, onRetry, onChangeOrganization }: EmptyStateProps) {
  if (type === "no-organization") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
            <FolderIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organización Requerida</h2>
          <p className="text-sm text-gray-600">
            Por favor selecciona una organización para ver los assets.
          </p>
        </div>
      </div>
    );
  }

  if (type === "permission-denied") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full">
            <FileIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            No tienes los permisos necesarios para acceder a los assets de esta organización.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Por favor contacta a tu administrador para que te asigne el rol apropiado.
          </p>
          <div className="space-y-3">
            {onChangeOrganization && (
              <Button
                variant="outline"
                size="sm"
                onClick={onChangeOrganization}
                className="hover:cursor-pointer w-full"
              >
                Cambiar Organización
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === "loading-error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg p-8 mx-2">
        <p className="text-red-600 mb-4 font-medium text-sm">
          Failed to load assets
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          There was an error loading the content. Please try again.
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="hover:cursor-pointer h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return null;
}
