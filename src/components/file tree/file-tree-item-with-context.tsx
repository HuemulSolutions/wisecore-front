"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronRight, Folder, File, Loader2, FolderPlus, FileText, FileImage, FileVideo, FileAudio, FileCode, Database, FileSpreadsheet, Presentation, Trash2, Share, MoreHorizontal, Edit } from "lucide-react"
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
import CreateFolder from "@/components/create_folder"
import CreateDocumentLib from "@/components/library/create_document_lib"
import EditFolder from "@/components/edit_folder"
import { deleteFolder } from "@/services/library"
import { toast } from "sonner"
import type { FileNode } from "./types"

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
  onDrop: (draggedItem: FileNode, targetFolder: FileNode) => void
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
  onDrop,
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
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localChildren, setLocalChildren] = useState<FileNode[]>(item.children || [])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isFolder = item.type === "folder"
  
  // Estado expandido solo para la sesión actual (no persistente)
  const [isExpanded, setIsExpanded] = useState(false)



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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("application/json", JSON.stringify(item))
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder) {
      try {
        const draggedData = e.dataTransfer.getData("application/json")
        if (draggedData) {
          const draggedNode = JSON.parse(draggedData) as FileNode
          // No permitir soltar sobre sí mismo
          if (draggedNode.id === item.id) {
            return
          }
        }
      } catch (error) {
        // Ignorar errores de parsing durante drag over
      }
      
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setIsDragging(false)

    try {
      const draggedData = e.dataTransfer.getData("application/json")
      const draggedNode = JSON.parse(draggedData) as FileNode

      if (isFolder && draggedNode.id !== item.id) {
        onDrop(draggedNode, item)
        setIsExpanded(true)
      }
    } catch (error) {
      console.error("Error en drop:", error)
    }
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
    setIsDeleteDialogOpen(true);
  };


  const handleDeleteConfirm = async () => {
    try {
      await deleteFolder(item.id);
      toast.success(`Folder "${item.name}" deleted successfully`);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(`Failed to delete folder. Please try again.`);
    } finally {
      setIsDeleteDialogOpen(false);
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
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            onDoubleClick={() => onDoubleClick?.(item)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              "hover:bg-accent/50",
              isSelected && "bg-accent text-accent-foreground",
              isDragOver && "bg-primary/20 border-2 border-dashed border-primary",
              isDragging && "opacity-50 cursor-grabbing",
              "group",
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
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
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isFolder && (
                  <>
                    <CreateFolder
                      trigger={
                        <DropdownMenuItem 
                          className="hover:cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          New Folder
                        </DropdownMenuItem>
                      }
                      parentFolder={item.id}
                      onFolderCreated={onRefresh}
                    />
                    <CreateDocumentLib
                      trigger={
                        <DropdownMenuItem 
                          className="hover:cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          New Asset
                        </DropdownMenuItem>
                      }
                      folderId={item.id}
                      onDocumentCreated={handleDocumentCreatedLocal}
                    />
                    <DropdownMenuSeparator />
                    <EditFolder
                      trigger={
                        <DropdownMenuItem 
                          className="hover:cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Folder
                        </DropdownMenuItem>
                      }
                      folderId={item.id}
                      currentName={item.name}
                      onFolderEdited={onRefresh}
                    />
                    <DropdownMenuItem 
                      onSelect={() => {
                        handleDeleteFolder();
                      }}
                      className="hover:cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  {isFolder ? (
                    <>
                      <Folder className="h-4 w-4 mr-2" />
                      Folder Properties
                    </>
                  ) : (
                    <>
                      <File className="h-4 w-4 mr-2" />
                      File Properties
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          {isFolder && (
            <>
              <CreateFolder
                trigger={
                  <ContextMenuItem 
                    className="hover:cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </ContextMenuItem>
                }
                parentFolder={item.id}
                onFolderCreated={onRefresh}
              />
              <CreateDocumentLib
                trigger={
                  <ContextMenuItem 
                    className="hover:cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    New Asset
                  </ContextMenuItem>
                }
                folderId={item.id}
                onDocumentCreated={handleDocumentCreatedLocal}
              />
              <ContextMenuSeparator />
              <EditFolder
                trigger={
                  <ContextMenuItem 
                    className="hover:cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Folder
                  </ContextMenuItem>
                }
                folderId={item.id}
                currentName={item.name}
                onFolderEdited={onRefresh}
              />
              <ContextMenuItem onClick={handleDeleteFolder} className="hover:cursor-pointer text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleShare} className="hover:cursor-pointer">
            <Share className="h-4 w-4 mr-2" />
            Share Link
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem disabled>
            {isFolder ? (
              <>
                <Folder className="h-4 w-4 mr-2" />
                Folder Properties
              </>
            ) : (
              <>
                <File className="h-4 w-4 mr-2" />
                File Properties
              </>
            )}
          </ContextMenuItem>
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
              onDrop={onDrop}
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
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{item.name}"? 
                <br />
                <strong className="text-red-600">
                  All files and subfolders will be permanently deleted and this action cannot be undone.
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="hover:cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="hover:cursor-pointer bg-transparent border-0 text-red-600 hover:bg-red-50"
                onClick={handleDeleteConfirm}
              >
                Delete Folder
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}