import { Folder, FileTextIcon, Trash2, Settings, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { deleteDocument } from "@/services/documents";
import { deleteFolder } from "@/services/library";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import EditDocumentDialog from "@/components/edit_document_dialog";
import { useOrganization } from "@/contexts/organization-context";

interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
  document_type?: {
    id: string;
    name: string;
    color: string;
  };
}

interface LibrarySidebarItemProps {
  item: LibraryItem;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onManage?: () => void;
  onMove?: () => void;
  breadcrumb?: Array<{ id: string; name: string }>;
  onRefresh?: () => void;
  setSelectedFile?: (file: LibraryItem | null) => void;
}

export function LibrarySidebarItem({ 
  item, 
  isSelected, 
  onClick, 
  onManage, 
  breadcrumb,
  onRefresh,
  setSelectedFile
}: LibrarySidebarItemProps) {
  const navigate = useNavigate();
  const { selectedOrganizationId } = useOrganization();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = () => {
    // Use setTimeout so the context menu fully closes before the dialog appears
    setTimeout(() => {
      setIsDeleteDialogOpen(true)
    }, 0)
  };

  const handleDeleteConfirm = async () => {
    try {
      if (item.type === 'document') {
        await deleteDocument(item.id, selectedOrganizationId!);
        toast.success(`Document "${item.name}" deleted successfully`);
      } else {
        await deleteFolder(item.id, selectedOrganizationId!);
        toast.success(`Folder "${item.name}" deleted successfully`);
      }
      if (setSelectedFile) {
        setSelectedFile(null);
      }
      onRefresh?.();
      // Don't manually close dialog - let Radix handle it
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${item.type === 'document' ? 'document' : 'folder'}. Please try again.`);
    }
  };

  const handleManage = () => {
    if (item.type === 'document') {
      // Save current state before navigating
      if (breadcrumb) {
        sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
      }
      sessionStorage.setItem('library-selectedFile', JSON.stringify(item));
      navigate(`/document/${item.id}`);
    } else {
      // For folders, use the existing onManage callback if provided
      onManage?.();
    }
  };

  const handleEdit = () => {
    if (item.type !== 'document') return;
    // Apertura diferida para evitar que el cierre del context menu cierre el dialog
    setTimeout(() => setIsEditDialogOpen(true), 0);
  };

  return (
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            onClick={onClick}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50 hover:cursor-pointer group",
              isSelected && "bg-blue-100 border-r-2 border-blue-500"
            )}
          >
            {item.type === "folder" ? (
              <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileTextIcon 
                    className="h-4 w-4 flex-shrink-0" 
                    style={{ color: item.document_type?.color || "#6b7280" }}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p style={{ color: item.document_type?.color || "#6b7280" }}>
                    {item.document_type?.name || "Document"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  "text-sm truncate",
                  isSelected ? "text-blue-900 font-medium" : "text-gray-700"
                )}>{item.name}</span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {item.type === "folder" ? (
            <ContextMenuItem onSelect={handleDelete} className="hover:cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem onSelect={handleEdit} className="hover:cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleManage} className="hover:cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleDelete} className="hover:cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{item.type === 'document' ? 'Delete Document' : 'Delete Folder'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteConfirm()
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {item.type === 'document' && (
        <EditDocumentDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsEditDialogOpen(false)
            }
          }}
          documentId={item.id}
          currentName={item.name}
          // No tenemos descripción aquí; el dialog la obtendrá si falta
          onUpdated={(newName) => {
            // Refrescar lista para reflejar nombre actualizado
            onRefresh?.();
            // Actualizar selección si este item está seleccionado
            if (isSelected && setSelectedFile) {
              setSelectedFile({ ...item, name: newName });
            }
          }}
        />
      )}
    </TooltipProvider>
  );
}
