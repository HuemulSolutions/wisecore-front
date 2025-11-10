export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  icon?: string
  isLoading?: boolean
  hasMore?: boolean
  document_type?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface FileTreeProps {
  items: FileNode[]
  onDrop?: (draggedItem: FileNode, targetFolder: FileNode) => void
  onSelect?: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
}
