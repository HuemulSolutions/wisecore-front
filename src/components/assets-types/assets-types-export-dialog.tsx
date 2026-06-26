"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import type { FetchOptionsParams } from "@/types/huemul"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getAssetTypes, exportAssetTypes } from "@/services/asset-types"

interface AssetTypeExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetTypeExportDialog({ open, onOpenChange }: AssetTypeExportDialogProps) {
  const { t } = useTranslation("asset-types")

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [includeLc, setIncludeLc] = React.useState(true)
  const [includeRel, setIncludeRel] = React.useState(true)

  React.useEffect(() => {
    if (!open) {
      setSelectedIds([])
      setIncludeLc(true)
      setIncludeRel(true)
    }
  }, [open])

  const fetchOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      const res = await getAssetTypes(page, pageSize, search || undefined)
      return {
        options: res.data.map((d) => ({
          value: d.id,
          label: d.name,
          color: d.color ?? undefined,
        })),
        hasMore: res.has_next ?? false,
      }
    },
    [],
  )

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
        {/* Asset type multiselect con búsqueda server-side */}
        <HuemulCombobox
          value={selectedIds}
          onValueChange={(v) => setSelectedIds(v as string[])}
          multiSelect
          fetchOptions={fetchOptions}
          pageSize={100}
          placeholder={t("exportImport.selectAll")}
        />

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
