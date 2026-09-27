export interface MdxEditorProps {
  value: string
  onChange: (value: string) => void
  onError?: (payload: { error: string; source: string }) => void
  diffMarkdown?: string
  stickyToolbar?: boolean
}
