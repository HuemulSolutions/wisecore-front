import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable
 } from '@mdxeditor/editor'
import { useState } from 'react'
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
    const dirty = value !== content
    const handleSave = () => dirty && !isSaving && onSave(sectionId, value)
    const handleCancel = () => !isSaving && onCancel()
    return (
        <div >
            <MDXEditor
                markdown={value}
                onChange={setValue}
                spellCheck={false}
                contentEditableClassName='mdxeditor-content min-h-[240px] prose dark:prose-invert focus:outline-none'
                plugins={[
                    headingsPlugin(), listsPlugin(), quotePlugin(), tablePlugin(),
                    thematicBreakPlugin(), markdownShortcutPlugin(),
                    toolbarPlugin({
                        toolbarContents() {
                            return (
                                <>  
                                    <BlockTypeSelect />
                                    <BoldItalicUnderlineToggles />
                                    <InsertTable />
                                    <UndoRedo />
                                </>
                            )
                        },
                    }), ]}
            />
            <div className='flex gap-2 justify-end p-2 border-t'>
                <Button variant='outline' className='hover:cursor-pointer flex items-center gap-1' onClick={handleCancel} aria-label='Cancel editing' disabled={isSaving}>
                    <X className='h-4 w-4' /> Cancel
                </Button>
                <Button className='hover:cursor-pointer flex items-center gap-1' onClick={handleSave} disabled={!dirty || isSaving} aria-label='Save content changes'>
                    {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />} {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </div>
    )
}