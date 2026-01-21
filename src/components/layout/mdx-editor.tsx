import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    toolbarPlugin,
    BlockTypeSelect,
    tablePlugin,
    InsertTable,
    codeBlockPlugin,
    codeMirrorPlugin,
    linkPlugin,
    linkDialogPlugin,
    CreateLink,
    imagePlugin,
    InsertImage,
    CodeToggle,
    InsertCodeBlock,
    InsertThematicBreak,
    ListsToggle,
    Separator,
    diffSourcePlugin,
    type MDXEditorMethods
} from '@mdxeditor/editor'
import { useRef } from 'react'


interface MdxEditorProps {
    value: string;
    onChange: (value: string) => void;
    onError?: (payload: { error: string; source: string }) => void;
    diffMarkdown?: string;
    stickyToolbar?: boolean;
}


export default function MdxEditor({ value, onChange, onError, diffMarkdown, stickyToolbar = true }: MdxEditorProps) {
    const editorRef = useRef<MDXEditorMethods | null>(null);
    return (
        <div className="border border-gray-200 rounded-md focus-within:ring-1 focus-within:ring-[#4464f7] focus-within:border-[#4464f7] transition-all">
            {/* Estilo condicional para el toolbar sticky */}
            <style>{`
                ${stickyToolbar ? `
                .mdxeditor .mdxeditor-toolbar {
                    position: sticky !important;
                    top: 32px !important;
                    z-index: 51 !important;
                    background: white !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                }
                ` : ''}
            `}</style>
            <MDXEditor
                ref={editorRef}
                markdown={value}
                onChange={onChange}
                onError={onError}
                spellCheck={false}
                contentEditableClassName='mdxeditor-content min-h-[240px] focus:outline-none px-4 py-3'
                plugins={[
                    diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown }),
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
                                    <InsertImage />
                                    <Separator />
                                    <InsertTable />
                                    <InsertCodeBlock />
                                    <InsertThematicBreak />
                                </>
                            )
                        },
                    }),
                ]}
            />
        </div>
    )
}
