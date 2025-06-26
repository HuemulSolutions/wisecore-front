import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { useState } from "react";
import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

interface DocumentItemProps {
  doc: any;
  descLimit?: number;
}

const Document: React.FC<DocumentItemProps> = ({ doc, descLimit = 80 }) => {
  const [expandedText, setExpandedText] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(false);
  const isLong = doc.description.length > descLimit;
  const desc = expandedText ? doc.description : doc.description.slice(0, descLimit) + (isLong ? "..." : "");

  const { data: executions, isLoading, isError } = useExecutionsByDocumentId(doc.id, expandedAccordion);

  return (
    <li key={doc.id} className="p-0 bg-white rounded shadow">
      <Accordion type="single" collapsible onValueChange={val => setExpandedAccordion(val === "item-1")}> 
        <AccordionItem value="item-1">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">{doc.name}</h2>
              <Button variant="outline" size="sm" className="hover:cursor-pointer">
                Ver detalles
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Template: {doc.template ? doc.template.name : "No template"}
              </span>
            </div>
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
          <AccordionTrigger className="px-4 hover:cursor-pointer">Ejecuciones</AccordionTrigger>
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
    </li>
  );
};

export default Document;