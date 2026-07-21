"use client"

import * as React from "react"
import { Download, Loader2, FileJson, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { importTemplates } from "@/services/templates"
import type { ImportTemplatesData } from "@/types/templates"

interface TemplatesImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string | null
  onImportSuccess?: () => void
}

type OnConflict = "skip" | "overwrite"

export function TemplatesImportSheet({ open, onOpenChange, organizationId, onImportSuccess }: TemplatesImportSheetProps) {
  const { t } = useTranslation("templates")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [file, setFile] = React.useState<File | null>(null)
  const [onConflict, setOnConflict] = React.useState<OnConflict>("skip")
  const [isImporting, setIsImporting] = React.useState(false)
  const [result, setResult] = React.useState<ImportTemplatesData | null>(null)

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setOnConflict("skip")
      setIsImporting(false)
      setResult(null)
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file || !organizationId) return
    setIsImporting(true)
    try {
      const data = await importTemplates(organizationId, file, { on_conflict: onConflict })
      setResult(data)
      if (data.imported > 0) {
        onImportSuccess?.()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar")
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportAnother = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("exportImport.importTitle")}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t("exportImport.importDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {result ? (
            /* ── Result phase ── */
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("exportImport.resultTitle")}
              </p>

              {/* Counters */}
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1.5 text-xs font-medium text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("exportImport.resultImported", { count: result.imported })}
                </Badge>
                <Badge variant="outline" className="gap-1.5 text-xs font-medium text-muted-foreground">
                  {t("exportImport.resultSkipped", { count: result.skipped })}
                </Badge>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <Alert variant="destructive" className="py-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-1.5">
                    <p className="text-xs">{t("exportImport.resultErrorNote")}</p>
                    <p className="text-xs font-semibold">{t("exportImport.resultErrors", { count: result.errors.length })}</p>
                    <ul className="flex flex-col gap-1">
                      {result.errors.map((err, i) => (
                        <li key={i} className="text-xs font-mono bg-destructive/10 rounded px-2 py-1 break-all">{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert className="py-3 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {t("exportImport.resultWarnings", { count: result.warnings.length })}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-700 dark:text-amber-400 break-all">{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button variant="outline" size="sm" onClick={handleImportAnother} className="self-start">
                {t("exportImport.importAnother")}
              </Button>
            </div>
          ) : (
            /* ── Configuration phase ── */
            <>
              {/* File input */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("exportImport.fileLabel")}
                </p>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors">
                  <FileJson className="h-7 w-7 text-muted-foreground/50" />
                  {file ? (
                    <span className="text-sm font-medium text-foreground text-center break-all">{file.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("exportImport.fileHint")}</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* On-conflict */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("exportImport.onConflictLabel")}
                </Label>
                <Select value={onConflict} onValueChange={(v) => setOnConflict(v as OnConflict)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">{t("exportImport.onConflictSkip")}</SelectItem>
                    <SelectItem value="overwrite">{t("exportImport.onConflictOverwrite")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="border-t px-6 py-4 shrink-0">
            <Button
              className="w-full"
              disabled={!file || isImporting}
              onClick={handleImport}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("exportImport.importingAction")}
                </>
              ) : (
                t("exportImport.importAction")
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
