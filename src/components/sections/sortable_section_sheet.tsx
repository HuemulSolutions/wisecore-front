import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

  const sectionType = (item as any).type || 'ai';

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className={`w-full min-w-0 py-4 px-4 bg-white border-b border-gray hover:bg-blue-50 transition-colors ${isDragging ? 'bg-blue-50 border-blue-300' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {!isOverlay && (
            <div
              className="hover:cursor-grab cursor-grabbing active:cursor-grabbing shrink-0 flex items-center h-5"
              title="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          {/* Order Number */}
          <div className="shrink-0 flex items-center h-5">
            <span className="text-sm font-medium text-gray-500">{String(item.order).padStart(2, '0')}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Title and Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                  {sectionType === 'ai' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      AI
                    </Badge>
                  )}
                  {sectionType === 'manual' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      MANUAL
                    </Badge>
                  )}
                  {sectionType === 'reference' && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      REFERENCE
                    </Badge>
                  )}
                </div>
                
                {/* Description Preview */}
                {!isExpanded && (() => {
                  // Para tipo AI: mostrar preview del prompt
                  if (sectionType === 'ai' && item.prompt) {
                    let decodedPrompt = item.prompt
                      .replace(/\\n/g, '\n')
                      .replace(/\\\//g, '/')
                      .replace(/•/g, '-')
                      .replace(/\t/g, '  ');
                    
                    const lines = decodedPrompt.split('\n').filter(line => line.trim() !== '');
                    const previewText = lines.slice(0, 2).join(' ').substring(0, 200);
                    
                    return (
                      <p className="text-xs text-gray-600 line-clamp-2">{previewText}...</p>
                    );
                  }
                  
                  // Para tipo Manual: mostrar preview del manual input
                  if (sectionType === 'manual') {
                    const manualInput = (item as any).manual_input;
                    return (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {manualInput ? `${manualInput.substring(0, 150)}...` : 'Redacta una sección breve que incluya los datos personales del candidato: nombre completo, dirección,...'}
                      </p>
                    );
                  }
                  
                  // Para tipo Reference: mostrar info de referencia
                  if (sectionType === 'reference') {
                    return (
                      <p className="text-xs text-gray-600">References asset content</p>
                    );
                  }
                  
                  return null;
                })()}

                {/* Dependencies */}
                {!isExpanded && item.dependencies && item.dependencies.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Depends on:</span>
                    <Badge variant="outline" className="text-xs">
                      {item.dependencies.map(d => d.name).join(', ')}
                    </Badge>
                    {/* <span className="text-xs text-gray-700">{item.dependencies.map(d => d.name).join(', ')}</span> */}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!isOverlay && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="hover:cursor-pointer h-8 w-8 p-0"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
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
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
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
                            setTimeout(() => setShowDeleteDialog(true), 0);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {!isOverlay && isExpanded && (
              <div className="mt-4 space-y-4">
                {/* Manual Input */}
                {sectionType === 'manual' && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Manual Input:</h4>
                    {(item as any).manual_input ? (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{(item as any).manual_input}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">No content yet. This is a manual section where content can be entered directly.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reference Info */}
                {sectionType === 'reference' && (item as any).reference_section_id && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Reference Configuration:</h4>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-purple-900">Asset ID:</span>{' '}
                        <span className="text-purple-700 font-mono text-xs">{(item as any).reference_section_id}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-purple-900">Mode:</span>{' '}
                        <span className="text-purple-700">{(item as any).reference_mode || 'latest'}</span>
                      </div>
                      {(item as any).reference_mode === 'specific' && (item as any).reference_execution_id && (
                        <div className="text-sm">
                          <span className="font-medium text-purple-900">Execution ID:</span>{' '}
                          <span className="text-purple-700 font-mono text-xs">{(item as any).reference_execution_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Prompt - Solo para tipo AI */}
                {sectionType === 'ai' && item.prompt && (() => {
                  let decodedPrompt = item.prompt
                    .replace(/\\n/g, '\n')
                    .replace(/\\\//g, '/')
                    .replace(/•/g, '-')
                    .replace(/\t/g, '  ');
                  
                  return (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Prompt:</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <Markdown>{decodedPrompt}</Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mensaje cuando no hay contenido para tipo AI */}
                {sectionType === 'ai' && !item.prompt && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Prompt:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 italic">No prompt defined. AI sections require a prompt to generate content.</p>
                    </div>
                  </div>
                )}

                {/* Dependencies - Para todos los tipos cuando están expandidas */}
                {item.dependencies && item.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Dependencies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.dependencies.map((dep) => (
                        <Badge key={dep.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {dep.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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