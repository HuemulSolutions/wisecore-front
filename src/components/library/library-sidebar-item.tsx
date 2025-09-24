import { Folder, FileTextIcon, Trash2, Settings } from "lucide-react";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    // Usar mismo diálogo para documentos y carpetas
    setTimeout(() => setIsDeleteDialogOpen(true), 10);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (item.type === 'document') {
        await deleteDocument(item.id);
        toast.success(`Document "${item.name}" deleted successfully`);
      } else {
        await deleteFolder(item.id);
        toast.success(`Folder "${item.name}" deleted successfully`);
      }
      if (setSelectedFile) {
        setSelectedFile(null);
      }
      onRefresh?.();
      setIsDeleteDialogOpen(false);
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
      sessionStorage.setItem('library-selected-file', JSON.stringify(item));
      navigate(`/document/${item.id}`);
    } else {
      // For folders, use the existing onManage callback if provided
      onManage?.();
    }
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
            <ContextMenuItem onClick={handleDelete} className="hover:cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem onClick={handleManage} className="hover:cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </ContextMenuItem>
              <ContextMenuItem onClick={handleDelete} className="hover:cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete Confirmation Dialog - only for documents */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setIsDeleteDialogOpen(false); }}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{item.type === 'document' ? 'Delete Document' : 'Delete Folder'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:cursor-pointer" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
