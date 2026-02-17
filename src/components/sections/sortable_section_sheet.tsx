import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Markdown from "../ui/markdown";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Trash2,
  Plus
} from "lucide-react";
import { EditSectionDialog } from "./sections-edit-dialog";
import type { SortableSectionSheetItem } from "@/types/sections";

export type { SortableSectionSheetItem } from "@/types/sections";

interface SortableSectionSheetProps {
  item: SortableSectionSheetItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string, options?: { executionId?: string; propagate_to_documents?: boolean }) => Promise<void>;
  isOverlay?: boolean;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  isDisabledSection?: boolean;
  onAddToCurrentVersion?: (sectionId: string) => void;
  isAddToCurrentVersionPending?: boolean;
  currentExecutionId?: string | null;
  useExecutionDeleteDialog?: boolean;
}

type DeleteMode = "structure" | "structure_and_current_version";

export default function SortableSectionSheet({
  item,
  existingSections,
  onSave,
  onDelete,
  isOverlay = false,
  hasTemplate = false,
  isTemplateSection = false,
  canUpdate = true,
  canDelete = true,
  isDisabledSection = false,
  onAddToCurrentVersion,
  isAddToCurrentVersionPending = false,
  currentExecutionId = null,
  useExecutionDeleteDialog = false,
}: SortableSectionSheetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: isOverlay || isDisabledSection });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [propagateDeleteToAssets, setPropagateDeleteToAssets] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteMode | "">("");

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Visual hint while dragging
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      if (useExecutionDeleteDialog) {
        if (!deleteMode) {
          return;
        }

        await onDelete(item.id, {
          executionId: deleteMode === "structure_and_current_version" ? currentExecutionId || undefined : undefined,
        });
      } else {
        await onDelete(item.id, propagateDeleteToAssets ? { propagate_to_documents: true } : undefined);
      }

      setShowDeleteDialog(false);
      setPropagateDeleteToAssets(false);
      setDeleteMode("");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = (sectionData: object) => {
    onSave(item.id, sectionData);
  };

  const canConfirmDelete = useExecutionDeleteDialog
    ? !!deleteMode && !(deleteMode === "structure_and_current_version" && !currentExecutionId)
    : true;

  const sectionType = (item as any).type || 'ai';

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className={`w-full min-w-0 py-4 px-4 border-b border-gray transition-colors ${isDisabledSection ? 'bg-gray-50 opacity-75' : 'bg-white hover:bg-blue-50'} ${isDragging ? 'bg-blue-50 border-blue-300' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {!isOverlay && !isDisabledSection && (
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
                    const prompt = (item as any).prompt;
                    return (
                      <Markdown>{prompt ? `${prompt.substring(0, 150)}...` : 'No content available'}</Markdown>
                    );
                  }
                  
                  // Para tipo Manual: mostrar preview del manual input
                  if (sectionType === 'manual') {
                    const manualInput = (item as any).manual_input;
                    return (
                      <div className="max-h-23 overflow-hidden">
                        <Markdown>{manualInput ? `${manualInput.substring(0, 150)}...` : 'No content available'}</Markdown>
                      </div>
                    );
                  }
                  
                  // Para tipo Reference: mostrar info de referencia
                  if (sectionType === 'reference') {
                    const referencedContent = (item as any).referenced_content;
                    return (
                      <Markdown>{referencedContent ? `${referencedContent.substring(0, 150)}...` : 'No content available'}</Markdown>
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

                    {isDisabledSection && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs hover:cursor-pointer"
                        onClick={() => onAddToCurrentVersion?.(item.id)}
                        disabled={isAddToCurrentVersionPending}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        {isAddToCurrentVersionPending ? "Adding..." : "+ Add section to current version"}
                      </Button>
                    )}

                    {!isDisabledSection && (canUpdate || canDelete) && (
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
                          {canUpdate && (
                            <DropdownMenuItem
                              onSelect={() => {
                                setTimeout(() => setShowEditDialog(true), 0);
                              }}
                              className="hover:cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-red-600 hover:cursor-pointer"
                              onSelect={() => {
                                setTimeout(() => {
                                  setDeleteMode("");
                                  setPropagateDeleteToAssets(false);
                                  setShowDeleteDialog(true);
                                }, 0);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                        <Markdown>{(item as any).manual_input}</Markdown>
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Reference Configuration:</h4>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-purple-900">Asset Name:</span>{' '}
                          <span className="text-purple-700 font-mono text-xs">{(item as any).reference_section_name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-purple-900">Mode:</span>{' '}
                          <span className="text-purple-700">{(item as any).reference_mode || 'latest'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-purple-900">Execution Name:</span>{' '}
                          <span className="text-purple-700 font-mono text-xs">{(item as any).reference_execution_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Referenced Content */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Referenced Content:</h4>
                      {(item as any).referenced_content ? (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <Markdown>{(item as any).referenced_content}</Markdown>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 italic">No content available yet.</p>
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

      {useExecutionDeleteDialog ? (
        <Dialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            if (!isDeleting) {
              setShowDeleteDialog(open);
              if (!open) {
                setDeleteMode("");
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-[640px] p-0 gap-0">
            <DialogHeader className="p-6 border-b border-gray-200">
              <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900">
                Delete section
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 py-6">
              <p className="text-sm text-slate-700 mb-4">What do you want to delete?</p>
              <RadioGroup
                value={deleteMode}
                onValueChange={(value) => setDeleteMode(value as DeleteMode)}
                className="space-y-4"
              >
                <Label
                  htmlFor={`delete-structure-${item.id}`}
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    deleteMode === "structure" ? "border-[#4464f7] bg-blue-50" : "border-gray-200"
                  } ${isDeleting ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                >
                  <RadioGroupItem
                    id={`delete-structure-${item.id}`}
                    value="structure"
                    className="mt-1"
                    disabled={isDeleting}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Remove from structure</p>
                    <p className="text-xs text-slate-600">
                      The section is removed from the structure but does not affect content.
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor={`delete-structure-version-${item.id}`}
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    deleteMode === "structure_and_current_version" ? "border-[#4464f7] bg-blue-50" : "border-gray-200"
                  } ${isDeleting ? "cursor-not-allowed opacity-80" : "cursor-pointer"} ${
                    !currentExecutionId ? "opacity-60" : ""
                  }`}
                >
                  <RadioGroupItem
                    id={`delete-structure-version-${item.id}`}
                    value="structure_and_current_version"
                    className="mt-1"
                    disabled={isDeleting || !currentExecutionId}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Remove from structure and current version</p>
                    <p className="text-xs text-slate-600">
                      The section is removed from the structure and from the current version content, while previous versions remain unchanged.
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-gray-200 flex-row justify-end gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeleting}
                  className="hover:cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !canConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
              >
                {isDeleting ? "Delete..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <ReusableAlertDialog
          open={showDeleteDialog}
          onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}
          title="Delete Section"
          description={
            <div className="space-y-3">
              <p>
                Are you sure you want to delete the section "{item.name}"? This action cannot be undone.
              </p>
              {isTemplateSection && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`propagate-delete-${item.id}`}
                    checked={propagateDeleteToAssets}
                    onCheckedChange={(checked) => setPropagateDeleteToAssets(checked as boolean)}
                    disabled={isDeleting}
                  />
                  <Label
                    htmlFor={`propagate-delete-${item.id}`}
                    className="text-xs font-medium text-gray-700 hover:cursor-pointer"
                  >
                    Also remove related asset sections created from this template
                  </Label>
                </div>
              )}
            </div>
          }
          onConfirm={handleDelete}
          confirmLabel="Delete"
          isProcessing={isDeleting}
          variant="destructive"
        />
      )}

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
