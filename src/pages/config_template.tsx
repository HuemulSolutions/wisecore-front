import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { getTemplateById } from "@/services/templates";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function ConfigTemplate() {
  const { id } = useParams<{ id: string }>();

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

  console.log("Template data:", template);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6">Configure Template: "{template.name}"</h1>
      
        
        <Button type="button" variant="outline" className="hover:cursor-pointer">
          Add Section
        </Button>
    </div>
  );
}