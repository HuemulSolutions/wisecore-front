import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RefreshCw, MoreVertical, Plus, Settings, Trash2, Network } from "lucide-react";
import { formatDate } from '@/services/utils';


export interface ExecutionInfoProps {
    execution: {
        id: string;
        document_id: string;
        status: string;
        created_at: string;
        updated_at: string;
    };
    onRefresh?: () => void;
}

export default function ExecutionInfo({ execution, onRefresh }: ExecutionInfoProps) {
    const navigate = useNavigate();
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "outline", label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
            running: { variant: "outline", label: "Executing", className: "bg-blue-100 text-blue-800 border-blue-300" },
            completed: { variant: "outline", label: "Completed", className: "bg-green-100 text-green-800 border-green-300" },
            failed: { variant: "outline", label: "Failed", className: "bg-red-100 text-red-800 border-red-300" },
            approved: { variant: "outline", label: "Approved", className: "bg-green-100 text-green-800 border-green-300" }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary", label: status, className: "" };
        return (
            <Badge 
                variant={config.variant as "default" | "secondary" | "destructive" | "outline"} 
                className={config.className || ""}
            >
                {config.label}
            </Badge>
        );
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
                                onClick={onRefresh}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hover:cursor-pointer"
                                onClick={() => console.log('Dependencies and context')} // Placeholder for dependencies logic
                            >
                                <Network className="h-4 w-4 mr-2" />
                                Dependencies and context
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:cursor-pointer p-2"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                        className="hover:cursor-pointer"
                                        onClick={() => navigate(`/document/${execution.document_id}/new-execution`)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New execution
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="hover:cursor-pointer"
                                        onClick={() => console.log('Configure document:', execution.document_id)}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Configure document
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="hover:cursor-pointer text-red-600"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this execution?')) {
                                                console.log('Delete execution:', execution.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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