import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
    linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, InsertImage, 
    CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator
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
        <div className="w-full bg-gray-50 rounded-lg border">
            {/* Top Action Buttons - Sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-medium text-gray-900">Edit Content</h3>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleCancel} 
                        className="hover:cursor-pointer text-sm h-8" 
                        size="sm"
                        disabled={isSaving}
                    >
                        <X className='h-3 w-3 mr-1' /> Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8" 
                        size="sm"
                        disabled={!dirty || isSaving}
                    >
                        {isSaving ? <Loader2 className='h-3 w-3 mr-1 animate-spin' /> : <Check className='h-3 w-3 mr-1' />} 
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
            
            <div className="m-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <style>{`
                    .mdxeditor .mdxeditor-toolbar {
                        position: sticky !important;
                        top: 60px !important;
                        z-index: 5 !important;
                        background: white !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    }
                `}</style>
                <MDXEditor
                markdown={value}
                onChange={setValue}
                spellCheck={false}
                contentEditableClassName='mdxeditor-content min-h-[240px] prose dark:prose-invert focus:outline-none p-3'
                plugins={[
                    headingsPlugin(), 
                    listsPlugin(), 
                    quotePlugin(), 
                    tablePlugin(),
                    thematicBreakPlugin(), 
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin({
                        imageUploadHandler: async () => {
                            // Placeholder - returns a sample image URL
                            return Promise.resolve('https://via.placeholder.com/400x300');
                        }
                    }),
                    codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                    codeMirrorPlugin({ codeBlockLanguages: { 
                        js: 'JavaScript', 
                        jsx: 'JavaScript (React)', 
                        ts: 'TypeScript', 
                        tsx: 'TypeScript (React)', 
                        css: 'CSS', 
                        html: 'HTML', 
                        json: 'JSON',
                        bash: 'Bash',
                        sh: 'Shell',
                        yaml: 'YAML',
                        yml: 'YAML',
                        xml: 'XML',
                        sql: 'SQL',
                        python: 'Python',
                        go: 'Go',
                        rust: 'Rust',
                        java: 'Java',
                        c: 'C',
                        cpp: 'C++',
                        php: 'PHP',
                        ruby: 'Ruby',
                        '': 'Plain text'
                    }}),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                        toolbarContents() {
                            return (
                                <>  
                                    <UndoRedo />
                                    <Separator />
                                    <BoldItalicUnderlineToggles />
                                    <CodeToggle />
                                    <Separator />
                                    <ListsToggle />
                                    <Separator />
                                    <BlockTypeSelect />
                                    <Separator />
                                    <CreateLink />
                                    <InsertImage />
                                    <Separator />
                                    <InsertTable />
                                    <InsertCodeBlock />
                                    <InsertThematicBreak />
                                </>
                            )
                        },
                    }), ]}
                />
            </div>
            
            {/* Bottom Action Buttons */}
            <div className='flex gap-2 justify-end p-3 border-t bg-gray-50 rounded-b-md'>
                <Button 
                    variant='outline' 
                    className='hover:cursor-pointer text-sm h-8' 
                    size="sm"
                    onClick={handleCancel} 
                    disabled={isSaving}
                >
                    <X className='h-3 w-3 mr-1' /> Cancel
                </Button>
                <Button 
                    className='bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8' 
                    size="sm"
                    onClick={handleSave} 
                    disabled={!dirty || isSaving}
                >
                    {isSaving ? <Loader2 className='h-3 w-3 mr-1 animate-spin' /> : <Check className='h-3 w-3 mr-1' />} 
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </div>
    )
}