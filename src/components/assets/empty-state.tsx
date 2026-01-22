import { Folder as FolderIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: 'no-organization' | 'permission-error';
  onChangeOrganization?: () => void;
}

/**
 * Empty state components for different scenarios in the assets page
 */
export function EmptyState({ type, onChangeOrganization }: EmptyStateProps) {
  if (type === 'no-organization') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
            <FolderIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Organización Requerida
          </h2>
          <p className="text-sm text-gray-600">
            Por favor selecciona una organización para ver los assets.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'permission-error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full">
            <FileText className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            No tienes los permisos necesarios para acceder a los assets de esta organización.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Por favor contacta a tu administrador para que te asigne el rol apropiado.
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeOrganization}
              className="hover:cursor-pointer w-full"
            >
              Cambiar Organización
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
