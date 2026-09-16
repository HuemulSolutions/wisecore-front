import { useTranslation } from "react-i18next"
import { HuemulFilePreview } from "@/huemul/components/huemul-file-preview"
import type { CustomFieldValueFile } from "@/types/custom-fields"

const MAX_VISIBLE = 3

export interface CustomFieldFilesCellProps {
  files: CustomFieldValueFile[]
}

// Celda de solo lectura para la colección value_files de un custom field carga_de_archivos
// (max_value > 1) — hasta 3 miniaturas de 32px (mismo HuemulFilePreview del runtime de
// formularios) + "+N" si hay más. El caller (assets-custom-fields-list.tsx /
// templates-custom-field-table.tsx) sigue mostrando el render legado (value/URL única)
// cuando files viene vacío — los dos storages conviven, sin migración automática.
export function CustomFieldFilesCell({ files }: CustomFieldFilesCellProps) {
  const { t } = useTranslation("sections")
  const visible = files.slice(0, MAX_VISIBLE)
  const extra = files.length - visible.length

  return (
    <div className="flex items-center gap-1">
      {visible.map((file) => (
        <HuemulFilePreview
          key={file.id}
          url={file.download_url}
          fileName={file.name}
          contentType={file.content_type}
          downloadLabel={t("form.fill.fileDownload")}
          size="xs"
        />
      ))}
      {extra > 0 && (
        <span className="text-xs font-medium text-gray-500">+{extra}</span>
      )}
    </div>
  )
}
