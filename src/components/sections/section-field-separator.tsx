// Separador visual de sub-sección para form fields de question_type "etiqueta".
// Puramente presentacional: título en negrita + línea divisoria debajo. Reutilizado por
// el runtime de respuesta, la vista de solo lectura del builder y el preview de config,
// para que las tres se vean idénticas.
interface SectionFieldSeparatorProps {
  name: string;
}

export function SectionFieldSeparator({ name }: SectionFieldSeparatorProps) {
  return (
    <div className="pb-1.5 pt-1">
      <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
      <div className="mt-1.5 border-b border-gray-200" />
    </div>
  );
}
