import { useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaIcon, isImage } from "@/huemul/components/huemul-media-icon";

// Mapa best-effort extensión → mime, solo para decidir imagen vs. archivo y elegir
// ícono cuando no se conoce el content_type real (ej. valor ya persistido: el backend
// solo devuelve la URL firmada, sin metadatos del archivo).
const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  zip: "application/zip",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

// Deriva nombre y extensión desde la URL cuando no se conocen por props (valor ya
// persistido: el backend solo resuelve la URL firmada, sin metadatos del archivo).
function inferFromUrl(url: string): { name: string; extension: string } {
  try {
    const path = new URL(url).pathname;
    const last = decodeURIComponent(path.split("/").pop() ?? "");
    const dot = last.lastIndexOf(".");
    return { name: last, extension: dot >= 0 ? last.slice(dot + 1).toLowerCase() : "" };
  } catch {
    return { name: "", extension: "" };
  }
}

interface HuemulFilePreviewProps {
  url: string;
  fileName?: string | null;
  contentType?: string | null;
  alt?: string;
  downloadLabel: string;
  className?: string;
}

// Preview de un archivo ya subido (campo carga_de_archivos / custom field imagen):
// imagen si el tipo real lo es, tarjeta con ícono + nombre + descarga en cualquier
// otro caso. La decisión se toma por el archivo real (content_type/extensión), nunca
// por field.data_type — ese siempre vale "image" para carga_de_archivos en el
// catálogo de question_types, sin relación con el archivo que subió el usuario.
export function HuemulFilePreview({ url, fileName, contentType, alt, downloadLabel, className }: HuemulFilePreviewProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const inferred = fileName || contentType ? { name: fileName ?? "", extension: "" } : inferFromUrl(url);
  const name = fileName || inferred.name;
  const resolvedContentType = contentType || EXTENSION_MIME[inferred.extension] || null;

  if (!imgFailed && isImage(resolvedContentType)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn("inline-block", className)}>
        <img
          src={url}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="max-h-48 rounded border border-gray-200 object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50",
        className,
      )}
    >
      <MediaIcon contentType={resolvedContentType} className="size-4" />
      <span className="truncate">{name || downloadLabel}</span>
      <Download className="size-3.5 shrink-0 text-gray-400" />
    </a>
  );
}
