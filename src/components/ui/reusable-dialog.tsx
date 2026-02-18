import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface ReusableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  footer?: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  maxHeight?: string
  showDefaultFooter?: boolean
  onCancel?: () => void
  onSubmit?: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  isValid?: boolean
  formId?: string
}

const maxWidthClasses = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[800px]",
  "2xl": "sm:max-w-[1000px]",
  full: "sm:max-w-[90vw]",
}

export function ReusableDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  footer,
  maxWidth = "md",
  maxHeight,
  showDefaultFooter = false,
  onCancel,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  isValid = true,
  formId,
}: ReusableDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${maxWidthClasses[maxWidth]} ${maxHeight ? 'flex flex-col p-0' : ''}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {maxHeight ? (
          <>
            <div className="px-6 pt-6 flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {Icon && <Icon className="h-4 w-4 text-[#4464f7]" />}
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-xs">
                    {description}
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {children}
            </div>
            
            {(footer || showDefaultFooter) && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                {footer || (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="hover:cursor-pointer"
                    >
                      {cancelLabel}
                    </Button>
                    <Button
                      type={formId ? "submit" : "button"}
                      form={formId}
                      onClick={formId ? undefined : onSubmit}
                      disabled={isSubmitting || !isValid}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                    >
                      {isSubmitting ? `${submitLabel}...` : submitLabel}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-[#4464f7]" />}
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription>
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="space-y-6">
              {children}
            </div>
            
            {(footer || showDefaultFooter) && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {footer || (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="hover:cursor-pointer"
                    >
                      {cancelLabel}
                    </Button>
                    <Button
                      type={formId ? "submit" : "button"}
                      form={formId}
                      onClick={formId ? undefined : onSubmit}
                      disabled={isSubmitting || !isValid}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                    >
                      {isSubmitting ? `${submitLabel}...` : submitLabel}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
