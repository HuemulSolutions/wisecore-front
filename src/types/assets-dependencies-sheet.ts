import type { LifecyclePermissions } from '@/types/assets'

export interface DependenciesSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  documentName?: string
  lifecyclePermissions?: LifecyclePermissions
  stage?: string
  showTrigger?: boolean
}
