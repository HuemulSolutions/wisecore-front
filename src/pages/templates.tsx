import { getAllTemplates } from "@/services/templates";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Template from "@/components/template";
import { useNavigate } from "react-router-dom";

export default function Templates() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: getAllTemplates,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button 
          className="ml-2" 
          variant="outline" 
          size="icon" 
          aria-label="Agregar documento"
          onClick={() => navigate('/addTemplate')}
        >
          +
        </Button>
      </div>
      <ul className="space-y-2">
        {data?.map((doc: any) => {
          return (
            <Template
              key={doc.id}
              doc={doc}
            />
          );
        })}
      </ul>
    </div>
  );
}