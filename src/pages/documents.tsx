import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllDocuments } from "@/services/documents";
import Document from "@/components/document";
import CreateDocument from "@/components/create_document";
import { getAllDocumentTypes } from "@/services/document_type";
import { useOrganization } from "@/contexts/organization-context";

export default function Documents() {
  const { selectedOrganizationId } = useOrganization();
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string | null>(null);
  const [tempDocumentTypeFilter, setTempDocumentTypeFilter] = useState<string | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const {
    data: documents,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["documents", selectedOrganizationId, documentTypeFilter],
    queryFn: () => getAllDocuments(selectedOrganizationId!, documentTypeFilter || undefined),
    enabled: !!selectedOrganizationId, // Solo ejecutar si hay una organización seleccionada
  });

  const { data: documentTypes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: getAllDocumentTypes,
  });

  const handleApplyFilters = () => {
    setDocumentTypeFilter(tempDocumentTypeFilter);
    setIsFilterPopoverOpen(false);
  };

  const handleClearFilters = () => {
    setDocumentTypeFilter(null);
    setTempDocumentTypeFilter(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (queryError) {
    return <div>Error: {(queryError as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <div className="flex items-center space-x-2">
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Filter documents"
                className="hover:cursor-pointer"
                title="Filter documents"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Filter Assets</h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Asset Type</label>
                  <Select
                    onValueChange={(value) =>
                      setTempDocumentTypeFilter(value === "all" ? null : value)
                    }
                    value={tempDocumentTypeFilter || "all"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All asset types</SelectItem>
                      {documentTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1 hover:cursor-pointer"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1 hover:cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* <Button
            size="icon"
            aria-label="Import document"
            className="hover:cursor-pointer"
            title="Import document"
            onClick={() => {
              // TODO: Implement import functionality
              console.log("Import document");
            }}
          >
            <MonitorUp className="h-4 w-4" />
          </Button> */}
          <CreateDocument
            trigger={
              <Button
                size="icon"
                variant="outline"
                aria-label="Add document"
                className="hover:cursor-pointer"
                title="Add document"
              >
                +
              </Button>
            }
          />
        </div>
      </div>
      <ul className="space-y-4">
        {documents?.map((doc: any) => {
          return <Document key={doc.id} doc={doc} />;
        })}
      </ul>
    </div>
  );
}