import type { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ReusableAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  isProcessing?: boolean
  variant?: "default" | "destructive"
}

export function ReusableAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  variant = "destructive",
}: ReusableAlertDialogProps) {
  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(open) => {
        if (!open && !isProcessing) {
          onOpenChange(open)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== 'string'}>
            {typeof description === 'string' ? (
              description
            ) : (
              <div>{description}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing} className="hover:cursor-pointer">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
                : "bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            }
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {confirmLabel}...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
