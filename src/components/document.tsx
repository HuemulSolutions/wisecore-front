import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { useState } from "react";
import { Clock, Loader2, CheckCircle, XCircle, MoreVertical, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/services/documents";

interface Document {
  id: string;
  name: string;
  description: string;
  template: { id: string; name: string } | null;
  document_type: { id: string; name: string; color: string } | null;
}

interface DocumentItemProps {
  doc: Document;
  descLimit?: number;
}

const Document: React.FC<DocumentItemProps> = ({ doc, descLimit = 80 }) => {
  const [expandedText, setExpandedText] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLong = doc.description.length > descLimit;
  const desc = expandedText ? doc.description : doc.description.slice(0, descLimit) + (isLong ? "..." : "");

  const { data: executions, isLoading, isError } = useExecutionsByDocumentId(doc.id, expandedAccordion);

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error deleting document:', error);
      // TODO: Show error notification to user
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(doc.id);
  };

  return (
    <li key={doc.id} className="p-0 bg-white rounded-lg shadow">
      <Accordion type="single" collapsible onValueChange={val => setExpandedAccordion(val === "item-1")}> 
        <AccordionItem value="item-1">
          <div className="flex flex-col gap-2 p-4 pr-2">
            <div className="flex items-center justify-between mb-1">
                <h2 
                className="text-lg font-semibold hover:cursor-pointer hover:underline transition-colors" 
                onClick={() => navigate(`/document/${doc.id}`)}
                >
                {doc.name}
                </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-600 hover:cursor-pointer"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Template: {doc.template ? doc.template.name : "No template"}
              </span>
            </div>
            {doc.document_type && (
              <div className="mt-2 mb-1">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: doc.document_type.color }}
                  />
                  {doc.document_type.name}
                </span>
              </div>
            )}
            <div className="text-gray-600 text-sm">
              {desc}
              {isLong && (
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto align-baseline"
                  onClick={() => setExpandedText(!expandedText)}
                >
                  {expandedText ? "Ver menos" : "Ver más"}
                </Button>
              )}
            </div>
            
          </div>
          <AccordionTrigger className="px-4 hover:cursor-pointer">Executions</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {expandedAccordion && (
              <div>
                {isLoading && <div className="text-xs text-gray-400">Cargando ejecuciones...</div>}
                {isError && <div className="text-xs text-red-500">Error al cargar ejecuciones</div>}
                {executions && executions.length === 0 && (
                  <div className="text-xs text-gray-400">No hay ejecuciones recientes.</div>
                )}
                {executions && executions.length > 0 && (
                  <ul className="space-y-2">
                    {executions.map((exe: any) => {
                      const statusConfig = {
                        pending: { color: "text-gray-400", icon: <Clock className="w-4 h-4 mr-1" /> },
                        running: { color: "text-blue-500", icon: <Loader2 className="w-4 h-4 mr-1 animate-spin" /> },
                        completed: { color: "text-green-600", icon: <CheckCircle className="w-4 h-4 mr-1" /> },
                        approved: { color: "text-green-600", icon: <CheckCircle className="w-4 h-4 mr-1" /> },
                        failed: { color: "text-red-500", icon: <XCircle className="w-4 h-4 mr-1" /> },
                      };
                      type StatusType = keyof typeof statusConfig;
                      const status: StatusType = ["pending", "running", "completed", "approved", "failed"].includes(exe.status) ? exe.status : "pending";
                      const { color, icon } = statusConfig[status];
                      return (
                        <li key={exe.id} className="flex justify-between items-center text-xs bg-gray-50 rounded px-2 py-1">
                          <span>{new Date(exe.created_at).toLocaleString()}</span>
                          <span className={`flex items-center font-semibold gap-1 ${color}`}>
                            {icon}
                            {exe.status.charAt(0).toUpperCase() + exe.status.slice(1)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document "{doc.name}" and all its associated executions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
};

export default Document;