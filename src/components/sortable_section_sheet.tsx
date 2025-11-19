import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import EditSectionSheet from "./edit_section_sheet";

type Dependency = { id: string; name: string };

export interface SortableSectionSheetItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: Dependency[];
}

interface SortableSectionSheetProps {
  item: SortableSectionSheetItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}

export default function SortableSectionSheet({ item, existingSections, onSave, onDelete }: SortableSectionSheetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Visual hint while dragging
    zIndex: isDragging ? 10 : undefined,
  };

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
    onDelete(item.id);
    closeDeleteDialog();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = (sectionData: object) => {
    onSave(item.id, sectionData);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) {
      setIsExpanded(true);
    }
  }, [isEditing]);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className={`w-full min-w-0 overflow-hidden ${isDragging ? 'shadow-lg' : ''}`}>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Drag handle */}
              <Button
                variant="ghost"
                size="icon"
                className="hover:cursor-grab cursor-grabbing active:cursor-grabbing h-8 w-8 flex-shrink-0"
                title="Drag to reorder"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <CardTitle className="text-sm font-medium text-gray-900 truncate">
                  {item.order}. {item.name}
                </CardTitle>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:cursor-pointer h-8 w-8 p-0"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:cursor-pointer h-8 w-8 p-0"
                    title="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="hover:cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:cursor-pointer"
                    onSelect={() => {
                      // Sincroniza apertura al ciclo de cierre del dropdown
                      setTimeout(() => openDeleteDialog(), 0);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Preview cuando está colapsado */}
          {!isExpanded && item.prompt && (() => {
            let decodedPrompt = item.prompt
              .replace(/\\n/g, '\n')
              .replace(/\\\//g, '/')
              .replace(/•/g, '-')
              .replace(/\t/g, '  ');
            
            // Extraer el primer párrafo o las primeras líneas significativas
            const lines = decodedPrompt.split('\n').filter(line => line.trim() !== '');
            const firstMeaningfulLines = lines.slice(0, 3).join(' ');
            
            // Si hay headers, extraerlos
            const headers = decodedPrompt.match(/#{1,6}\s+([^\n]+)/g);
            const mainHeader = headers?.[0]?.replace(/#{1,6}\s+/, '') || '';
            
            // Crear un preview más descriptivo
            let previewText = '';
            if (mainHeader) {
              previewText = `${mainHeader}: `;
            }
            
            const contentPreview = firstMeaningfulLines.length > 150 
              ? `${firstMeaningfulLines.substring(0, 150)}...`
              : firstMeaningfulLines;
              
            previewText += contentPreview;
            
            return (
              <div className="mt-2 px-3 sm:px-0">
                <div className="text-xs text-gray-600 line-clamp-3 leading-relaxed break-words overflow-hidden">
                  {mainHeader && (
                    <span className="font-medium text-gray-800">Prompt</span>
                  )}
                  {mainHeader && ': '}
                  <span className="text-gray-600">{contentPreview}</span>
                </div>
              </div>
            );
          })()}

          {/* Dependencies preview cuando está colapsado */}
          {!isExpanded && item.dependencies && item.dependencies.length > 0 && (
            <div className="mt-2 px-3 sm:px-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs text-gray-500 font-medium flex-shrink-0">Depends on:</span>
                <div className="flex flex-wrap gap-1 min-w-0">
                  {item.dependencies.slice(0, 2).map((dep) => (
                    <span
                      key={dep.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border-blue-200 truncate max-w-full"
                    >
                      {dep.name}
                    </span>
                  ))}
                  {item.dependencies.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 flex-shrink-0">
                      +{item.dependencies.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        {/* Contenido expandido */}
        {isExpanded && (
          <CardContent className="pt-0 px-3 sm:px-6">
            {isEditing ? (
              <EditSectionSheet
                item={item}
                onCancel={handleEditCancel}
                onSave={handleEditSave}
                existingSections={existingSections as any}
              />
            ) : (
              <div className="space-y-4 min-w-0">
                {/* Prompt */}
                {item.prompt && (() => {
                  // Decodificar caracteres especiales y convertir bullets a markdown
                  let decodedPrompt = item.prompt
                    .replace(/\\n/g, '\n')
                    .replace(/\\\//g, '/')
                    .replace(/•/g, '-') // Convertir bullets (•) a guiones de markdown
                    .replace(/\t/g, '  '); // Convertir tabs a espacios
                  
                  return (
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Prompt:</h4>
                      <div className="bg-gray-50 rounded-md p-2 sm:p-4 border overflow-hidden">
                        <div className="prose prose-sm max-w-none prose-gray prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-li:my-1 break-words overflow-x-auto">
                          <Markdown>{decodedPrompt}</Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Dependencies */}
                {item.dependencies && item.dependencies.length > 0 && (
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Dependencies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.dependencies.map((dep) => (
                        <span
                          key={dep.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 truncate max-w-full"
                        >
                          {dep.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the section "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}