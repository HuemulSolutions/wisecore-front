import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
    linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, 
    CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator,
    type MDXEditorMethods
 } from '@mdxeditor/editor'
import { useRef, useState } from 'react'
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
    const editorRef = useRef<MDXEditorMethods | null>(null);
    return (
        <div className="w-full z-10">
            {/* Top Action Buttons - Sticky */}
            <div className="sticky top-0 flex z-50 items-center justify-end gap-2 py-2 px-1 bg-white/95 backdrop-blur-sm"
                 style={{ zIndex: 9000 }}>
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
            
            <div className="border border-gray-200 rounded-md focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
                <style>{`
                    .mdxeditor .mdxeditor-toolbar {
                        position: sticky !important;
                        top: 32px !important;
                        z-index: 51 !important;
                        background: white !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                    }

                    /* ✅ Popovers/menus del toolbar (BlockTypeSelect, link dialog, etc.) por encima del header sticky */
                    .mdxeditor [data-radix-popper-content-wrapper] {
                        z-index: 10050 !important;
                    }
                `}</style>
                <MDXEditor
                ref={editorRef}
                markdown={value}
                onChange={setValue}
                overlayContainer={document.body}
                spellCheck={false}
                contentEditableClassName='mdxeditor-content min-h-[240px] prose dark:prose-invert focus:outline-none px-4 py-3'
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
                        toolbarClassName: 'mdxeditor-toolbar',
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
                                    <BlockTypeSelect/>
                                    <Separator />
                                    <CreateLink />
                                    {/* <InsertImage /> */}
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
        </div>
    )
}