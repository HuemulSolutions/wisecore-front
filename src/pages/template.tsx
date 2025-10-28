import { Button } from "@/components/ui/button";
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
import { useParams, useNavigate } from "react-router-dom";
import { getTemplateById, deleteTemplate, generateTemplateSections, updateTemplate } from "@/services/templates";
import { createTemplateSection, updateTemplateSection, updateSectionsOrder, deleteTemplateSection } from "@/services/template_section";
import { formatDate } from "@/services/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import SortableSection from "@/components/sortable_section";
import { AddSectionForm } from "@/components/add_template_section";
import { Trash2, PlusCircle, MoreVertical, Download, ArrowLeft, Sparkles, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function ConfigTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  // Estado local para mantener el orden de secciones en UI (optimista)
  const [orderedSections, setOrderedSections] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; template_id: string, prompt: string, dependencies: string[] }) => 
      createTemplateSection(sectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setIsAddingSection(false);
    },
    onError: (error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + (error as Error).message);
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateTemplateSection(sectionId, sectionData),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error updating section:", error);
      toast.error("Error updating section: " + (error as Error).message);
    }
  });

  // Nueva mutation para eliminar sección (igual a la de update)
  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteTemplateSection(sectionId),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error deleting section:", error);
      toast.error("Error deleting section: " + (error as Error).message);
    }
  });

  // Mutation para reordenar secciones y persistir en backend
  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error updating sections order:", error);
      toast.error("Error updating sections order: " + (error as Error).message);
    },
  });

  // Mutation para generar secciones con AI
  const generateSectionsMutation = useMutation({
    mutationFn: (templateId: string) => generateTemplateSections(templateId),
    onSuccess: () => {
      toast.success("Sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error generating sections with AI:", error);
      toast.error("Error generating sections with AI: " + (error as Error).message);
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: { name?: string; description?: string | null } }) =>
      updateTemplate(templateId, data),
    onSuccess: () => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      closeEditDialog();
    },
    onError: (error) => {
      const message = (error as Error).message || "Unknown error";
      console.error("Error updating template:", error);
      setEditError(message);
      toast.error("Error updating template: " + message);
    }
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching template:", error);
    }
  }, [error]);

  useEffect(() => {
    if (template) {
      setEditedName(template.name ?? "");
      setEditedDescription(template.description ?? "");
    }
  }, [template]);

  // Sincronizar orderedSections cuando cambie el template
  useEffect(() => {
    if (template?.template_sections) {
      const sorted = [...template.template_sections].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
      );
      setOrderedSections(sorted);
    }
  }, [template?.template_sections]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  if (!template) {
    return <div>No template found with ID: {id}</div>;
  }

  function resetEditDialogFields() {
    if (template) {
      setEditedName(template.name ?? "");
      setEditedDescription(template.description ?? "");
    } else {
      setEditedName("");
      setEditedDescription("");
    }
    setEditError(null);
  }

  function openEditDialog() {
    updateTemplateMutation.reset();
    resetEditDialogFields();
    setIsEditDialogOpen(true);
  }

  function closeEditDialog() {
    updateTemplateMutation.reset();
    resetEditDialogFields();
    setIsEditDialogOpen(false);
  }

  function handleEditDialogChange(open: boolean) {
    if (open) {
      openEditDialog();
    } else {
      closeEditDialog();
    }
  }

  const handleEditSubmit = () => {
    if (!template?.id) return;

    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setEditError("Name is required");
      return;
    }

    const normalizedDescription = editedDescription.trim().length > 0 ? editedDescription : null;
    const templateDescription = template.description ?? "";
    const nextDescription = normalizedDescription ?? "";

    const payload: { name?: string; description?: string | null } = {};

    if (trimmedName !== template.name) {
      payload.name = trimmedName;
    }

    if (nextDescription !== templateDescription) {
      payload.description = normalizedDescription;
    }

    if (Object.keys(payload).length === 0) {
      closeEditDialog();
      return;
    }

    setEditError(null);
    updateTemplateMutation.mutate({ templateId: template.id, data: payload });
  };

  function openDeleteDialog() {
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog() {
    setShowDeleteDialog(false);
  }

  function handleDeleteDialogChange(open: boolean) {
    if (open) {
      openDeleteDialog();
    } else {
      closeDeleteDialog();
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTemplate(template.id);
      toast.success("Template deleted successfully");
      navigate("/templates"); // Redirigir a la lista de templates
      closeDeleteDialog();
    } catch (deleteError) {
      console.error("Error deleting template:", deleteError);
      toast.error("Error deleting template");
    }
  }

  const handleExport = () => {
    const templateData = {
      name: template.name,
      description: template.description,
      sections: template.template_sections.map((section: any) => ({
        name: section.name,
        prompt: section.prompt,
        dependencies: section.dependencies
      }))
    };
    
    const dataStr = JSON.stringify(templateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template exported successfully");
  }

  console.log("Template data:", template);

  // El orden visible lo maneja orderedSections (optimista)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSections.findIndex((s: any) => s.id === active.id);
    const newIndex = orderedSections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = [...orderedSections];
    const reordered = arrayMove(orderedSections, oldIndex, newIndex);

    // Actualiza UI de forma optimista
    setOrderedSections(reordered);

    const payload = reordered.map((s: any, idx: number) => ({ section_id: s.id, order: idx + 1 }));
    reorderSectionsMutation.mutate(payload, {
      onError: () => setOrderedSections(prev),
    });
  };

  const handleGenerateWithAI = async () => {
    if (!template?.id) return;
    generateSectionsMutation.mutate(template.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:cursor-pointer"
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Configure Template</h1>
        </div>
      </div>

      <div className="border border-gray-400 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Name: {template.name}</h2>
            <p className="text-gray-600">Description: {template.description}</p>
            <p className="text-gray-400 text-sm pt-3">Created: {formatDate(template.created_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:cursor-pointer ml-4" 
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                className="hover:cursor-pointer"
                onSelect={() => {
                  // Defer dialog opening so the dropdown can finish closing without trapping focus
                  setTimeout(() => openEditDialog(), 0);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:cursor-pointer" 
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 hover:cursor-pointer" 
                onSelect={() => {
                  // Defer apertura para que el dropdown termine de cerrar sin dejar capas activas
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

      {isAddingSection ? (
        <AddSectionForm
          templateId={template.id}
          onSubmit={(values) => addSectionMutation.mutate(values)}
          onCancel={() => setIsAddingSection(false)}
          isPending={addSectionMutation.isPending}
          existingSections={template.template_sections}
        />
      ) : (
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="hover:cursor-pointer" 
            onClick={() => setIsAddingSection(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          {(!template.template_sections || template.template_sections.length === 0) && (
            <Button
              type="button"
              variant="outline"
              className="hover:cursor-pointer"
              onClick={handleGenerateWithAI}
              disabled={generateSectionsMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateSectionsMutation.isPending ? "Generating..." : "Generate sections with AI"}
            </Button>
          )}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedSections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedSections.map((section: any) => (
              <SortableSection
                key={section.id}
                item={section}
                existingSections={template.template_sections}
                onSave={(sectionId: string, sectionData: object) =>
                  updateSectionMutation.mutate({ sectionId, sectionData })
                }
                onDelete={(sectionId: string) => deleteSectionMutation.mutate(sectionId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit template details</DialogTitle>
            <DialogDescription>
              Update the name and description to keep the template information accurate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <Input
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                placeholder="Template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <Textarea
                value={editedDescription}
                onChange={(event) => setEditedDescription(event.target.value)}
                placeholder="Template description (optional)"
              />
            </div>
            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleEditSubmit}
              disabled={updateTemplateMutation.isPending}
              className="hover:cursor-pointer"
            >
              {updateTemplateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template "{template.name}" and all its sections.
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
    </div>
  );
}
