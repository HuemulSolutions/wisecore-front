"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { exportAssetTypes } from "@/services/asset-types"

interface AssetTypeExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ids seleccionados en la tabla que se van a exportar. */
  selectedIds: string[]
  /** Se llama tras exportar con éxito (p.ej. para limpiar la selección). */
  onExported?: () => void
}

export function AssetTypeExportDialog({ open, onOpenChange, selectedIds, onExported }: AssetTypeExportDialogProps) {
  const { t } = useTranslation("asset-types")

  const [includeLc, setIncludeLc] = React.useState(true)
  const [includeRel, setIncludeRel] = React.useState(true)

  React.useEffect(() => {
    if (!open) {
      setIncludeLc(true)
      setIncludeRel(true)
    }
  }, [open])

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error(t("exportImport.exportSelectionRequired"))
      return
    }
    await exportAssetTypes({
      document_type_ids: selectedIds,
      include_lifecycle: includeLc,
      include_relationships: includeRel,
    })
    onExported?.()
    onOpenChange(false)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("exportImport.exportTitle")}
      description={t("exportImport.exportDescription")}
      icon={Upload}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t("exportImport.exportAction"),
        onClick: handleExport,
        disabled: selectedIds.length === 0,
      }}
    >
      <div className="flex flex-col gap-5">
        {/* Resumen de la selección hecha en la tabla */}
        <p className="text-sm text-muted-foreground">
          {t("exportImport.exportSummary", { count: selectedIds.length })}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="export-include-lc" className="text-sm cursor-pointer">
              {t("exportImport.includeLc")}
            </Label>
            <Switch
              id="export-include-lc"
              checked={includeLc}
              onCheckedChange={setIncludeLc}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="export-include-rel" className="text-sm cursor-pointer">
              {t("exportImport.includeRel")}
            </Label>
            <Switch
              id="export-include-rel"
              checked={includeRel}
              onCheckedChange={setIncludeRel}
            />
          </div>
        </div>
      </div>
    </HuemulDialog>
  )
}
