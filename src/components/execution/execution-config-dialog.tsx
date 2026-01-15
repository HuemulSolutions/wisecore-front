import { useState, useEffect } from 'react';
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, FastForward, Bot, Loader2 } from 'lucide-react';
import { getLLMs, getDefaultLLM, type LLM } from '@/services/llms';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

interface ExecutionConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'single' | 'from';
    onExecute: (config: ExecutionConfig) => void;
    isExecuting?: boolean;
}

export interface ExecutionConfig {
    instructions: string;
    llmModel: string;
}

export default function ExecutionConfigDialog({ 
    open, 
    onOpenChange, 
    mode, 
    onExecute, 
    isExecuting = false 
}: ExecutionConfigDialogProps) {
    const { selectedOrganizationId } = useOrganization();
    const [instructions, setInstructions] = useState('');
    const [llmModel, setLlmModel] = useState('');
    const [availableLLMs, setAvailableLLMs] = useState<LLM[]>([]);
    const [isLoadingLLMs, setIsLoadingLLMs] = useState(false);

    // Load available LLMs when dialog opens
    useEffect(() => {
        if (open && selectedOrganizationId) {
            loadLLMs();
        }
    }, [open, selectedOrganizationId]);

    const loadLLMs = async () => {
        try {
            setIsLoadingLLMs(true);
            const llms = await getLLMs();
            setAvailableLLMs(llms);
            
            // Try to set default LLM
            if (llms.length > 0) {
                try {
                    const defaultLLM = await getDefaultLLM();
                    setLlmModel(defaultLLM.id);
                } catch (error) {
                    // If no default, use first available LLM
                    setLlmModel(llms[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading LLMs:', error);
            toast.error('Failed to load available LLMs');
        } finally {
            setIsLoadingLLMs(false);
        }
    };

    const handleExecute = () => {
        onExecute({
            instructions,
            llmModel,
        });
        // Reset form
        setInstructions('');
        setLlmModel('');
    };

    const title = mode === 'single' ? 'Execute This Section' : 'Execute From This Section';
    const description = mode === 'single' 
        ? 'Configure execution for this specific section only'
        : 'Configure execution from this section onwards';

    const Icon = mode === 'single' ? Play : FastForward;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <ReusableDialog
                open={open}
                onOpenChange={onOpenChange}
                title={title}
                description={description}
                icon={Icon}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                disabled={isExecuting}
                                className="hover:cursor-pointer"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleExecute}
                            disabled={isExecuting || !llmModel || isLoadingLLMs || availableLLMs.length === 0}
                            className={`hover:cursor-pointer ${
                                mode === 'single' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            {isExecuting ? (
                                <>
                                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <Icon className="h-4 w-4 mr-2" />
                                    Execute
                                </>
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="llm-model">LLM Model</Label>
                        <Select value={llmModel} onValueChange={setLlmModel} disabled={isLoadingLLMs}>
                            <SelectTrigger className='w-full'>
                                {isLoadingLLMs ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading LLMs...
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Select LLM model" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {availableLLMs.map((llm) => (
                                    <SelectItem key={llm.id} value={llm.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{llm.name}</span>
                                            {llm.is_default && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">default</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                                {availableLLMs.length === 0 && !isLoadingLLMs && (
                                    <SelectItem value="" disabled>
                                        No LLMs available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {availableLLMs.length === 0 && !isLoadingLLMs && (
                            <p className="text-xs text-red-600">
                                No LLMs configured. Please configure LLMs in the admin panel.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions (Optional)</Label>
                        <Textarea
                            id="instructions"
                            placeholder="Enter specific instructions for this execution..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            Provide any specific guidance or requirements for the AI execution.
                        </p>
                    </div>
                </div>
            </ReusableDialog>
        </Dialog>
    );
}