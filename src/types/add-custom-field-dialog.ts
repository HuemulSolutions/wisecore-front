export interface AddCustomFieldDialogProps {
  isOpen: boolean
  onClose: () => void
  entityId: string
  entityType: "document" | "template"
  onAdd: (data: any) => Promise<any>
  uploadImageFn: (entityCustomFieldId: string, file: File, organizationId: string) => Promise<void>
  sources: string[]
  isLoadingSources: boolean
  onImageUploadStart?: (fieldId: string) => void
  onImageUploadComplete?: () => void
  /** Gatea únicamente la rama "crear campo nuevo" (custom_fields:c). No afecta
   * asociar un campo existente a la entidad, que es un recurso distinto. */
  canCreateCustomField?: boolean
}
