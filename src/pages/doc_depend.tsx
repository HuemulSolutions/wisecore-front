import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AddDependency from "@/components/add_dependency";
import AddContext from "@/components/add_context";
import { ArrowLeft } from "lucide-react";

export default function DocDependPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:cursor-pointer"
            onClick={() => navigate(`/document/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Document Dependencies</h1>
        </div>
      </div>

      <AddDependency id={id!} />

      <AddContext id={id!} />
    </div>
  );
}
