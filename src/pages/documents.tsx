import { getAllDocuments } from "@/services/documents";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Documents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: getAllDocuments,
  });
  const [expandedDesc, setExpandedDesc] = useState<{ [id: string]: boolean }>({});

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const descLimit = 80;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Button className="ml-2" variant="outline" size="icon" aria-label="Agregar documento">
          +
        </Button>
      </div>
      <ul className="space-y-2">
        {data?.map((doc: any) => {
          const showFull = expandedDesc[doc.id] || false;
          const isLong = doc.description.length > descLimit;
          const desc = showFull ? doc.description : doc.description.slice(0, descLimit) + (isLong ? "..." : "");
          return (
            <li key={doc.id} className="p-0 bg-white rounded shadow">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <div className="flex flex-col gap-2 p-4">
                    <h2 className="text-lg font-semibold mb-1">{doc.name}</h2>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Template: {doc.template.name}</span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      {desc}
                      {isLong && (
                        <Button variant="link" size="sm" className="ml-2 p-0 h-auto align-baseline" onClick={() => setExpandedDesc(prev => ({ ...prev, [doc.id]: !showFull }))}>
                          {showFull ? "Ver menos" : "Ver más"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <AccordionTrigger className="px-4">Últimas ejecuciones</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Aquí puedes agregar más información del documento en el futuro */}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
          );
        })}
      </ul>
    </div>
  );
}