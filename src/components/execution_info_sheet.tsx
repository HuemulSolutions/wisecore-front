import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RefreshCw, MoreVertical, Plus, Trash2, Play, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { formatDate } from '@/services/utils';
import { deleteExecution } from '@/services/executions';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface ExecutionInfoSheetProps {
    execution: {
        id: string;
        document_id: string;
        status: string;
        created_at: string;
        updated_at: string;
        instruction?: string;
        llm_id?: string;
    };
    onRefresh?: () => void;
    isGenerating: boolean;
    onNewExecution?: () => void;
    onExecutionDeleted?: () => void;
}

export default function ExecutionInfoSheet({ execution, onRefresh, isGenerating, onNewExecution, onExecutionDeleted }: ExecutionInfoSheetProps) {
    const navigate = useNavigate();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteExecution(execution.id);
            onExecutionDeleted?.();
            navigate('/assets');
        } catch (error) {
            console.error('Error deleting execution:', error);
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    const handleNewExecution = () => {
        onNewExecution?.();
    };

    const getStatusInfo = (status: string) => {
        const statusConfig = {
            pending: { 
                variant: "outline" as const, 
                label: "Pending", 
                className: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: <Clock className="h-3 w-3 mr-1" />
            },
            running: { 
                variant: "outline" as const, 
                label: "Executing", 
                className: "bg-blue-100 text-blue-800 border-blue-300",
                icon: <Play className="h-3 w-3 mr-1 animate-pulse" />
            },
            completed: { 
                variant: "outline" as const, 
                label: "Completed", 
                className: "bg-green-100 text-green-800 border-green-300",
                icon: <CheckCircle className="h-3 w-3 mr-1" />
            },
            failed: { 
                variant: "outline" as const, 
                label: "Failed", 
                className: "bg-red-100 text-red-800 border-red-300",
                icon: <XCircle className="h-3 w-3 mr-1" />
            },
            approved: { 
                variant: "outline" as const, 
                label: "Approved", 
                className: "bg-emerald-100 text-emerald-800 border-emerald-300",
                icon: <CheckCircle className="h-3 w-3 mr-1" />
            }
        };
        
        return statusConfig[status as keyof typeof statusConfig] || { 
            variant: "secondary" as const, 
            label: status, 
            className: "bg-gray-100 text-gray-800 border-gray-300",
            icon: <AlertTriangle className="h-3 w-3 mr-1" />
        };
    };

    const statusInfo = getStatusInfo(execution.status);

    return (
        <>
            <div className="border rounded-lg bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Play className="h-4 w-4 text-[#4464f7]" />
                            Execution Information
                        </h3>
                        <p className="text-xs text-gray-600">
                            Track execution progress and manage outputs
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs hover:cursor-pointer"
                            onClick={onRefresh}
                            disabled={isGenerating}
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:cursor-pointer"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                    className="hover:cursor-pointer"
                                    onClick={handleNewExecution}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Execution
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="hover:cursor-pointer text-red-600"
                                    onClick={() => setIsDeleteOpen(true)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isDeleting ? 'Deleting...' : 'Delete Execution'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Status */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</p>
                            <Badge variant={statusInfo.variant} className={`${statusInfo.className} border flex items-center w-fit`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </Badge>
                        </div>
                        
                        {/* Created Date */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(execution.created_at)}</p>
                        </div>
                        
                        {/* Last Updated */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Update</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(execution.updated_at)}</p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    {(execution.instruction || execution.llm_id) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {execution.instruction && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Instructions</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                                            {execution.instruction}
                                        </p>
                                    </div>
                                )}
                                
                                {/* {execution.llm_id && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</p>
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
                                            {execution.llm_id}
                                        </Badge>
                                    </div>
                                )} */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Execution</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the execution and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="hover:cursor-pointer" disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 hover:cursor-pointer" 
                            onClick={handleConfirmDelete} 
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}