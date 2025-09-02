import { useParams, useNavigate } from "react-router-dom";
import { getDocumentById } from "@/services/documents";
import { createExecution } from "@/services/executions";
import { formatDate } from "@/services/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Settings,
  FileText,
  Presentation,
  Eye,
  Network,
  ChevronRight,
  FileCog,
  RefreshCw,
  DiamondMinus,
  File,
  ArrowLeft
} from "lucide-react";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: document,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id, // Only run if id is defined
  });

  const handleRefreshExecutions = () => {
    refetch();
  };

  const handleDelete = async () => {
    try {
      // Aquí deberías implementar la lógica para eliminar el documento
      // Por ejemplo, llamar a un servicio de API para eliminar el documento
      console.log("Document deleted successfully");
      navigate("/documents"); // Redirect to the documents list
    } catch (deleteError) {
      console.error("Error deleting document:", deleteError);
    }
  };

  const handleConfigureDocument = () => {
    navigate(`/configDocument/${id}`);
  };

  const handleNewExecution = () => {
    createExecution(id!)
      .then((execution) => {
        console.log("Execution created:", execution);
        navigate(`/execution/${execution.id}`);
      })
      .catch((error) => {
        console.error("Error creating execution:", error);
      });
  };


  const handleViewDependencies = () => {
    // Implementar lógica para ver dependencias
    navigate(`/docDepend/${id}`);
  };

  const handleExecutionClick = (executionId: number) => {
    // Navegar al detalle de la ejecución
    navigate(`/execution/${executionId}`);
  };

  const handleExportPDF = () => {
    // Implementar lógica para exportar a PDF
    console.log("Export to PDF");
  };

  const handleExportWord = () => {
    // Implementar lógica para exportar a Word
    console.log("Export to Word");
  };

  const handleExportPPT = () => {
    // Implementar lógica para exportar a PowerPoint
    console.log("Export to PowerPoint");
  };

  const handleExportMarkdown = () => {
    // Implementar lógica para exportar a Markdown
    console.log("Export to Markdown");
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!document) {
    return <div>No document found with ID: {id}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:cursor-pointer"
            onClick={() => navigate("/documents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Manage Asset</h1>
        </div>
      </div>

      {/* Document Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Information */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{document.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">
                  {document.description || "No description"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-medium">
                  {document.organization}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Asset Type</p>
                {document.document_type ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: document.document_type.color }}
                    />
                    {document.document_type.name}
                  </span>
                ) : (
                  <p className="font-medium text-gray-500">No type</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Template</p>
                <p className="font-medium">
                  {document.template_name
                    ? document.template_name
                    : "No template"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">
                  {document.created_at
                    ? formatDate(document.created_at)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Modified</p>
                <p className="font-medium">
                  {document.updated_at
                    ? formatDate(document.updated_at)
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:cursor-pointer"
              onClick={handleConfigureDocument}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Asset
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:cursor-pointer"
              onClick={handleNewExecution}
            >
              <FileCog className="h-4 w-4 mr-2" />
              New Execution
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:cursor-pointer"
              onClick={handleViewDependencies}
            >
              <Network className="h-4 w-4 mr-2" />
              Dependencies and Context
            </Button>
            <Button
              size="sm"
              className="w-full justify-start hover:cursor-pointer"
              onClick={handleDelete}
              title="Delete Document"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Asset
            </Button>
            <div className="border-t pt-3 mt-3">
              <p className="text-sm text-gray-600 mb-2">Export Options</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:cursor-pointer"
                  onClick={handleExportPDF}
                  disabled={true}
                >
                  <File className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:cursor-pointer"
                  onClick={handleExportWord}
                  disabled={true}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export to Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:cursor-pointer"
                  onClick={handleExportPPT}
                  disabled={true}
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  Export to PowerPoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:cursor-pointer"
                  onClick={handleExportMarkdown}
                >
                  <DiamondMinus className="h-4 w-4 mr-2" />
                  Export to Markdown
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Executions
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hover:cursor-pointer"
              onClick={handleRefreshExecutions}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {document.executions && document.executions.length > 0 ? (
            <div className="space-y-2">
              {document.executions.map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:cursor-pointer transition-colors"
                  onClick={() => handleExecutionClick(execution.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        Execution{" "}
                        {formatDate(execution.created_at)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          execution.status === "approved"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : execution.status === "completed"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : execution.status === "failed"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : execution.status === "running"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : execution.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {execution.status === "running" ? "Executing" : execution.status === "pending" ? "Pending" : execution.status}
                      </span>
                    </div>
                    {execution.status_message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {execution.status_message}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No executions found for this document</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
