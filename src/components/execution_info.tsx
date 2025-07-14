import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Plus } from "lucide-react";
import { formatDate } from '@/services/utils';


export interface ExecutionInfoProps {
    execution: {
        id: string;
        document_id: string;
        status: string;
        created_at: string;
        updated_at: string;
    };
}

export default function ExecutionInfo({ execution }: ExecutionInfoProps) {
    const navigate = useNavigate();
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary", label: "Pending" },
            running: { variant: "default", label: "Executing" },
            completed: { variant: "success", label: "Completed" },
            failed: { variant: "destructive", label: "Failed" },
            approved: { variant: "success", label: "Approved" }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary", label: status };
        return <Badge variant={config.variant as any}>{config.label}</Badge>;
    };

    return (
        <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Execution Information</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="hover:cursor-pointer"
                                onClick={() => console.log('Refresh execution details')} // Placeholder for refresh logic
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hover:cursor-pointer"
                                onClick={() => navigate(`/document/${execution.document_id}/new-execution`)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New execution
                            </Button>
                            <Button
                                size="sm"
                                className="hover:cursor-pointer"
                                onClick={() => {
                                    if (confirm('¿Está seguro de que desea eliminar esta ejecución?')) {
                                        // Aquí iría la lógica para eliminar la ejecución
                                        console.log('Eliminar ejecución:', execution.id);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            {getStatusBadge(execution.status)}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Created at</p>
                            <p className="text-sm">{formatDate(execution.created_at)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Last update</p>
                            <p className="text-sm">{formatDate(execution.updated_at)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
    );

}