import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import type { ImagePreviewDialogProps } from "@/types/assets"
export type { ImagePreviewDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export function ImagePreviewDialog({
  open,
  onOpenChange,
  image,
}: ImagePreviewDialogProps) {
  const { t } = useTranslation(["assets", "common"])

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={image?.name || t('customFieldsList.imagePreview')}
      maxWidth="sm:max-w-2xl"
      maxHeight="max-h-[90vh]"
      showFooter={false}
    >
      <div className="flex justify-center">
        {image && (
          <img
            src={image.url}
            alt={image.name}
            className="max-h-[70vh] w-auto object-contain rounded"
          />
        )}
      </div>
    </HuemulDialog>
  )
}
