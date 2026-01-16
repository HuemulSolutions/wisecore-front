import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelActions } from "./models-actions"
import type { LLM } from "@/services/llms"

interface ModelsTableProps {
  models: LLM[]
  onEdit: (model: LLM) => void
  onDelete: (model: LLM) => void
  onDefaultChange: (llmId: string, isDefault: boolean) => void
  isDeleting: boolean
  openDropdowns: {[key: string]: boolean}
  onDropdownChange: (key: string, open: boolean) => void
}

export function ModelsTable({ 
  models, 
  onEdit, 
  onDelete, 
  onDefaultChange, 
  isDeleting,
  openDropdowns,
  onDropdownChange
}: ModelsTableProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">No models configured</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/30">
            <TableHead className="text-foreground font-medium text-xs py-2">Display Name</TableHead>
            <TableHead className="text-foreground font-medium text-xs py-2">Technical Name</TableHead>
            <TableHead className="text-foreground font-medium text-xs py-2">Default</TableHead>
            <TableHead className="text-right text-foreground font-medium text-xs py-2">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => (
            <TableRow key={model.id} className="border-b border-border hover:bg-muted/20 transition">
              <TableCell className="font-semibold text-foreground text-xs py-2">{model.name}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs py-2">
                {model.internal_name}
              </TableCell>
              <TableCell className="py-2">
                <Checkbox
                  checked={model.is_default || false}
                  onCheckedChange={(checked) =>
                    onDefaultChange(model.id, checked as boolean)
                  }
                  className="scale-90"
                />
              </TableCell>
              <TableCell className="text-right py-2">
                <div className="flex justify-end gap-0.5">
                  <ModelActions
                    model={model}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                    dropdownOpen={openDropdowns[`model-${model.id}`] || false}
                    onDropdownChange={(open) => onDropdownChange(`model-${model.id}`, open)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}