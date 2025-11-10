"use client"

import { useState, useMemo } from "react"
import { Search, X, Folder, File } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FileNode } from "./types"

interface FileSearchProps {
  items: FileNode[]
  onSelect?: (item: FileNode) => void
  selectedId?: string
  placeholder?: string
}

export function FileSearch({
  items,
  onSelect,
  selectedId,
  placeholder = "Buscar carpetas o archivos...",
}: FileSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Función recursiva para filtrar nodos según el término de búsqueda
  const filterNodes = (nodes: FileNode[], term: string): FileNode[] => {
    if (!term.trim()) return []

    const lowerTerm = term.toLowerCase()
    const results: FileNode[] = []

    const traverse = (node: FileNode): boolean => {
      const matches = node.name.toLowerCase().includes(lowerTerm)

      if (node.type === "folder" && node.children) {
        const childResults = node.children.filter(traverse)
        if (matches || childResults.length > 0) {
          results.push({
            ...node,
            children: childResults.length > 0 ? childResults : node.children,
          })
          return true
        }
      } else if (matches) {
        results.push(node)
        return true
      }

      return false
    }

    nodes.forEach(traverse)
    return results
  }

  const searchResults = useMemo(() => filterNodes(items, searchTerm), [items, searchTerm])

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Mostrar resultados de búsqueda */}
      {searchTerm && (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
              {searchResults.length !== 1 ? "s" : ""}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">No se encontraron resultados</div>
          )}
          {searchResults.map((result) => (
            <SearchResultItem key={result.id} item={result} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  )
}

interface SearchResultItemProps {
  item: FileNode
  level?: number
  onSelect?: (item: FileNode) => void
  selectedId?: string
}

function SearchResultItem({ item, level = 0, onSelect, selectedId }: SearchResultItemProps) {
  const isFolder = item.type === "folder"
  const hasChildren = isFolder && item.children && item.children.length > 0
  const isSelected = selectedId === item.id

  return (
    <div className="w-full">
      <div
        onClick={() => onSelect?.(item)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isFolder ? (
          <Folder className="w-4 h-4 flex-shrink-0 text-primary" />
        ) : (
          <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        )}

        <span className="truncate text-sm font-medium flex-1">{item.name}</span>
      </div>

      {/* Mostrar hijos si existen */}
      {isFolder && hasChildren && (
        <div className="w-full">
          {item.children!.map((child) => (
            <SearchResultItem
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
