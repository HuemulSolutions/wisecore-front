import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getExecutionById } from "@/services/executions";

import { useState, useEffect } from "react";
import SectionExecution from "@/components/sections/sections_execution";
import { TableOfContents } from "@/components/assets/content/assets-table-of-contents";
import Chatbot from "@/components/chatbot/chatbot";
import { useOrganization } from "@/contexts/organization-context";

interface ExecutionInfoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  documentName?: string;
  sectionName?: string;
}

export function ExecutionInfoSheet({
  isOpen,
  onOpenChange,
  executionId,
  documentName,
}: ExecutionInfoSheetProps) {
  const { selectedOrganizationId } = useOrganization();
  const [isGenerating] = useState(false);
  const [editableSections, setEditableSections] = useState<any[]>([]);

  const { data: execution, isLoading, error, refetch } = useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => getExecutionById(executionId, selectedOrganizationId!),
    enabled: isOpen && !!executionId && !!selectedOrganizationId,
  });

  // Update local state when execution data changes
  useEffect(() => {
    if (execution?.sections) {
      setEditableSections([...execution.sections]);
    }
  }, [execution]);

  // Create table of contents
  const tocItems = [
    { id: "execution-info", title: "Execution Info", level: 1 },
    { id: "execution-config", title: "Execution Configuration", level: 1 },
    ...(editableSections?.map(section => ({
      id: section.id || section.section_execution_id,
      title: section.name,
      level: 2,
    })) || [])
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:max-w-[90vw] max-h-[95vh] overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <SheetTitle className="text-lg">{documentName || 'Execution Details'}</SheetTitle>
          </div>
          <SheetDescription className="text-sm">
            Execution interface with content generation
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading execution details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Failed to load execution details. Please try again.
              </p>
            </div>
          )}

          {execution && (
            <div className="flex h-full gap-4">
              {/* Main Content - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4 pb-4">
                  {/* Compact Execution Info */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Execution Status
                        </CardTitle>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status?.charAt(0).toUpperCase() + execution.status?.slice(1) || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Model:</span>
                          <span className="ml-2 text-gray-900">{execution.llm_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Sections:</span>
                          <span className="ml-2 text-gray-900">{editableSections.length}</span>
                        </div>
                      </div>
                      
                      {execution.instruction && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600 text-sm">Instructions:</span>
                          <div className="bg-gray-50 rounded-md p-2 mt-1">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {execution.instruction}
                            </p>
                          </div>
                        </div>
                      )}

                      {execution.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600 mt-3 text-sm">
                          <Check className="h-4 w-4" />
                          <span className="font-medium">Execution Completed</span>
                        </div>
                      )}
                      
                      {execution.status === 'running' && (
                        <div className="flex items-center gap-2 text-blue-600 mt-3 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="font-medium">Generating Content...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Compact Sections */}
                  {editableSections && editableSections.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 px-1">Sections</h3>
                      {editableSections.map((section: any) => (
                        <Card key={section.id || section.section_execution_id} className="border-l-4 border-l-gray-300">
                          <div id={section.id || section.section_execution_id}>
                            <SectionExecution
                              sectionExecution={section}
                              onUpdate={refetch}
                              readyToEdit={execution.status === "completed" && !isGenerating}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Table of Contents - Right Sidebar */}
              <div className="w-48 hidden lg:block flex-shrink-0 border-l pl-4">
                <div className="sticky top-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Contents</h4>
                  <div className="text-xs">
                    <TableOfContents items={tocItems} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Chatbot */}
          {execution && (
            <div className="absolute bottom-4 right-4 z-50">
              <div className="scale-90 origin-bottom-right">
                <Chatbot executionId={executionId} />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}