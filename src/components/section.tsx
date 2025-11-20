import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Markdown from "./ui/markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import EditSection from "./edit_section";

interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: {id: string; name: string }[];
}

interface Props {
  item: Item;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}

export default function Section({ item, existingSections, onSave, onDelete }: Props ) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const maxPreviewLength = 100;

  useEffect(() => {
    console.log('Section Props:', { item, existingSections });
  }, [item, existingSections]);

  const shouldShowExpandButton = item.prompt.length > maxPreviewLength;
  const displayText =
    isExpanded || !shouldShowExpandButton
      ? item.prompt
      : `${item.prompt.substring(0, maxPreviewLength)}...`;

  function openDeleteDialog() {
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog() {
    setShowDeleteDialog(false);
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (open) {
      openDeleteDialog();
    } else {
      closeDeleteDialog();
    }
  };

  const handleDelete = () => {
    // Aquí puedes agregar la lógica para eliminar el item
    onDelete(item.id);
    closeDeleteDialog();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = (updatedItem: { id: string; name: string; prompt: string; order: number; dependencies: string[] }) => {
    // Aquí puedes agregar la lógica para guardar los cambios
    // Las dependencies ya vienen como array de strings desde EditSection
    const dependencies = updatedItem.dependencies || [];
    
    onSave(item.id, {
      name: updatedItem.name,
      prompt: updatedItem.prompt,
      order: updatedItem.order,
      dependencies: dependencies
    });
    setIsEditing(false);
  };

  // Si está en modo edición, mostrar el componente EditSection
  if (isEditing) {
    return (
      <EditSection
        item={item}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
        existingSections={existingSections as { id: string; name: string }[]}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
            <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded w-fit">
              Order: {item.order}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="hover:cursor-pointer"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:cursor-pointer text-red-600"
                onSelect={() => {
                  // Defer apertura para que el dropdown termine su ciclo y no deje capas bloqueadas
                  setTimeout(() => openDeleteDialog(), 0);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-sm text-muted-foreground">Depends on:</span>
              {item.dependencies.map((dependency, index) => (
                <span
                  key={index}
                  className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
                >
                  {dependency.name}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-700 leading-relaxed">
            <strong>Prompt:</strong> 
            <Markdown>{displayText}</Markdown>
          </div>
          
          {shouldShowExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:cursor-pointer"
            >
              <span className="flex items-center gap-1">
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </span>
            </Button>
          )}
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the element "{item.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
