import { useState, useMemo } from "react";
import { FileText, Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface Document {
    id: string;
    name: string;
    document_type?: {
        id: string;
        name: string;
        color: string;
    };
}

interface DocumentType {
    id: string;
    name: string;
    color: string;
}

interface DocumentSelectorTreeProps {
    documents: Document[];
    documentTypes: DocumentType[];
    selectedDocumentTypes: string[];
    onDocumentSelect: (documentId: string) => void;
    onFilterChange: (selectedTypes: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

interface DocumentTreeItemProps {
    document: Document;
    onSelect: (documentId: string) => void;
    searchTerm: string;
}

function DocumentTreeItem({ document, onSelect, searchTerm }: DocumentTreeItemProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Highlight search term in document name
    const highlightSearchTerm = (text: string, term: string) => {
        if (!term) return text;
        
        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <span key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                    {part}
                </span>
            ) : part
        );
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors group",
                "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
                isHovered && "bg-blue-50 border-blue-200"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelect(document.id)}
        >
            {/* Document Icon */}
            <div className="flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                        {highlightSearchTerm(document.name, searchTerm)}
                    </span>
                    {document.document_type && (
                        <Badge 
                            variant="outline" 
                            className="text-xs flex-shrink-0"
                            style={{ 
                                borderColor: document.document_type.color,
                                color: document.document_type.color,
                                backgroundColor: `${document.document_type.color}10`
                            }}
                        >
                            {document.document_type.name}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Hover indicator */}
            <div className={cn(
                "w-2 h-2 rounded-full bg-blue-600 opacity-0 transition-opacity",
                isHovered && "opacity-100"
            )} />
        </div>
    );
}

export function DocumentSelectorTree({
    documents,
    documentTypes,
    selectedDocumentTypes,
    onDocumentSelect,
    onFilterChange,
    placeholder = "Search and select a document...",
    disabled = false
}: DocumentSelectorTreeProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    // Filter documents based on search term and document types
    const filteredDocuments = useMemo(() => {
        let filtered = documents;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(doc => 
                doc.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by document types
        if (selectedDocumentTypes.length > 0) {
            filtered = filtered.filter(doc => 
                doc.document_type ? selectedDocumentTypes.includes(doc.document_type.id) : false
            );
        }

        return filtered;
    }, [documents, searchTerm, selectedDocumentTypes]);

    const clearSearch = () => {
        setSearchTerm("");
    };

    const clearFilters = () => {
        onFilterChange([]);
    };

    const handleTypeFilterChange = (typeId: string, checked: boolean) => {
        if (checked) {
            onFilterChange([...selectedDocumentTypes, typeId]);
        } else {
            onFilterChange(selectedDocumentTypes.filter(id => id !== typeId));
        }
    };

    if (disabled) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 text-center">No documents available to select</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search and Filter Header */}
            <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-8"
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="h-3 w-3 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Filter Button */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="hover:cursor-pointer"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                            {selectedDocumentTypes.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                    {selectedDocumentTypes.length}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">Filter by Type</h4>
                                {selectedDocumentTypes.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="h-6 px-2 text-xs hover:cursor-pointer"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {documentTypes.map((type) => (
                                    <div key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type.id}
                                            checked={selectedDocumentTypes.includes(type.id)}
                                            onCheckedChange={(checked: boolean) => {
                                                handleTypeFilterChange(type.id, checked);
                                            }}
                                        />
                                        <label
                                            htmlFor={type.id}
                                            className="flex items-center space-x-2 text-sm cursor-pointer flex-1"
                                        >
                                            <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: type.color }}
                                            />
                                            <span className="truncate">{type.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Results Info */}
            {(searchTerm || selectedDocumentTypes.length > 0) && (
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                    <span>
                        {filteredDocuments.length} of {documents.length} documents
                        {searchTerm && ` matching "${searchTerm}"`}
                    </span>
                    {(searchTerm || selectedDocumentTypes.length > 0) && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                clearSearch();
                                clearFilters();
                            }}
                            className="h-5 px-2 text-xs hover:cursor-pointer"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            )}

            {/* Document Tree */}
            <div className="border border-gray-200 rounded-lg bg-white max-h-64 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                    <div className="p-6 text-center">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                            {searchTerm || selectedDocumentTypes.length > 0 
                                ? "No documents match your criteria" 
                                : "No documents available"}
                        </p>
                        {(searchTerm || selectedDocumentTypes.length > 0) && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    clearSearch();
                                    clearFilters();
                                }}
                                className="mt-2 text-xs hover:cursor-pointer"
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredDocuments.map((document) => (
                            <DocumentTreeItem
                                key={document.id}
                                document={document}
                                onSelect={onDocumentSelect}
                                searchTerm={searchTerm}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}