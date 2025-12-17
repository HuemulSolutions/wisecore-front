"use client"


import { useState, useEffect } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { ChevronRight, Folder, File, Loader2, FolderPlus, FileText, FileImage, FileVideo, FileAudio, FileCode, Database, FileSpreadsheet, Presentation, Trash2, Share, Edit, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DocumentAccessControl } from "@/components/document-access-control"
import { CreateFolderDialog } from "@/components/create_folder"
import { CreateAssetDialog } from "@/components/create-asset-dialog"
import EditFolder from "@/components/edit_folder"
import { deleteFolder } from "@/services/library";
import { toast } from "sonner"
import type { FileNode } from "./types"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"

// Función para obtener el icono y color basado en el tipo de archivo
const getFileIconAndColor = (fileName: string) => {
  const extension = fileName.toLowerCase().split('.').pop() || ''
  
  switch (extension) {
    // Documentos de texto
    case 'txt':
    case 'doc':
    case 'docx':
    case 'rtf':
      return { icon: FileText, color: 'text-blue-600' }
    
    // Imágenes
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'bmp':
    case 'webp':
      return { icon: FileImage, color: 'text-green-600' }
    
    // Videos
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return { icon: FileVideo, color: 'text-red-600' }
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
    case 'm4a':
      return { icon: FileAudio, color: 'text-purple-600' }
    
    // Código/Programación
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'sass':
    case 'php':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'cs':
    case 'go':
    case 'rs':
    case 'rb':
    case 'vue':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return { icon: FileCode, color: 'text-yellow-600' }
    
    // Bases de datos
    case 'sql':
    case 'db':
    case 'sqlite':
    case 'mdb':
      return { icon: Database, color: 'text-indigo-600' }
    
    // Hojas de cálculo
    case 'xlsx':
    case 'xls':
    case 'csv':
      return { icon: FileSpreadsheet, color: 'text-emerald-600' }
    
    // Presentaciones
    case 'ppt':
    case 'pptx':
      return { icon: Presentation, color: 'text-orange-600' }
    
    // PDF
    case 'pdf':
      return { icon: FileText, color: 'text-red-500' }
    
    // Archivos comprimidos
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: File, color: 'text-amber-600' }
    
    // Por defecto
    default:
      return { icon: File, color: 'text-muted-foreground' }
  }
}

interface FileTreeItemWithContextProps {
  item: FileNode
  level: number
  onSelect: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
  onChildrenLoaded?: (folderId: string, children: FileNode[]) => void
  onRefresh?: () => void
  onDocumentCreated?: (document: { id: string; name: string; type: "document" }) => void
  onShare?: (item: FileNode, fullPath: string[], isAutomatic?: boolean) => void
  currentPath?: string[]
}

export function FileTreeItemWithContext({
  item,
  level,
  onSelect,
  onDoubleClick,
  selectedId,
  onLoadChildren,
  onChildrenLoaded,
  onRefresh,
  onDocumentCreated,
  onShare,
  currentPath = [],
}: FileTreeItemWithContextProps) {
  const { selectedOrganizationId } = useOrganization()
  const { canCreate, canAccessFolders, canAccessAssets } = useUserPermissions()
  const [isLoading, setIsLoading] = useState(false)
  const [localChildren, setLocalChildren] = useState<FileNode[]>(item.children || [])
  const [deletingFolder, setDeletingFolder] = useState<FileNode | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false)

  const isFolder = item.type === "folder"
  
  // Estado expandido solo para la sesión actual (no persistente)
  const [isExpanded, setIsExpanded] = useState(false)

  // dnd-kit hooks
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      type: item.type,
      item,
    },
    // Add these options to make it work better with dev tools
    disabled: item.id === '__back__', // Disable dragging for back button
  })

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: item.id,
    disabled: !isFolder, // Solo las carpetas pueden recibir drops
    data: {
      type: item.type,
      item,
    },
  })

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
  }



  // Sincronizar localChildren cuando cambien los children del item
  useEffect(() => {
    if (item.children) {
      setLocalChildren(item.children)
    }
  }, [item.children])
  const hasChildren = isFolder && localChildren.length > 0
  const isSelected = selectedId === item.id

  // Handle back button - no context menu
  if (item.id === '__back__') {
    return (
      <div
        onClick={() => onSelect(item)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-accent/50 text-sm text-muted-foreground hover:text-foreground"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        <span>{item.name}</span>
      </div>
    );
  }

  // Combinar refs para drag y drop
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const handleToggleExpand = async () => {
    if (!isExpanded && isFolder && onLoadChildren) {
      setIsLoading(true)
      try {
        const loadedChildren = await onLoadChildren(item.id)
        setLocalChildren(loadedChildren)
        onChildrenLoaded?.(item.id, loadedChildren)
      } catch (error) {
        console.error("Error cargando contenido:", error)
      } finally {
        setIsLoading(false)
      }
    }
    setIsExpanded(!isExpanded)
  }





  const handleClick = async () => {
    onSelect(item)
    
    // Si es una carpeta, expandir automáticamente
    if (isFolder) {
      if (!isExpanded && onLoadChildren) {
        setIsLoading(true)
        try {
          const loadedChildren = await onLoadChildren(item.id)
          setLocalChildren(loadedChildren)
          onChildrenLoaded?.(item.id, loadedChildren)
        } catch (error) {
          console.error("Error cargando contenido:", error)
        } finally {
          setIsLoading(false)
        }
      }
      setIsExpanded(!isExpanded)
    } else {
      // Si es un archivo, automáticamente generar la URL correcta
      try {
        const completePath = [...currentPath, item.id];
        console.log('Auto-generating correct URL for selected file:', item.name);
        console.log('Complete path:', completePath);
        
        // Call onShare with isAutomatic = true to update browser URL
        onShare?.(item, completePath, true);
      } catch (error) {
        console.error('Error auto-generating URL:', error);
      }
    }
  }



  const handleDocumentCreatedLocal = (createdDocument: { id: string; name: string; type: "document" }) => {
    onRefresh?.()
    onDocumentCreated?.(createdDocument)
  }

  const handleDeleteFolder = () => {
    // Use setTimeout so the context/dropdown menu fully closes before the dialog appears
    setTimeout(() => {
      setDeletingFolder(item)
    }, 0)
  };


  const handleDeleteConfirm = async () => {
    try {
      if (deletingFolder) {
        await deleteFolder(deletingFolder.id, selectedOrganizationId!);
        toast.success(`Folder "${deletingFolder.name}" deleted successfully`);
        onRefresh?.();
        setDeletingFolder(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(`Failed to delete folder. Please try again.`);
    }
  };

  const handleShare = async () => {
    try {
      // Construct the complete path from root to this item
      // currentPath contains the path to the parent, we add this item's ID
      const completePath = [...currentPath, item.id];
      
      console.log('Sharing item:', item.name);
      console.log('Current path:', currentPath);
      console.log('Complete path for sharing:', completePath);
      
      // Call the onShare callback which handles the URL generation and clipboard
      // Pass false for isAutomatic since this is a manual share action
      onShare?.(item, completePath, false);
      
    } catch (error) {
      console.error('Error sharing item:', error);
      const { toast } = await import("sonner");
      toast.error('Failed to share item');
    }
  };

  return (
    <div className="w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            style={{
              ...dragStyle,
              paddingLeft: `${level * 16 + 8}px`
            }}
            {...attributes}
            {...(item.id !== '__back__' ? listeners : {})}
            onClick={handleClick}
            onDoubleClick={() => onDoubleClick?.(item)}
            data-drag-handle={item.id !== '__back__'}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              "hover:bg-accent/50",
              isSelected && "bg-accent text-accent-foreground",
              isOver && isFolder && "bg-primary/10 border-2 border-dashed border-primary animate-pulse",
              isDragging && "opacity-50 cursor-grabbing",
              "group",
              // Add touch-action for better mobile and dev tools compatibility
              "touch-none select-none",
            )}
          >
            {/* Botón de expandir/contraer */}
            {isFolder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleExpand()
                      }}
                      className={cn(
                        "flex-shrink-0 p-0.5 hover:bg-foreground/10 rounded transition-transform",
                        !hasChildren && !onLoadChildren && "invisible",
                        (isExpanded || isLoading) && "rotate-90",
                      )}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isExpanded ? "Collapse folder" : "Expand folder"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Ícono */}
            {!isFolder && <div className="w-4 h-4 flex-shrink-0" />}

            {isFolder ? (
              <Folder className="w-4 h-4 flex-shrink-0 text-primary" />
            ) : (
              (() => {
                // Usar color del document_type si está disponible, sino usar sistema de extensiones
                if (item.document_type?.color) {
                  return <FileText 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: item.document_type.color }}
                  />
                } else {
                  const { icon: IconComponent, color } = getFileIconAndColor(item.name)
                  return <IconComponent className={`w-4 h-4 flex-shrink-0 ${color}`} />
                }
              })()
            )}

            {/* Nombre del archivo/carpeta */}
            <span className="truncate text-sm flex-1 text-gray-600">{item.name}</span>
            
            {/* Botón de más opciones */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isFolder && (
                  <>
                    {canAccessFolders && canCreate('folder') && (
                      <DropdownMenuItem 
                        className="hover:cursor-pointer"
                        onSelect={() => {
                          setTimeout(() => setFolderDialogOpen(true), 0)
                        }}
                      >
                        <FolderPlus className="h-4 w-4 mr-2" />
                        New Folder
                      </DropdownMenuItem>
                    )}
                    {canAccessAssets && canCreate('assets') && (
                      <DropdownMenuItem 
                        className="hover:cursor-pointer"
                        onSelect={() => {
                          setTimeout(() => setAssetDialogOpen(true), 0)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        New Asset
                      </DropdownMenuItem>
                    )}
                    {((canAccessFolders && canCreate('folder')) || (canAccessAssets && canCreate('assets'))) && (
                      <DropdownMenuSeparator />
                    )}
                    {isFolder ? (
                      <>
                        <DocumentAccessControl
                          accessLevels={item.access_levels}
                          requiredAccess="edit"
                        >
                          <DropdownMenuItem 
                            className="hover:cursor-pointer"
                            onSelect={() => {
                              setTimeout(() => setEditFolderDialogOpen(true), 0)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Folder
                          </DropdownMenuItem>
                        </DocumentAccessControl>
                        <DocumentAccessControl
                          accessLevels={item.access_levels}
                          requiredAccess="delete"
                        >
                          <DropdownMenuItem 
                            onSelect={handleDeleteFolder}
                            className="hover:cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Folder
                          </DropdownMenuItem>
                        </DocumentAccessControl>
                      </>
                    ) : (
                      <>
                        <DocumentAccessControl
                          accessLevels={item.access_levels}
                          requiredAccess="edit"
                        >
                          <DropdownMenuItem 
                            className="hover:cursor-pointer"
                            onSelect={() => {
                              // Para documentos, navegar a la página de edición
                              console.log('Edit document:', item.name)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Document
                          </DropdownMenuItem>
                        </DocumentAccessControl>
                        <DocumentAccessControl
                          accessLevels={item.access_levels}
                          requiredAccess="delete"
                        >
                          <DropdownMenuItem 
                            className="hover:cursor-pointer text-red-600 focus:text-red-600"
                            onSelect={() => {
                              // Para documentos, manejar eliminación de documento
                              console.log('Delete document:', item.name)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Document
                          </DropdownMenuItem>
                        </DocumentAccessControl>
                      </>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                {isFolder ? (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      handleShare();
                    }} 
                    className="hover:cursor-pointer"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share Link
                  </DropdownMenuItem>
                ) : (
                  <DocumentAccessControl
                    accessLevels={item.access_levels}
                    requiredAccess="read"
                  >
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        handleShare();
                      }} 
                      className="hover:cursor-pointer"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share Link
                    </DropdownMenuItem>
                  </DocumentAccessControl>
                )}
                <DropdownMenuSeparator />
                {isFolder ? (
                  <DropdownMenuItem disabled>
                    <Folder className="h-4 w-4 mr-2" />
                    Folder Properties
                  </DropdownMenuItem>
                ) : (
                  <DocumentAccessControl
                    accessLevels={item.access_levels}
                    requiredAccess="read"
                  >
                    <DropdownMenuItem disabled>
                      <File className="h-4 w-4 mr-2" />
                      File Properties
                    </DropdownMenuItem>
                  </DocumentAccessControl>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          {isFolder ? (
            <>
              {canAccessFolders && canCreate('folder') && (
                <ContextMenuItem 
                  className="hover:cursor-pointer"
                  onSelect={() => {
                    setTimeout(() => setFolderDialogOpen(true), 0)
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </ContextMenuItem>
              )}
              {canAccessAssets && canCreate('assets') && (
                <ContextMenuItem 
                  className="hover:cursor-pointer"
                  onSelect={() => {
                    setTimeout(() => setAssetDialogOpen(true), 0)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Asset
                </ContextMenuItem>
              )}
              {((canAccessFolders && canCreate('folder')) || (canAccessAssets && canCreate('assets'))) && (
                <ContextMenuSeparator />
              )}
              <DocumentAccessControl
                accessLevels={item.access_levels}
                requiredAccess="edit"
              >
                <ContextMenuItem 
                  className="hover:cursor-pointer"
                  onSelect={() => {
                    setTimeout(() => setEditFolderDialogOpen(true), 0)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Folder
                </ContextMenuItem>
              </DocumentAccessControl>
              <DocumentAccessControl
                accessLevels={item.access_levels}
                requiredAccess="delete"
              >
                <ContextMenuItem onSelect={handleDeleteFolder} className="hover:cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </ContextMenuItem>
              </DocumentAccessControl>
              <ContextMenuSeparator />
            </>
          ) : (
            <>
              <DocumentAccessControl
                accessLevels={item.access_levels}
                requiredAccess="edit"
              >
                <ContextMenuItem 
                  className="hover:cursor-pointer"
                  onSelect={() => {
                    // Para documentos, navegar a la página de edición
                    console.log('Edit document:', item.name)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Document
                </ContextMenuItem>
              </DocumentAccessControl>
              <DocumentAccessControl
                accessLevels={item.access_levels}
                requiredAccess="delete"
              >
                <ContextMenuItem 
                  className="hover:cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={() => {
                    // Para documentos, manejar eliminación de documento
                    console.log('Delete document:', item.name)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </ContextMenuItem>
              </DocumentAccessControl>
              <ContextMenuSeparator />
            </>
          )}
          {isFolder ? (
            <ContextMenuItem onSelect={handleShare} className="hover:cursor-pointer">
              <Share className="h-4 w-4 mr-2" />
              Share Link
            </ContextMenuItem>
          ) : (
            <DocumentAccessControl
              accessLevels={item.access_levels}
              requiredAccess="read"
            >
              <ContextMenuItem onSelect={handleShare} className="hover:cursor-pointer">
                <Share className="h-4 w-4 mr-2" />
                Share Link
              </ContextMenuItem>
            </DocumentAccessControl>
          )}
          <ContextMenuSeparator />
          {isFolder ? (
            <ContextMenuItem disabled>
              <Folder className="h-4 w-4 mr-2" />
              Folder Properties
            </ContextMenuItem>
          ) : (
            <DocumentAccessControl
              accessLevels={item.access_levels}
              requiredAccess="read"
            >
              <ContextMenuItem disabled>
                <File className="h-4 w-4 mr-2" />
                File Properties
              </ContextMenuItem>
            </DocumentAccessControl>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Items hijos si la carpeta está expandida */}
      {isFolder && isExpanded && localChildren.length > 0 && (
        <div className="w-full">
          {localChildren.map((child) => (
            <FileTreeItemWithContext
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              selectedId={selectedId}
              onLoadChildren={onLoadChildren}
              onChildrenLoaded={onChildrenLoaded}
              onRefresh={onRefresh}
              onDocumentCreated={onDocumentCreated}
              onShare={onShare}
              currentPath={[...currentPath, item.id]}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog - only for folders */}
      {isFolder && (
        <AlertDialog 
          open={!!deletingFolder} 
          onOpenChange={(open) => {
            if (!open) {
              setDeletingFolder(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingFolder?.name}"? All files and subfolders will be permanently deleted and this action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Folder
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Create Folder Dialog */}
      {isFolder && (
        <CreateFolderDialog
          open={folderDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setFolderDialogOpen(false)
            }
          }}
          parentFolder={item.id}
          onFolderCreated={onRefresh}
        />
      )}
      
      {/* Create Asset Dialog */}
      {isFolder && (
        <CreateAssetDialog
          open={assetDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAssetDialogOpen(false)
            }
          }}
          folderId={item.id}
          onAssetCreated={handleDocumentCreatedLocal}
        />
      )}
      
      {/* Edit Folder Dialog */}
      {isFolder && (
        <EditFolder
          folderId={item.id}
          currentName={item.name}
          onFolderEdited={onRefresh}
          open={editFolderDialogOpen}
          onOpenChange={setEditFolderDialogOpen}
        />
      )}
    </div>
  )
}