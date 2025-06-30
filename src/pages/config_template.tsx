import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { getTemplateById, deleteTemplate } from "@/services/templates";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { TemplateSection } from "@/components/template_section";
import { Trash2 } from "lucide-react";

export default function ConfigTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching template:", error);
    }
  }, [error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  if (!template) {
    return <div>No template found with ID: {id}</div>;
  }

  const handleDelete = async () => {
    try {
      await deleteTemplate(template.id);
      // Aquí podrías redirigir o actualizar el estado de la lista de templates
      console.log("Template deleted successfully");
      navigate("/templates"); // Redirigir a la lista de templates
    } catch (deleteError) {
      console.error("Error deleting template:", deleteError);
    }
  }

  console.log("Template data:", template);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configure Template: "{template.name}"</h1>
        <Button type="button" className="hover:cursor-pointer" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

        <Button type="button" variant="outline" className="hover:cursor-pointer">
          Add Section
        </Button>

      <div className="space-y-4">
        {template.template_sections.map((section: any) => (
          <TemplateSection key={section.id} item={section} />
        ))}
      </div>
    </div>
  );
}