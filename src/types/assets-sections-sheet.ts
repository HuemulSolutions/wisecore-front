import type { LifecyclePermissions } from '@/types/assets'

export interface SectionSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  fullDocument?: any
  documentName?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  executionId?: string | null
  executionInfo?: {
    id: string
    name: string
    status: string
    created_at: string
    formattedDate?: string
    isLatest?: boolean
  } | null
  lifecyclePermissions?: LifecyclePermissions
  stage?: string
  showTrigger?: boolean
}

export interface SectionsConfigExecution {
  id: string
  name?: string
  status?: string
  created_at?: string
}

export interface SectionsConfigSection {
  id: string
  name: string
  type?: "ai" | "manual" | "reference"
  prompt?: string
  order?: number
  dependencies?: Array<{ id: string; name: string }>
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  not_in_execution?: boolean | null
}

export interface SectionsConfigResponse {
  template_id?: string | null
  document?: {
    id: string
    name: string
    description?: string
    template_id?: string | null
  }
  executions?: {
    active?: SectionsConfigExecution | null
    others?: SectionsConfigExecution[]
  }
  sections?: SectionsConfigSection[]
}
