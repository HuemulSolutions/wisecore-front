import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Markdown from "../ui/markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import { EditSectionDialog } from "./sections-edit-dialog";
import type { SortableSectionSheetItem } from "@/types/sections";

export type { SortableSectionSheetItem } from "@/types/sections";

interface SortableSectionSheetProps {
  item: SortableSectionSheetItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
  isOverlay?: boolean;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
}

export default function SortableSectionSheet({ item, existingSections, onSave, onDelete, isOverlay = false, hasTemplate = false, isTemplateSection = false }: SortableSectionSheetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: isOverlay });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Visual hint while dragging
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    // Crear una promesa con delay mínimo de 800ms
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Ejecutar la mutación y esperar ambas promesas
      await Promise.all([
        new Promise<void>((resolve) => {
          onDelete(item.id);
          resolve();
        }),
        minDelay
      ]);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditSave = (sectionData: object) => {
    onSave(item.id, sectionData);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className={`w-full min-w-0 overflow-hidden ${isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Drag handle - solo visible si no es overlay */}
              {!isOverlay && (
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
              )}
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-gray-900 truncate">
                    {item.order}. {item.name}
                  </CardTitle>
                  {(item as any).type && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      (item as any).type === 'ai' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      (item as any).type === 'manual' ? 'bg-green-100 text-green-800 border border-green-200' :
                      (item as any).type === 'reference' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {(item as any).type === 'ai' ? '🤖 AI' :
                       (item as any).type === 'manual' ? '✍️ Manual' :
                       (item as any).type === 'reference' ? '🔗 Reference' :
                       (item as any).type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isOverlay && (
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
              )}

              {!isOverlay && (
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
                    onSelect={() => {
                      // Sincroniza apertura al ciclo de cierre del dropdown
                      setTimeout(() => setShowEditDialog(true), 0);
                    }}
                    className="hover:cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:cursor-pointer"
                    onSelect={() => {
                      // Sincroniza apertura al ciclo de cierre del dropdown
                      setTimeout(() => setShowDeleteDialog(true), 0);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}
            </div>
          </div>

          {/* Preview cuando está colapsado - solo si no es overlay */}
          {!isOverlay && !isExpanded && (() => {
            const sectionType = (item as any).type || 'ai';
            
            // Para tipo AI: mostrar preview del prompt
            if (sectionType === 'ai' && item.prompt) {
              let decodedPrompt = item.prompt
                .replace(/\\n/g, '\n')
                .replace(/\\\//g, '/')
                .replace(/•/g, '-')
                .replace(/\t/g, '  ');
              
              const lines = decodedPrompt.split('\n').filter(line => line.trim() !== '');
              const firstMeaningfulLines = lines.slice(0, 3).join(' ');
              const headers = decodedPrompt.match(/#{1,6}\s+([^\n]+)/g);
              const mainHeader = headers?.[0]?.replace(/#{1,6}\s+/, '') || '';
              
              let previewText = '';
              if (mainHeader) {
                previewText = `${mainHeader}: `;
              }
              
              const contentPreview = firstMeaningfulLines.length > 100 
                ? `${firstMeaningfulLines.substring(0, 150)}...`
                : firstMeaningfulLines;
                
              previewText += contentPreview;
              
              return (
                <div className="mt-2 px-3 sm:px-0">
                  <div className="text-xs text-gray-600 line-clamp-3 leading-relaxed break-words overflow-hidden">
                    <Markdown>{previewText}</Markdown>
                  </div>
                </div>
              );
            }
            
            // Para tipo Manual: mostrar preview del manual input o indicador
            if (sectionType === 'manual') {
              const manualInput = (item as any).manual_input;
              return (
                <div className="mt-2 px-3 sm:px-0">
                  <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed break-words overflow-hidden">
                    {manualInput ? (
                      <span className="text-gray-700">{manualInput.substring(0, 100)}{manualInput.length > 100 ? '...' : ''}</span>
                    ) : (
                      <span className="italic text-gray-500">Manual section - content to be entered</span>
                    )}
                  </div>
                </div>
              );
            }
            
            // Para tipo Reference: mostrar info de referencia
            if (sectionType === 'reference') {
              const refMode = (item as any).reference_mode || 'latest';
              return (
                <div className="mt-2 px-3 sm:px-0">
                  <div className="text-xs text-gray-600 leading-relaxed">
                    <span className="italic text-blue-700">References asset • Mode: {refMode}</span>
                  </div>
                </div>
              );
            }
            
            return null;
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

        {/* Contenido expandido - solo si no es overlay */}
        {!isOverlay && isExpanded && (
          <CardContent className="pt-0 px-3 sm:px-6">
            <div className="space-y-4 min-w-0">
                {/* Manual Input */}
                {(item as any).type === 'manual' && (
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Manual Input:</h4>
                    {(item as any).manual_input ? (
                      <div className="bg-green-50 rounded-md p-2 sm:p-4 border border-green-200 overflow-hidden">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {(item as any).manual_input}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md p-2 sm:p-4 border border-gray-200 overflow-hidden">
                        <div className="text-sm text-gray-500 italic">
                          No content yet. This is a manual section where content can be entered directly.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reference Info */}
                {(item as any).type === 'reference' && (item as any).reference_section_id && (
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Reference Configuration:</h4>
                    <div className="bg-blue-50 rounded-md p-2 sm:p-4 border border-blue-200 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">Asset ID:</span>{' '}
                        <span className="text-blue-700 font-mono text-xs">{(item as any).reference_section_id}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">Mode:</span>{' '}
                        <span className="text-blue-700">{(item as any).reference_mode || 'latest'}</span>
                      </div>
                      {(item as any).reference_mode === 'specific' && (item as any).reference_execution_id && (
                        <div className="text-sm">
                          <span className="font-medium text-blue-900">Execution ID:</span>{' '}
                          <span className="text-blue-700 font-mono text-xs">{(item as any).reference_execution_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Prompt - Solo para tipo AI */}
                {(item as any).type === 'ai' && item.prompt && (() => {
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

                {/* Mensaje cuando no hay contenido para tipo AI */}
                {(item as any).type === 'ai' && !item.prompt && (
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Prompt:</h4>
                    <div className="bg-gray-50 rounded-md p-2 sm:p-4 border border-gray-200 overflow-hidden">
                      <div className="text-sm text-gray-500 italic">
                        No prompt defined. AI sections require a prompt to generate content.
                      </div>
                    </div>
                  </div>
                )}

                {/* Dependencies - Solo para tipo AI */}
                {(item as any).type === 'ai' && item.dependencies && item.dependencies.length > 0 && (
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
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation AlertDialog */}
      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}
        title="Delete Section"
        description={`Are you sure you want to delete the section "${item.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isProcessing={isDeleting}
        variant="destructive"
      />

      {/* Edit Section Dialog */}
      <EditSectionDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={item}
        onSave={handleEditSave}
        existingSections={existingSections as any}
        hasTemplate={hasTemplate}
        isTemplateSection={isTemplateSection}
      />
    </div>
  );
}