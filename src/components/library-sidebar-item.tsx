import { Folder, FileTextIcon, Trash2, Settings, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
}

interface LibrarySidebarItemProps {
  item: LibraryItem;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onManage?: () => void;
  onMove?: () => void;
}

export function LibrarySidebarItem({ 
  item, 
  isSelected, 
  onClick, 
  onDelete, 
  onManage, 
  onMove 
}: LibrarySidebarItemProps) {
  const handleDelete = () => {
    onDelete?.();
  };

  const handleManage = () => {
    onManage?.();
  };

  const handleMove = () => {
    onMove?.();
  };

  return (
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
            <FileTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className={cn(
            "text-sm truncate",
            isSelected ? "text-blue-900 font-medium" : "text-gray-700"
          )}>{item.name}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {item.type === "folder" ? (
          <ContextMenuItem onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onClick={handleManage}>
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </ContextMenuItem>
            <ContextMenuItem onClick={handleMove} disabled>
              <Move className="mr-2 h-4 w-4" />
              Move
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
