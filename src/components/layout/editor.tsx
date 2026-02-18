import { useState } from 'react'
import MdxEditor from './mdx-editor'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'


interface EditorProps {
    sectionId: string;
    content: string;
    onSave: (sectionId: string, newContent: string) => void | Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export default function Editor({ sectionId, content, onSave, onCancel, isSaving = false }: EditorProps) {
    const [value, setValue] = useState(content)
    const [, setError] = useState<string | null>(null)
    const dirty = value !== content
    const handleSave = () => dirty && !isSaving && onSave(sectionId, value)
    const handleCancel = () => !isSaving && onCancel()
    const handleError = (payload: { error: string; source: string }) => {
        console.error('MDXEditor error:', payload);
        setError(payload.error);
    }

    return (
        <div className="w-full z-10">
            {/* Top Action Buttons - Sticky */}
            <div className="sticky top-0 flex z-50 items-center justify-end gap-2 py-2 px-1 bg-white/95 backdrop-blur-sm">
                <Button 
                    variant="ghost" 
                    onClick={handleCancel} 
                    className="hover:cursor-pointer hover:bg-gray-100 h-7 w-7 p-0" 
                    size="sm"
                    disabled={isSaving}
                >
                    <X className='h-4 w-4 text-gray-600' />
                </Button>
                <Button 
                    onClick={handleSave} 
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-7 w-7 p-0" 
                    size="sm"
                    disabled={!dirty || isSaving}
                >
                    {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />}
                </Button>
            </div>
            <MdxEditor
                value={value}
                onChange={setValue}
                onError={handleError}
                diffMarkdown={content}
            />
        </div>
    )
}