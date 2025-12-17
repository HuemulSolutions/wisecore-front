import { useAccessLevels, useDocumentAccess } from '@/hooks/useDocumentAccess'
import { DocumentAccessControl, DocumentActionButton } from '@/components/document-access-control'
import { Edit, Trash2, Download, Check, Play } from 'lucide-react'

interface DocumentActionsExampleProps {
  document: {
    id: string
    name: string
    access_levels?: string[]
    document_type?: {
      id: string
      name: string
      color: string
    }
  }
  onEdit?: () => void
  onDelete?: () => void
  onExport?: () => void
  onApprove?: () => void
  onExecute?: () => void
}

/**
 * Componente de ejemplo que muestra cómo usar el sistema de control de acceso
 * basado en los access levels de los documentos
 */
export function DocumentActionsExample({
  document,
  onEdit,
  onDelete,
  onExport,
  onApprove,
  onExecute
}: DocumentActionsExampleProps) {
  const { data: availableAccessLevels } = useAccessLevels()
  const { canEdit, canDelete, canRead, canApprove, hasAccess } = useDocumentAccess(document.access_levels)

  return (
    <div className="space-y-4">
      {/* Información del documento */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-lg font-semibold">{document.name}</h3>
        {document.document_type && (
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: document.document_type.color }}
            />
            <span className="text-sm text-gray-600">{document.document_type.name}</span>
          </div>
        )}
        
        {/* Access Levels del documento */}
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-700">Access Levels: </span>
          {document.access_levels?.length ? (
            <div className="flex gap-1 mt-1">
              {document.access_levels.map(level => (
                <span 
                  key={level}
                  className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                >
                  {level}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">None</span>
          )}
        </div>

        {/* Access Levels disponibles en el sistema */}
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-700">Available Access Levels: </span>
          {availableAccessLevels && availableAccessLevels.length > 0 ? (
            <div className="flex gap-1 mt-1">
              {availableAccessLevels.map((level: string) => (
                <span 
                  key={level}
                  className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                >
                  {level}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">Loading...</span>
          )}
        </div>
      </div>

      {/* Botones con control de acceso */}
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="text-md font-semibold mb-3">Action Buttons (with access control)</h4>
        <div className="flex flex-wrap gap-2">
          
          {/* Botón Edit - requiere 'edit' */}
          <DocumentActionButton
            accessLevels={document.access_levels}
            requiredAccess="edit"
            onClick={onEdit}
            variant="outline"
            className="hover:cursor-pointer"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DocumentActionButton>

          {/* Botón Delete - requiere 'delete' */}
          <DocumentActionButton
            accessLevels={document.access_levels}
            requiredAccess="delete"
            onClick={onDelete}
            variant="destructive"
            className="hover:cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DocumentActionButton>

          {/* Botón Export - requiere 'read' */}
          <DocumentActionButton
            accessLevels={document.access_levels}
            requiredAccess="read"
            onClick={onExport}
            variant="secondary"
            className="hover:cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </DocumentActionButton>

          {/* Botón Approve - requiere 'approve' */}
          <DocumentActionButton
            accessLevels={document.access_levels}
            requiredAccess="approve"
            onClick={onApprove}
            variant="default"
            className="hover:cursor-pointer bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </DocumentActionButton>

          {/* Botón Execute - requiere 'edit' O 'create' (cualquiera de los dos) */}
          <DocumentActionButton
            accessLevels={document.access_levels}
            requiredAccess={["edit", "create"]}
            requireAll={false}
            onClick={onExecute}
            variant="default"
            className="hover:cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Execute
          </DocumentActionButton>

        </div>
      </div>

      {/* Contenido condicional con DocumentAccessControl */}
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="text-md font-semibold mb-3">Conditional Content (with access control)</h4>
        
        <DocumentAccessControl
          accessLevels={document.access_levels}
          requiredAccess="edit"
          fallback={<p className="text-gray-500">You don't have edit access to this document.</p>}
        >
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-blue-800">✅ You can edit this document! This content is only visible to users with 'edit' access.</p>
          </div>
        </DocumentAccessControl>

        <div className="mt-3">
          <DocumentAccessControl
            accessLevels={document.access_levels}
            requiredAccess="delete"
            fallback={<p className="text-gray-500">You don't have delete permissions.</p>}
          >
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-red-800">⚠️ You can delete this document! Handle with care.</p>
            </div>
          </DocumentAccessControl>
        </div>
      </div>

      {/* Estado de permisos */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-md font-semibold mb-3">Permission Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className={`p-2 rounded ${canRead ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Can Read: {canRead ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded ${canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Can Edit: {canEdit ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded ${canDelete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Can Delete: {canDelete ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded ${canApprove ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Can Approve: {canApprove ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded ${hasAccess('create') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Can Create: {hasAccess('create') ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  )
}