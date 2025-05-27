import { useQuery } from '@tanstack/react-query';
import { getAllDocuments, getDocumentSections } from '@/services/documents';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from 'react';

export default function Generate() {
    const { data: documents, isLoading, error } = useQuery({
        queryKey: ['documents'],
        queryFn: getAllDocuments
    });
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const [sections, setSections] = useState<Array<{id: string, name: string}>>([]);
    const [loadingSections, setLoadingSections] = useState(false);

    const handleSelect = async (value: string) => {
        setSelected(value);
        setLoadingSections(true);
        try {
            const data = await getDocumentSections(value);
            setSections(data);
        } catch (e) {
            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Generate document</h1>
            <Select value={selected} onValueChange={handleSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoading ? 'Cargando...' : 'Selecciona un documento'} />
                </SelectTrigger>
                <SelectContent>
                    {documents && documents.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.name || doc.title || doc.id}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <div className="text-red-500">Error al cargar documentos</div>}
            {loadingSections && <div>Cargando secciones...</div>}
            <div className="space-y-6">
                {sections.map(section => (
                    <div key={section.id}>
                        <div className="font-medium mb-2">{section.name}</div>
                        <div className="border rounded-md min-h-[80px] bg-muted p-4 text-muted-foreground">
                            {/* Aquí irá el texto generado por IA */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}